import { type Ant } from "../../src/sim/ant";
import { NEST_CONFIG } from "../../src/sim/config";
import { type Controller, type SensorPolicy } from "../../src/sim/controller/contract";
import {
  backboneVector,
  colonySeedVector,
  derivedColonySeedVector,
  diggerSeedVector,
  functionalSeedVector,
  rnnController,
  setRuntimeSeedBase,
} from "../../src/sim/controller/rnn";
import { maxEnergy } from "../../src/sim/energy";
import { voxelIndex } from "../../src/sim/grid";
import { Material } from "../../src/sim/materials";
import { buildAuthoredNestWorld, type AuthoredNestWorld } from "../../src/sim/nestWorld";
import { exchangeMaterialScent, sampleMaterialScent } from "../../src/sim/materialScent";
import {
  colonyLoopOracle,
  resetColonyLoopOracle,
  tuneColonyLoopOracle,
} from "../../src/sim/oracles/colonyLoop";
import { emitFoodScent, stepScentField } from "../../src/sim/scent";
import { COLONY, ENERGY } from "../../src/sim/tunables";
import { mutateVoxel, stepWorld, type World } from "../../src/sim/world";
import { flag, intFlag, seedsOf, type Flags } from "../lib/flags";
import { openLedger, recordRun, type TraceSample } from "../lib/ledger";
import { applyPatches } from "../lib/patch";
import { energyCeilingEpisode, energyEpisode, energySeedEpisode } from "./colonyLoopEnergy";
import { fieldNavigationEpisode } from "./colonyLoopField";
import { colonyOdorEpisode } from "./colonyOdorField";
import {
  createForageProgress,
  forageProgressSummary,
  observeForageProgress,
  recordForageSignals,
  recordLoadedMove,
} from "./colonyLoopProgress";
import {
  type ColonyLoopResult,
  type FoodSite,
  type ForageProgress,
  type SensorFrame,
} from "./colonyLoopTypes";

export type { ColonyLoopResult, SensorFrame } from "./colonyLoopTypes";

interface PreparedForage {
  readonly setup: AuthoredNestWorld;
  readonly ant: Ant;
  readonly start: { x: number; y: number; z: number; heading: number };
  readonly food: FoodSite;
  readonly initialFood: number;
  readonly progress: ForageProgress;
  readonly trace: TraceSample[];
  elapsed: number;
}

const FOOD_OFFSETS: readonly (readonly [number, number])[] = [
  [3, 1],
  [2, 3],
  [-3, 2],
  [-2, -3],
  [1, -3],
  [3, -1],
];

const PATCH_OFFSETS: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function onSurface(world: World, ant: Ant): boolean {
  const surface = world.surfaceMap[ant.z * world.grid.sizeX + ant.x];
  return ant.y >= surface + 1;
}

function surfaceFoodY(world: World, x: number, z: number): number | null {
  const y = world.surfaceMap[z * world.grid.sizeX + x] + 1;
  const here = world.grid.data[voxelIndex(world.grid, x, y, z)];
  const below = world.grid.data[voxelIndex(world.grid, x, y - 1, z)];
  return here === Material.AIR && below !== Material.AIR ? y : null;
}

function chooseFoodSite(setup: AuthoredNestWorld, seed: number): FoodSite {
  const { world, nest } = setup;
  for (let offset = 0; offset < FOOD_OFFSETS.length; offset++) {
    const [dx, dz] = FOOD_OFFSETS[(seed + offset) % FOOD_OFFSETS.length];
    const x = nest.entrance.x + dx;
    const z = nest.entrance.z + dz;
    const y = surfaceFoodY(world, x, z);
    if (y !== null) {
      return { x, y, z };
    }
  }
  throw new Error(`seed ${seed} has no legal authored food site`);
}

function isolateForager(setup: AuthoredNestWorld, seed: number): Ant {
  const starts = setup.nest.junctions.slice(0, 2).map((junction) => junction.point);
  const start = starts[seed % starts.length];
  const ant = setup.world.ants[0];
  setup.world.ants = [ant];
  ant.x = start.x;
  ant.y = start.y;
  ant.z = start.z;
  ant.prevX = start.x;
  ant.prevY = start.y;
  ant.prevZ = start.z;
  ant.heading = setup.world.rng.next() * Math.PI * 2;
  ant.energy = maxEnergy(ant);
  ant.carrying = null;
  ant.spoilLoads = 0;
  ant.carryLoad = 0;
  return ant;
}

function placeFoodPatch(world: World, center: FoodSite): void {
  for (const [dx, dz] of PATCH_OFFSETS) {
    const x = center.x + dx;
    const z = center.z + dz;
    const y = surfaceFoodY(world, x, z);
    if (y !== null) {
      mutateVoxel(world, x, y, z, Material.FOOD);
    }
  }
}

function warmSteadyCarriers(setup: AuthoredNestWorld, foodPasses = 100): void {
  const { world } = setup;
  for (let pass = 0; pass < foodPasses; pass++) {
    emitFoodScent(world.grid, world.foodScent, world.foodSources);
    stepScentField(world.grid, world.foodScent);
  }
}

function warmCacheCarriers(world: World, passes = 100): void {
  for (let pass = 0; pass < passes; pass++) {
    emitFoodScent(world.grid, world.foodScent, world.foodSources);
    stepScentField(world.grid, world.foodScent);
    stepScentField(world.grid, world.colonyScent);
    exchangeMaterialScent(world.grid, world.colonyScent, world.materialColonyScent);
  }
}

function relocateForRetrieval(episode: PreparedForage): void {
  const { ant, start, progress } = episode;
  ant.x = start.x;
  ant.y = start.y;
  ant.z = start.z;
  ant.prevX = start.x;
  ant.prevY = start.y;
  ant.prevZ = start.z;
  ant.heading = start.heading;
  ant.moveCharge = 0;
  ant.verticalAttention = 0;
  ant.sensoryHistoryReady = false;
  ant.lastInputs.fill(0);
  ant.lastOutputs.fill(0);
  progress.priorLoad = ant.carryLoad;
}

export function fixedRnnController(vector: Float32Array): Controller {
  const genome = () => rnnController.deserializeGenome(Float32Array.from(vector));
  return {
    ...rnnController,
    seed: genome,
    fixedSeed: genome,
  };
}

function prepareForage(
  seed: number,
  policy: SensorPolicy | null,
  controller: Controller = rnnController
): PreparedForage {
  resetColonyLoopOracle();
  const setup = buildAuthoredNestWorld(seed, controller, NEST_CONFIG);
  const { world } = setup;
  world.foodBase = 0;
  world.foodTarget = 0;
  removeSurfaceFood(world);
  world.sensorPolicyOverride = policy;
  const ant = isolateForager(setup, seed);
  const start = { x: ant.x, y: ant.y, z: ant.z, heading: ant.heading };
  const food = chooseFoodSite(setup, seed);
  placeFoodPatch(world, food);
  warmSteadyCarriers(setup);
  return {
    setup,
    ant,
    start,
    food,
    initialFood: world.foodSources.size,
    progress: createForageProgress(ant),
    trace: [],
    elapsed: 0,
  };
}

function advanceForage(
  episode: PreparedForage,
  cadence: number,
  phase: SensorFrame["phase"],
  record?: (frame: SensorFrame) => void
): void {
  const { world } = episode.setup;
  const { ant, food, progress, trace } = episode;
  const wasLoaded = ant.carryLoad > 0;
  const previous = { x: ant.x, y: ant.y, z: ant.z };
  episode.elapsed += 1;
  stepWorld(world);
  record?.({
    inputs: Float32Array.from(ant.lastInputs),
    outputs: Float32Array.from(ant.lastOutputs),
    phase,
  });
  recordLoadedMove(progress, ant, previous, wasLoaded);
  const surfaced = onSurface(world, ant);
  recordForageSignals(progress, ant, food, episode.setup.nest.entrance, surfaced);
  observeForageProgress(world, progress, ant, surfaced, episode.elapsed);
  if (episode.elapsed % cadence === 0) {
    trace.push({
      tick: episode.elapsed,
      antId: ant.id,
      x: ant.x,
      y: ant.y,
      z: ant.z,
      energy: ant.energy,
    });
  }
}

function runForage(
  episode: PreparedForage,
  ticks: number,
  cadence: number,
  stop: (episode: PreparedForage) => boolean,
  phase: SensorFrame["phase"],
  record?: (frame: SensorFrame) => void
): void {
  for (let tick = 0; tick < ticks; tick++) {
    advanceForage(episode, cadence, phase, record);
    if (stop(episode)) return;
  }
}

function runForageEpisode(
  seed: number,
  ticks: number,
  cadence: number,
  policy: SensorPolicy | null
): ColonyLoopResult {
  const episode = prepareForage(seed, policy);
  runForage(episode, ticks, cadence, ({ progress }) => progress.depositTick !== null, "forage");
  return {
    params: { start: episode.start, food: episode.food },
    summary: forageProgressSummary(episode.ant, episode.progress, episode.elapsed),
    trace: episode.trace,
  };
}

function forageEpisode(seed: number, ticks: number, cadence: number): ColonyLoopResult {
  return runForageEpisode(seed, ticks, cadence, colonyLoopOracle);
}

export function seededForageEpisode(
  seed: number,
  ticks: number,
  cadence: number
): ColonyLoopResult {
  return runForageEpisode(seed, ticks, cadence, null);
}

function isCachedFood(world: World, index: number): boolean {
  const x = index % world.grid.sizeX;
  const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
  const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
  return y <= world.surfaceMap[z * world.grid.sizeX + x];
}

function cachedFood(world: World): number[] {
  return [...world.foodSources].filter((index) => isCachedFood(world, index));
}

function removeSurfaceFood(world: World): void {
  for (const index of [...world.foodSources]) {
    if (isCachedFood(world, index)) continue;
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
    mutateVoxel(world, x, y, z, Material.AIR);
  }
}

function runCacheEpisode(
  seed: number,
  ticks: number,
  cadence: number,
  policy: SensorPolicy | null,
  record?: (frame: SensorFrame) => void,
  controller: Controller = rnnController
): ColonyLoopResult {
  const episode = prepareForage(seed, policy, controller);
  const world = episode.setup.world;
  // Isolate physical surplus storage: otherwise the colony crop consumes the
  // first delivery before a FOOD voxel can exist for the retrieval half.
  episode.setup.colony.stockpile = COLONY.stockpileSatiation + maxEnergy(episode.ant);
  runForage(
    episode,
    ticks,
    cadence,
    ({ setup }) => cachedFood(setup.world).length >= 1,
    "abundance",
    record
  );
  const cacheAfterAbundance = cachedFood(world);
  const foodEatenBeforeScarcity = world.metrics.foodEaten;
  const foodDepositedBeforeScarcity = world.metrics.foodDeposited;
  const foodDeliveredBeforeScarcity = world.metrics.foodDelivered;
  const stockpileBeforeScarcity = episode.setup.colony.stockpile;
  const conservedFoodUnits =
    world.foodSources.size + episode.ant.spoilLoads + foodEatenBeforeScarcity;
  removeSurfaceFood(world);
  warmCacheCarriers(world);
  const cacheBeforeScarcity = cachedFood(world).length;
  const cacheColonyOdor = cacheAfterAbundance.map((index) =>
    sampleMaterialScent(world.materialColonyScent, index, episode.ant.lineageId)
  );
  relocateForRetrieval(episode);
  episode.ant.energy = maxEnergy(episode.ant) * 0.2;
  const energyBefore = episode.ant.energy + cacheBeforeScarcity * ENERGY.foodEnergy;
  const scarcityStartTick = episode.elapsed;
  runForage(
    episode,
    ticks,
    cadence,
    ({ setup }) => cachedFood(setup.world).length < cacheBeforeScarcity,
    "scarcity",
    record
  );
  const cacheAfterScarcity = cachedFood(world).length;
  const energyAfter = episode.ant.energy + cacheAfterScarcity * ENERGY.foodEnergy;
  return {
    params: { start: episode.start, food: episode.food },
    summary: {
      ...forageProgressSummary(episode.ant, episode.progress, episode.elapsed),
      cacheAfterAbundance: cacheAfterAbundance.length,
      cachePositions: cacheAfterAbundance,
      cacheBeforeScarcity,
      cacheAfterScarcity,
      cacheColonyOdor,
      cacheGrew: cacheAfterAbundance.length > 0,
      cacheDrained: cacheAfterScarcity < cacheBeforeScarcity,
      foodMassConserved: conservedFoodUnits === episode.initialFood,
      foodEatenBeforeScarcity,
      foodDepositedBeforeScarcity,
      foodDeliveredBeforeScarcity,
      stockpileBeforeScarcity,
      retrievalEnergyBefore: energyBefore,
      retrievalEnergyAfter: energyAfter,
      retrievalAccountedLoss: energyBefore - energyAfter,
      retrievalTicks: episode.elapsed - scarcityStartTick,
    },
    trace: episode.trace,
  };
}

function cacheEpisode(seed: number, ticks: number, cadence: number): ColonyLoopResult {
  return runCacheEpisode(seed, ticks, cadence, colonyLoopOracle);
}

export function seededCacheEpisode(seed: number, ticks: number, cadence: number): ColonyLoopResult {
  return runCacheEpisode(seed, ticks, cadence, null);
}

/** Evaluate one exact recurrent vector without founder noise. */
export function exactCacheEpisode(
  seed: number,
  ticks: number,
  cadence: number,
  vector: Float32Array
): ColonyLoopResult {
  return runCacheEpisode(seed, ticks, cadence, null, undefined, fixedRnnController(vector));
}

/** Oracle-labelled sensor/output sequence for recurrent behavior cloning. */
export function oracleCacheDemonstration(
  seed: number,
  ticks: number
): { frames: SensorFrame[]; result: ColonyLoopResult } {
  const frames: SensorFrame[] = [];
  const result = runCacheEpisode(seed, ticks, 0, colonyLoopOracle, (frame) => frames.push(frame));
  return { frames, result };
}

function driverFor(stage: string): string {
  if (stage === "oracle-energy-ceiling") return "omniscient-pathing-oracle";
  if (stage.startsWith("seeded-")) return "seed-e-rnn";
  return "sensor-oracle";
}

function selectSeedBase(name: string): Float32Array | null {
  if (name === "baked") return null;
  if (name === "backbone") return backboneVector();
  if (name === "functional") return functionalSeedVector();
  if (name === "colony") return colonySeedVector();
  if (name === "derived") return derivedColonySeedVector();
  if (name === "digger") return diggerSeedVector();
  throw new Error(`unknown seed base "${name}"`);
}

/** Run the Appendix E behavioral ladder in the measurement harness. */
export function runColonyLoop(flags: Flags): void {
  const stage = flag(flags, "stage", "oracle-forage");
  const episodes: Record<string, typeof forageEpisode> = {
    "field-navigation": fieldNavigationEpisode,
    "colony-odor": colonyOdorEpisode,
    "oracle-forage": forageEpisode,
    "seeded-forage": seededForageEpisode,
    "seeded-cache": seededCacheEpisode,
    "oracle-cache": cacheEpisode,
    "oracle-energy": energyEpisode,
    "oracle-energy-ceiling": energyCeilingEpisode,
    "seeded-energy": energySeedEpisode,
  };
  const episode = episodes[stage];
  if (!episode) {
    throw new Error(`unknown colony-loop stage "${stage}"`);
  }
  const ticks = intFlag(flags, "ticks", 2500);
  const cadence = intFlag(flags, "cadence", 25);
  const stereoGain = Number(flag(flags, "stereo-gain", "6"));
  const label = flag(flags, "label", "");
  const seedBase = flag(flags, "seed-base", "baked");
  const patches = flags.values.get("patch") ?? [];
  const db = openLedger();
  const restore = applyPatches(patches);
  const restoreOracle = tuneColonyLoopOracle(stereoGain);
  setRuntimeSeedBase(selectSeedBase(seedBase));
  try {
    for (const seed of seedsOf(flags, "9100,9101,9102,9103,9104")) {
      const started = Date.now();
      const result = episode(seed, ticks, cadence);
      const runId = recordRun(
        db,
        {
          experiment: `colony-loop/${stage}`,
          label,
          driver: driverFor(stage),
          seed,
          ticks,
          cadence,
          params: { ...result.params, stereoGain, seedBase },
          patches,
          summary: result.summary,
          wallMs: Date.now() - started,
        },
        [],
        result.trace
      );
      console.log(`[run ${runId}] ${stage} seed=${seed} ${JSON.stringify(result.summary)}`);
    }
  } finally {
    setRuntimeSeedBase(null);
    restoreOracle();
    restore();
  }
}

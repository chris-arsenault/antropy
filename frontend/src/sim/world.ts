import { createAnt, surfaceSpawnY, type Ant, type AntSpawn } from "./ant";
import { buildAntIndex } from "./antIndex";
import { affectedChunkKeys } from "./chunks";
import { stepColonies, type Colony } from "./colony";
import { type Controller, type SensorPolicy } from "./controller/contract";
import { stampVisit, stepDecay } from "./decay";
import { rnnController } from "./controller/rnn";
import { stepEggs, syncCarriedEggs, type Egg } from "./eggs";
import { reapDead } from "./energy";
import { stepFoodGovernor } from "./foodSpawner";
import { getVoxel, setVoxel, voxelIndex, type VoxelGrid } from "./grid";
import { Material, type MaterialId } from "./materials";
import {
  clearMaterialScent,
  createMaterialScentField,
  exchangeMaterialScent,
  type MaterialScentField,
} from "./materialScent";
import { assertWorldViability } from "./ratios";
import { createRng, type Rng, type RngState } from "./rng";
import {
  createScentField,
  emitFoodScent,
  emitNestScent,
  stepScentField,
  type ScentField,
} from "./scent";
import { createInputBuffer, type SenseContext } from "./senses";
import { stepAnt } from "./antStep";
import { generateTerrain, surfaceHeight } from "./terrain";
import { stepAutoContinue } from "./continuity";
import { microclimateMultiplier, stepWeather } from "./weather";
import { FULL_CONFIG, type SimConfig } from "./config";
import {
  BEACON_PHYSICS,
  COLONY_ODOR_PHYSICS,
  DECAY,
  FOOD_GOVERNOR,
  NEST_PHYSICS,
  SCENT,
  TRAIL_PHYSICS,
} from "./tunables";

export interface WorldMetrics {
  surfaceFoodEnergyGathered: number;
  foodEnergyConsumed: number;
  foodEaten: number;
  energyBurned: number;
  foodSpawned: number;
  foodPickedUp: number;
  foodDeposited: number;
  foodDelivered: number;
  workerBirths: number;
  workerDeaths: number;
  broodStarved: number;
  broodExposed: number;
  queenDeaths: number;
}

function createMetrics(): WorldMetrics {
  return {
    surfaceFoodEnergyGathered: 0,
    foodEnergyConsumed: 0,
    foodEaten: 0,
    energyBurned: 0,
    foodSpawned: 0,
    foodPickedUp: 0,
    foodDeposited: 0,
    foodDelivered: 0,
    workerBirths: 0,
    workerDeaths: 0,
    broodStarved: 0,
    broodExposed: 0,
    queenDeaths: 0,
  };
}

export interface World {
  /** Feature gates (design spec §13 build phases); see config.ts. */
  config: SimConfig;
  readonly seed: number;
  tick: number;
  rng: Rng;
  /** Dedicated stream for storm scheduling/washes: weather never perturbs
   * the behavioral rng sequence. */
  weatherRng: Rng;
  /** Ticks of active rain left; 0 = clear skies. */
  rainRemaining: number;
  grid: VoxelGrid;
  ants: Ant[];
  nextAntId: number;
  eggs: Egg[];
  /** Single world-wide egg id counter: every lay path draws from it, so
   * ids are unique (composite per-colony/per-tick schemes collided). */
  nextEggId: number;
  /** Voxel-keyed egg lookup, maintained on lay/hatch/eat. */
  eggIndex: Map<number, Egg>;
  colonies: Colony[];
  nextColonyId: number;
  /** Metapopulation counters (spec §9.1): real foundings and collapses. */
  foundings: number;
  foundingFailures: number;
  collapses: number;
  /** Queen-destined eggs lost to predation — visible, never silent. */
  queenEggsEaten: number;
  /** Brood ledger (§B.8.2 egg-survival fraction): all eggs ever laid and
   * those lost to exposure. */
  eggsLaid: number;
  eggsPerished: number;
  /** Cumulative conservation and lifecycle counters shown in the UI and harness. */
  metrics: WorldMetrics;
  /** Auto-continue counters (R3); the gate is config.autoContinue. */
  continuations: number;
  lastContinueTick: number;
  pheromoneA: ScentField;
  pheromoneB: ScentField;
  foodScent: ScentField;
  /** Colony-tagged homing signal emitted at each living queen site. */
  nestScent: ScentField;
  /** Airborne colony identity re-emitted by marked material. */
  colonyScent: ScentField;
  /** Colony odor absorbed into solid nest fabric and handled materials. */
  materialColonyScent: MaterialScentField;
  /** Voxel indices currently holding FOOD, maintained by mutateVoxel. */
  foodSources: Set<number>;
  /** FOOD voxels placed by worker deposit, independent of their chosen depth. */
  storedFood: Set<number>;
  /** Seasonal baseline for the food governor; 0 disables food entirely. */
  foodBase: number;
  /** Current FOOD-voxel target, recomputed each governor pass (§9.3). */
  foodTarget: number;
  /** Initial terrain surface per column (x-fastest), for decay/exposure/render. */
  surfaceMap: Int16Array;
  /** Subsurface air voxels (tunnels/chambers), maintained by mutateVoxel. */
  cavities: Set<number>;
  /** Last tick an ant (or the queen) occupied each voxel — decay's clock. */
  lastVisit: Uint32Array;
  /** The behavioral controller for every ant (design spec §2.3). */
  controller: Controller;
  /** Sensor-parity diagnostic controller; state is private and per ant. */
  sensorPolicyOverride: SensorPolicy | null;
  sensorPolicyStates: Map<number, unknown>;
  /**
   * Change feed for the renderer: chunk keys whose voxels changed since the
   * last drain. Transient — rebuilt, never checkpointed.
   */
  dirtyChunks: Set<number>;
  /**
   * Diagnostic policy override (ADR-0009): when set, drives ants instead of
   * the controller. Harness-only; transient, never checkpointed. Returning
   * null for an ant falls through to the controller.
   */
  policyOverride: ((world: World, ant: Ant, inputs: Float32Array) => Float32Array | null) | null;
}

export interface WorldSnapshot {
  seed: number;
  tick: number;
  rngState: RngState;
}

function buildSurfaceMap(seed: number, grid: VoxelGrid): Int16Array {
  const map = new Int16Array(grid.sizeX * grid.sizeZ);
  for (let z = 0; z < grid.sizeZ; z++) {
    for (let x = 0; x < grid.sizeX; x++) {
      map[z * grid.sizeX + x] = surfaceHeight(seed, x, z);
    }
  }
  return map;
}

export function createWorld(
  seed: number,
  controller: Controller = rnnController,
  config: SimConfig = FULL_CONFIG
): World {
  const grid = generateTerrain(seed);
  const world: World = {
    config: { ...config }, // per-world copy: presets stay immutable
    seed,
    tick: 0,
    rng: createRng(seed),
    weatherRng: createRng(seed ^ 0x5eed0c1d),
    rainRemaining: 0,
    grid,
    ants: [],
    nextAntId: 1,
    eggs: [],
    nextEggId: 1,
    eggIndex: new Map(),
    colonies: [],
    nextColonyId: 1,
    foundings: 0,
    foundingFailures: 0,
    collapses: 0,
    queenEggsEaten: 0,
    eggsLaid: 0,
    eggsPerished: 0,
    metrics: createMetrics(),
    continuations: 0,
    lastContinueTick: 0,
    pheromoneA: createScentField(grid, TRAIL_PHYSICS),
    pheromoneB: createScentField(grid, TRAIL_PHYSICS),
    foodScent: createScentField(grid, BEACON_PHYSICS),
    nestScent: createScentField(grid, NEST_PHYSICS),
    colonyScent: createScentField(grid, COLONY_ODOR_PHYSICS),
    materialColonyScent: createMaterialScentField(grid),
    foodSources: new Set(),
    storedFood: new Set(),
    foodBase: FOOD_GOVERNOR.targetCount,
    foodTarget: FOOD_GOVERNOR.targetCount,
    surfaceMap: buildSurfaceMap(seed, grid),
    cavities: new Set(),
    lastVisit: new Uint32Array(grid.data.length),
    controller,
    sensorPolicyOverride: null,
    sensorPolicyStates: new Map(),
    policyOverride: null,
    dirtyChunks: new Set(),
  };
  assertWorldViability(world);
  return world;
}

export function spawnAnt(world: World, spawn: AntSpawn): Ant {
  const ant = createAnt(world.nextAntId, spawn);
  world.nextAntId += 1;
  world.ants.push(ant);
  return ant;
}

/** Spawn surface foragers with founder genomes from the world's controller. */
/**
 * Spawn a digging crew clustered at the map centre. Clustering is the
 * point: crowding is what turns the overflow reflex on, so a tight crew
 * excavates a branched nest where a scattered one sinks separate holes.
 */
export function populateDiggers(world: World, count: number): void {
  const cx = Math.floor(world.grid.sizeX / 2);
  const cz = Math.floor(world.grid.sizeZ / 2);
  for (let i = 0; i < count; i++) {
    const x = cx + ((i % 3) - 1);
    const z = cz + ((Math.floor(i / 3) % 3) - 1);
    const y = surfaceSpawnY(world.grid, x, z);
    if (y === null) {
      continue;
    }
    const genome = world.controller.seed(world.rng);
    spawnAnt(world, {
      x,
      y,
      z,
      heading: 0,
      energy: 1,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
      genome,
      controllerState: world.controller.createState(),
      traits: world.controller.physical(genome),
    });
  }
}

export function populateForagers(world: World, count: number): void {
  for (let i = 0; i < count; i++) {
    const x = 8 + Math.floor(world.rng.next() * (world.grid.sizeX - 16));
    const z = 8 + Math.floor(world.rng.next() * (world.grid.sizeZ - 16));
    const y = surfaceSpawnY(world.grid, x, z);
    if (y === null) {
      continue;
    }
    const genome = world.controller.seed(world.rng);
    spawnAnt(world, {
      x,
      y,
      z,
      heading: world.rng.next() * Math.PI * 2,
      energy: 1,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
      genome,
      controllerState: world.controller.createState(),
      traits: world.controller.physical(genome),
    });
  }
}

function stepScents(world: World): void {
  emitFoodScent(world.grid, world.foodScent, world.foodSources);
  stepScentField(world.grid, world.nestScent);
  for (const colony of world.colonies) {
    emitNestScent(
      world.grid,
      world.nestScent,
      voxelIndex(world.grid, colony.x, colony.y, colony.z),
      colony.id
    );
  }
  if (world.config.materialColonyOdor) {
    stepScentField(world.grid, world.colonyScent);
    exchangeMaterialScent(world.grid, world.colonyScent, world.materialColonyScent);
  }
  stepScentField(world.grid, world.pheromoneA);
  stepScentField(world.grid, world.pheromoneB);
  stepScentField(world.grid, world.foodScent);
}

/**
 * Advance the world by exactly one fixed timestep. System order is fixed and
 * load-bearing for determinism: scents, food governor, colonies, eggs, then
 * ants in array order, then reaping.
 */
export function stepWorld(world: World): void {
  world.tick += 1;
  if (world.config.weather) {
    stepWeather(world);
  }
  if (world.tick % SCENT.stepInterval === 0) {
    stepScents(world);
  }
  if (world.tick % FOOD_GOVERNOR.interval === 0) {
    stepFoodGovernor(world);
  }
  stepColonies(world);
  for (const colony of world.colonies) {
    stampVisit(world, colony.x, colony.y, colony.z);
  }
  stepEggs(world);
  if (world.config.nestDecay && world.tick % DECAY.interval === 0) {
    stepDecay(world);
  }

  const ctx: SenseContext = {
    grid: world.grid,
    surfaceMap: world.surfaceMap,
    pheromoneA: world.pheromoneA,
    pheromoneB: world.pheromoneB,
    foodScent: world.foodScent,
    nestScent: world.nestScent,
    colonyScent: world.colonyScent,
    materialColonyScent: world.materialColonyScent,
    config: world.config,
    colonies: world.colonies,
    antIndex: buildAntIndex(world.grid, world.ants),
    eggIndex: world.eggIndex,
    climate: (ant) => (world.config.microclimate ? microclimateMultiplier(world, ant) : 1),
  };
  const inputs = createInputBuffer();
  for (const ant of world.ants) {
    if (ant.alive) {
      stepAnt(world, ctx, inputs, ant);
    }
  }
  syncCarriedEggs(world);
  reapDead(world);
  stepAutoContinue(world);
}

/** The canonical voxel mutation path: writes the grid and feeds the renderer. */
export function mutateVoxel(
  world: World,
  x: number,
  y: number,
  z: number,
  material: MaterialId
): void {
  const index = voxelIndex(world.grid, x, y, z);
  const previous = getVoxel(world.grid, x, y, z);
  setVoxel(world.grid, x, y, z, material);
  if (material === Material.AIR) clearMaterialScent(world.materialColonyScent, index);
  if (previous === Material.FOOD) {
    world.foodSources.delete(index);
    world.storedFood.delete(index);
  }
  if (material === Material.FOOD) {
    world.foodSources.add(index);
  }
  if (y <= world.surfaceMap[z * world.grid.sizeX + x]) {
    if (material === Material.AIR) {
      world.cavities.add(index);
    } else {
      world.cavities.delete(index);
    }
  }
  for (const key of affectedChunkKeys(x, y, z)) {
    world.dirtyChunks.add(key);
  }
}

export function snapshotWorld(world: World): WorldSnapshot {
  return {
    seed: world.seed,
    tick: world.tick,
    rngState: world.rng.getState(),
  };
}

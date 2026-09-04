import { type Ant } from "../../src/sim/ant";
import { type Colony } from "../../src/sim/colony";
import { NEST_CONFIG } from "../../src/sim/config";
import { type SensorPolicy } from "../../src/sim/controller/contract";
import { Input, Output } from "../../src/sim/controller/contract";
import { stepFoodGovernor } from "../../src/sim/foodSpawner";
import { Material } from "../../src/sim/materials";
import { buildAuthoredNestWorld } from "../../src/sim/nestWorld";
import { colonyLoopOracle, resetColonyLoopOracle } from "../../src/sim/oracles/colonyLoop";
import { emitFoodScent, stepScentField } from "../../src/sim/scent";
import { ENERGY } from "../../src/sim/tunables";
import { stepWorld, type World } from "../../src/sim/world";
import { type TraceSample } from "../lib/ledger";
import { type ColonyLoopResult, type SensorFrame } from "./colonyLoop";
import { pathingCeilingOracle } from "./pathingCeilingOracle";
import { type OraclePolicy } from "../../src/sim/oracles/policies";

type DiagnosticPolicy = OraclePolicy | SensorPolicy | null;
type PopulationRecorder = (ant: Ant) => void;

function stockSteadyFood(world: World): void {
  for (let pass = 0; pass < 60 && world.foodSources.size < world.foodTarget; pass++) {
    stepFoodGovernor(world);
  }
}

function primeFoodCarrier(world: World, passes = 100): void {
  for (let pass = 0; pass < passes; pass++) {
    emitFoodScent(world.grid, world.foodScent, world.foodSources);
    stepScentField(world.grid, world.foodScent);
  }
}

function isCachedFood(world: World, index: number): boolean {
  const x = index % world.grid.sizeX;
  const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
  const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
  return y <= world.surfaceMap[z * world.grid.sizeX + x];
}

function carriedFoodEnergy(ants: readonly Ant[]): number {
  return ants.reduce(
    (sum, ant) => sum + (ant.carrying === Material.FOOD ? ant.spoilLoads * ENERGY.foodEnergy : 0),
    0
  );
}

function colonyEnergy(world: World, colony: Colony): number {
  const workers = world.ants.reduce((sum, ant) => sum + ant.energy, 0);
  const brood = world.eggs.reduce((sum, egg) => sum + egg.energy + egg.fedProgress, 0);
  return (
    workers +
    colony.stockpile +
    world.storedFood.size * ENERGY.foodEnergy +
    carriedFoodEnergy(world.ants) +
    brood
  );
}

function tracePopulation(world: World, cadence: number, trace: TraceSample[]): void {
  if (world.tick % cadence !== 0) return;
  for (const ant of world.ants) {
    trace.push({
      tick: world.tick,
      antId: ant.id,
      x: ant.x,
      y: ant.y,
      z: ant.z,
      energy: ant.energy,
    });
  }
}

function onSurface(world: World, ant: Ant): boolean {
  return ant.y > world.surfaceMap[ant.z * world.grid.sizeX + ant.x];
}

function resetPolicy(policy: DiagnosticPolicy): void {
  if (policy === colonyLoopOracle) resetColonyLoopOracle();
}

function installPolicy(world: World, policy: DiagnosticPolicy): void {
  if (typeof policy === "function") world.policyOverride = policy;
  else world.sensorPolicyOverride = policy;
}

function observePopulation(
  world: World,
  surfaced: Set<number>,
  signaled: Set<number>,
  record?: PopulationRecorder
): { pheromoneEnergy: number; movementSteps: number } {
  let pheromoneEnergy = 0;
  let movementSteps = 0;
  for (const ant of world.ants) {
    pheromoneEnergy +=
      (Math.max(0, ant.lastOutputs[Output.PHEROMONE_A]) +
        Math.max(0, ant.lastOutputs[Output.PHEROMONE_B])) *
      ENERGY.depositCostPerUnit;
    if (ant.x !== ant.prevX || ant.y !== ant.prevY || ant.z !== ant.prevZ) movementSteps += 1;
    if (onSurface(world, ant)) surfaced.add(ant.id);
    const nestSignal =
      ant.lastInputs[Input.NEST_SCENT_LEFT] + ant.lastInputs[Input.NEST_SCENT_RIGHT];
    if (nestSignal > 0.01) signaled.add(ant.id);
    record?.(ant);
  }
  return { pheromoneEnergy, movementSteps };
}

/** Appendix E step 5: fixed-window colony energy accounting under the oracle. */
function runEnergyEpisode(
  seed: number,
  ticks: number,
  cadence: number,
  policy: DiagnosticPolicy,
  record?: PopulationRecorder
): ColonyLoopResult {
  resetPolicy(policy);
  const { world, colony, nest } = buildAuthoredNestWorld(seed, undefined, NEST_CONFIG);
  installPolicy(world, policy);
  stockSteadyFood(world);
  primeFoodCarrier(world);
  const initialEnergy = colonyEnergy(world, colony);
  const gatheredStart = world.metrics.surfaceFoodEnergyGathered;
  const burnedStart = world.metrics.energyBurned;
  const trace: TraceSample[] = [];
  const surfaced = new Set<number>();
  const signaled = new Set<number>();
  let pheromoneEnergyBurned = 0;
  let movementSteps = 0;
  for (let elapsed = 0; elapsed < ticks; elapsed++) {
    stepWorld(world);
    const observed = observePopulation(world, surfaced, signaled, record);
    pheromoneEnergyBurned += observed.pheromoneEnergy;
    movementSteps += observed.movementSteps;
    tracePopulation(world, cadence, trace);
  }
  const finalEnergy = colonyEnergy(world, colony);
  const gathered = world.metrics.surfaceFoodEnergyGathered - gatheredStart;
  const burned = world.metrics.energyBurned - burnedStart;
  const balance = finalEnergy - initialEnergy;
  const loadedWorkers = world.ants.filter((ant) => ant.carryLoad > 0).length;
  const movedLastTick = world.ants.filter(
    (ant) => ant.x !== ant.prevX || ant.y !== ant.prevY || ant.z !== ant.prevZ
  ).length;
  return {
    params: { entrance: nest.entrance, workers: world.ants.length },
    summary: {
      initialEnergy,
      finalEnergy,
      balance,
      gathered,
      burned,
      pheromoneEnergyBurned,
      movementSteps,
      accountedBalance: gathered - burned,
      conservationResidual: balance - (gathered - burned),
      positive: balance > 0,
      cache: [...world.foodSources].filter((index) => isCachedFood(world, index)).length,
      stockpile: colony.stockpile,
      surfacedWorkers: surfaced.size,
      signaledWorkers: signaled.size,
      loadedWorkers,
      carriedLoads: world.ants.reduce((sum, ant) => sum + ant.spoilLoads, 0),
      movedLastTick,
      metrics: world.metrics,
    },
    trace,
  };
}

export function energyEpisode(seed: number, ticks: number, cadence: number): ColonyLoopResult {
  return runEnergyEpisode(seed, ticks, cadence, colonyLoopOracle);
}

export function energyCeilingEpisode(
  seed: number,
  ticks: number,
  cadence: number
): ColonyLoopResult {
  return runEnergyEpisode(seed, ticks, cadence, pathingCeilingOracle);
}

export function energySeedEpisode(seed: number, ticks: number, cadence: number): ColonyLoopResult {
  return runEnergyEpisode(seed, ticks, cadence, null);
}

function recordFrames(target: Map<number, SensorFrame[]>, ant: Ant, outputs: Float32Array): void {
  let frames = target.get(ant.id);
  if (!frames) {
    frames = [];
    target.set(ant.id, frames);
  }
  frames.push({
    inputs: Float32Array.from(ant.lastInputs),
    outputs: Float32Array.from(outputs),
    phase: "forage",
  });
}

/** Full-population sensor/output sequences produced by the programmed policy. */
export function oracleEnergyDemonstration(
  seed: number,
  ticks: number
): { sequences: SensorFrame[][]; result: ColonyLoopResult } {
  const frames = new Map<number, SensorFrame[]>();
  const result = runEnergyEpisode(seed, ticks, 0, colonyLoopOracle, (ant) =>
    recordFrames(frames, ant, ant.lastOutputs)
  );
  return { sequences: [...frames.values()], result };
}

/** Programmed labels for full-population sensor histories reached by the RNN. */
export function shadowOracleEnergyDemonstration(
  seed: number,
  ticks: number
): { sequences: SensorFrame[][]; result: ColonyLoopResult } {
  const frames = new Map<number, SensorFrame[]>();
  const states = new Map<number, unknown>();
  const result = runEnergyEpisode(seed, ticks, 0, null, (ant) => {
    let state = states.get(ant.id);
    if (state === undefined) {
      state = colonyLoopOracle.createState();
      states.set(ant.id, state);
    }
    recordFrames(frames, ant, colonyLoopOracle.act(ant.lastInputs, state));
  });
  return { sequences: [...frames.values()], result };
}

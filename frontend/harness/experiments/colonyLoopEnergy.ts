import { type Ant } from "../../src/sim/ant";
import { type SensorPolicy } from "../../src/sim/controller/contract";
import { Input, Output } from "../../src/sim/controller/contract";
import { colonyLoopOracle } from "../../src/sim/oracles/colonyLoop";
import { pathingCeilingOracle } from "../../src/sim/oracles/omniscientForager";
import { ENERGY } from "../../src/sim/tunables";
import { stepWorld, type World } from "../../src/sim/world";
import {
  cachedFoodCount,
  prepareAuthoredNestEconomy,
  totalColonyEnergy,
} from "../lib/authoredNestEconomy";
import { type TraceSample } from "../lib/ledger";
import { type ColonyLoopResult, type SensorFrame } from "./colonyLoop";
import { type OraclePolicy } from "../../src/sim/oracles/policies";

type DiagnosticPolicy = OraclePolicy | SensorPolicy | null;
type PopulationRecorder = (ant: Ant) => void;

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
  const { world, colony, nest } = prepareAuthoredNestEconomy(seed);
  installPolicy(world, policy);
  const initialEnergy = totalColonyEnergy(world, colony);
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
  const finalEnergy = totalColonyEnergy(world, colony);
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
      cache: cachedFoodCount(world),
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
  const result = runEnergyEpisode(seed, ticks, 0, null, (ant) => {
    recordFrames(frames, ant, colonyLoopOracle.act(ant.lastInputs));
  });
  return { sequences: [...frames.values()], result };
}

import { type Ant } from "../../src/sim/ant";
import { stepWorld, type World } from "../../src/sim/world";
import { scenarioById } from "../../src/ui/scenarios";

export const PROGRAMMED_FORAGING_GATE = Object.freeze({
  ticks: 500,
  warmupTicks: 100,
  sampleInterval: 10,
  windowCount: 4,
  minExitParticipation: 0.2,
  minSurfacePresence: 0.5,
  minForagingParticipation: 0.1,
  minReturnEfficiency: 0.5,
  minProductiveWindows: 2,
});

export interface ProgrammedForagingSummary {
  readonly seed: number;
  readonly ticks: number;
  readonly workers: number;
  readonly workersSeenOnSurface: number;
  readonly workersCollectingExternalFood: number;
  readonly externalLoadsCollected: number;
  readonly externalLoadsReturned: number;
  readonly exitParticipation: number;
  readonly surfacePresence: number;
  readonly foragingParticipation: number;
  readonly returnEfficiency: number;
  readonly productiveWindows: number;
  readonly passed: boolean;
}

interface WorkerObservation {
  surface: boolean;
  externalLoads: number;
  returnedLoads: number;
}

interface PopulationObservation {
  readonly workers: number;
  readonly surfaceWorkers: Set<number>;
  readonly foragingWorkers: Set<number>;
  readonly prior: Map<number, WorkerObservation>;
  readonly pickupWindows: boolean[];
  readonly returnWindows: boolean[];
  surfaceSamples: number;
  occupiedSurfaceSamples: number;
  loadsCollected: number;
  loadsReturned: number;
}

function onSurface(world: World, ant: Ant): boolean {
  const surface = world.surfaceMap[ant.z * world.grid.sizeX + ant.x];
  return ant.y >= surface + 1;
}

function createObservation(world: World): PopulationObservation {
  return {
    workers: world.ants.length,
    surfaceWorkers: new Set(),
    foragingWorkers: new Set(),
    prior: new Map(
      world.ants.map((ant) => [
        ant.id,
        {
          surface: onSurface(world, ant),
          externalLoads: ant.uncreditedFoodLoads,
          returnedLoads: 0,
        },
      ])
    ),
    pickupWindows: Array.from({ length: PROGRAMMED_FORAGING_GATE.windowCount }, () => false),
    returnWindows: Array.from({ length: PROGRAMMED_FORAGING_GATE.windowCount }, () => false),
    surfaceSamples: 0,
    occupiedSurfaceSamples: 0,
    loadsCollected: 0,
    loadsReturned: 0,
  };
}

function windowAt(tick: number): number | null {
  const elapsed = tick - PROGRAMMED_FORAGING_GATE.warmupTicks - 1;
  if (elapsed < 0) return null;
  const measuredTicks = PROGRAMMED_FORAGING_GATE.ticks - PROGRAMMED_FORAGING_GATE.warmupTicks;
  const windowSize = measuredTicks / PROGRAMMED_FORAGING_GATE.windowCount;
  return Math.min(PROGRAMMED_FORAGING_GATE.windowCount - 1, Math.floor(elapsed / windowSize));
}

function observeWorker(
  world: World,
  ant: Ant,
  observation: PopulationObservation,
  window: number | null
): void {
  const surface = onSurface(world, ant);
  if (surface) observation.surfaceWorkers.add(ant.id);
  const prior = observation.prior.get(ant.id);
  if (!prior) return;
  const collected = Math.max(0, ant.uncreditedFoodLoads - prior.externalLoads);
  if (collected > 0) {
    observation.foragingWorkers.add(ant.id);
    observation.loadsCollected += collected;
    if (window !== null) observation.pickupWindows[window] = true;
  }
  if (prior.surface && !surface) {
    const crossedLoads = Math.max(prior.externalLoads, ant.uncreditedFoodLoads);
    const returned = Math.max(0, crossedLoads - prior.returnedLoads);
    observation.loadsReturned += returned;
    prior.returnedLoads += returned;
    if (returned > 0 && window !== null) observation.returnWindows[window] = true;
  }
  prior.surface = surface;
  prior.externalLoads = ant.uncreditedFoodLoads;
  prior.returnedLoads = Math.min(prior.returnedLoads, ant.uncreditedFoodLoads);
}

function observePopulation(world: World, observation: PopulationObservation): void {
  const window = windowAt(world.tick);
  for (const ant of world.ants) observeWorker(world, ant, observation, window);
  if (
    window !== null &&
    (world.tick - PROGRAMMED_FORAGING_GATE.warmupTicks) %
      PROGRAMMED_FORAGING_GATE.sampleInterval ===
      0
  ) {
    observation.surfaceSamples += 1;
    if (world.ants.some((ant) => onSurface(world, ant))) {
      observation.occupiedSurfaceSamples += 1;
    }
  }
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function summarize(seed: number, observation: PopulationObservation): ProgrammedForagingSummary {
  const exitParticipation = safeRatio(observation.surfaceWorkers.size, observation.workers);
  const surfacePresence = safeRatio(observation.occupiedSurfaceSamples, observation.surfaceSamples);
  const foragingParticipation = safeRatio(observation.foragingWorkers.size, observation.workers);
  const returnEfficiency = safeRatio(observation.loadsReturned, observation.loadsCollected);
  const productiveWindows = observation.pickupWindows.filter(
    (pickup, index) => pickup && observation.returnWindows[index]
  ).length;
  const passed =
    exitParticipation >= PROGRAMMED_FORAGING_GATE.minExitParticipation &&
    surfacePresence >= PROGRAMMED_FORAGING_GATE.minSurfacePresence &&
    foragingParticipation >= PROGRAMMED_FORAGING_GATE.minForagingParticipation &&
    returnEfficiency >= PROGRAMMED_FORAGING_GATE.minReturnEfficiency &&
    productiveWindows >= PROGRAMMED_FORAGING_GATE.minProductiveWindows;
  return {
    seed,
    ticks: PROGRAMMED_FORAGING_GATE.ticks,
    workers: observation.workers,
    workersSeenOnSurface: observation.surfaceWorkers.size,
    workersCollectingExternalFood: observation.foragingWorkers.size,
    externalLoadsCollected: observation.loadsCollected,
    externalLoadsReturned: observation.loadsReturned,
    exitParticipation,
    surfacePresence,
    foragingParticipation,
    returnEfficiency,
    productiveWindows,
    passed,
  };
}

/** Measure one already-built world without changing its population or environment. */
export function measureForagingWorld(world: World, seed: number): ProgrammedForagingSummary {
  const observation = createObservation(world);
  while (world.tick < PROGRAMMED_FORAGING_GATE.ticks) {
    stepWorld(world);
    observePopulation(world, observation);
  }
  return summarize(seed, observation);
}

/** Measure the unmodified programmed web scenario through population-time outcomes. */
export function measureProgrammedForaging(seed: number): ProgrammedForagingSummary {
  return measureForagingWorld(scenarioById("programmed").build(seed), seed);
}

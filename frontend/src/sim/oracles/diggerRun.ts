import { surfaceSpawnY } from "../ant";
import { LADDER_STEP2_CONFIG } from "../config";
import { rnnController, setRuntimeSeedBase } from "../controller/rnn";
import { getVoxelSafe } from "../grid";
import { Material } from "../materials";
import { createRng } from "../rng";
import { createWorld, spawnAnt, stepWorld, type World } from "../world";
import { premarkDigSite } from "./digSite";

export const DIGGER_SITE = { x: 96, z: 96 } as const;

export interface DiggerRun {
  depth: number;
  excavated: number;
  mouthWidening: number;
  surfaceDivots: number;
  roundTrips: number;
  alive: boolean;
  energy: number;
  completedAt: number;
  headingTravel: number;
  maxRadius: number;
  mouthReturns: number;
}

interface HaulTracker {
  roundTrips: number;
  carriedFromBelow: boolean;
  previousLoads: number;
}

interface Trace {
  headingTravel: number;
  maxRadius: number;
  mouthReturns: number;
  wasAtMouth: boolean;
  completedAt: number;
}

function shaftDepth(world: World, surfaceY: number): number {
  let y = surfaceY;
  while (y > 1 && getVoxelSafe(world.grid, DIGGER_SITE.x, y - 1, DIGGER_SITE.z) === Material.AIR) {
    y -= 1;
  }
  return surfaceY - y;
}

function surfaceExcavationClass(x: number, y: number, z: number, surfaceY: number): number {
  if (y !== surfaceY - 1 || (x === DIGGER_SITE.x && z === DIGGER_SITE.z)) {
    return 0;
  }
  return Math.abs(x - DIGGER_SITE.x) <= 1 && Math.abs(z - DIGGER_SITE.z) <= 1 ? 1 : 2;
}

function excavationMetrics(
  before: Uint8Array,
  world: World,
  surfaceY: number
): { excavated: number; mouthWidening: number; surfaceDivots: number } {
  let dug = 0;
  let mouthWidening = 0;
  let surfaceDivots = 0;
  const slab = world.grid.sizeX * world.grid.sizeZ;
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== Material.AIR && world.grid.data[i] === Material.AIR) {
      dug += 1;
      const y = Math.floor(i / slab);
      const x = i % world.grid.sizeX;
      const z = Math.floor(i / world.grid.sizeX) % world.grid.sizeZ;
      const surfaceClass = surfaceExcavationClass(x, y, z, surfaceY);
      mouthWidening += surfaceClass === 1 ? 1 : 0;
      surfaceDivots += surfaceClass === 2 ? 1 : 0;
    }
  }
  return { excavated: dug, mouthWidening, surfaceDivots };
}

function trackHaul(tracker: HaulTracker, ant: World["ants"][number], surfaceY: number): void {
  if (ant.spoilLoads > 0 && ant.y < surfaceY) {
    tracker.carriedFromBelow = true;
  }
  if (
    tracker.carriedFromBelow &&
    tracker.previousLoads > 0 &&
    ant.spoilLoads === 0 &&
    ant.y >= surfaceY
  ) {
    tracker.roundTrips += 1;
    tracker.carriedFromBelow = false;
  }
  tracker.previousLoads = ant.spoilLoads;
}

function observe(
  trace: Trace,
  ant: World["ants"][number],
  surfaceY: number,
  heading: number
): void {
  trace.headingTravel += Math.abs(ant.heading - heading);
  trace.maxRadius = Math.max(
    trace.maxRadius,
    Math.hypot(ant.x - DIGGER_SITE.x, ant.z - DIGGER_SITE.z)
  );
  const atMouth = ant.x === DIGGER_SITE.x && ant.z === DIGGER_SITE.z && ant.y >= surfaceY;
  if (atMouth && !trace.wasAtMouth) {
    trace.mouthReturns += 1;
  }
  trace.wasAtMouth = atMouth;
}

function runTicks(
  world: World,
  ant: World["ants"][number],
  surfaceY: number,
  targetDepth: number,
  ticks: number,
  tracker: HaulTracker,
  trace: Trace
): void {
  for (let tick = 1; tick <= ticks; tick++) {
    const previousHeading = ant.heading;
    stepWorld(world);
    observe(trace, ant, surfaceY, previousHeading);
    if (world.ants.length === 0) {
      return;
    }
    trackHaul(tracker, ant, surfaceY);
    if (shaftDepth(world, surfaceY) >= targetDepth && tracker.roundTrips > 0) {
      trace.completedAt = tick;
      return;
    }
  }
}

/** Step-8 measurement through the real controller, sensors, and actuators. */
export function runDigger(
  vector: Float32Array,
  worldSeed: number,
  targetDepth = 8,
  ticks = 3000,
  noisy = false
): DiggerRun {
  const world = createWorld(worldSeed, rnnController, LADDER_STEP2_CONFIG);
  world.foodBase = 0;
  world.foodTarget = 0;
  const y = surfaceSpawnY(world.grid, DIGGER_SITE.x, DIGGER_SITE.z) as number;

  setRuntimeSeedBase(vector);
  const genome = noisy
    ? rnnController.seed(createRng(worldSeed))
    : rnnController.deserializeGenome(vector);
  setRuntimeSeedBase(null);
  const ant = spawnAnt(world, {
    x: DIGGER_SITE.x,
    y,
    z: DIGGER_SITE.z,
    heading: 0,
    energy: 1,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
    genome,
    controllerState: rnnController.createState(),
    traits: rnnController.physical(genome),
  });
  premarkDigSite(world, DIGGER_SITE.x, y, DIGGER_SITE.z, ant.lineageId);

  const before = world.grid.data.slice();
  const tracker: HaulTracker = { roundTrips: 0, carriedFromBelow: false, previousLoads: 0 };
  const trace: Trace = {
    headingTravel: 0,
    maxRadius: 0,
    mouthReturns: 0,
    wasAtMouth: true,
    completedAt: -1,
  };
  runTicks(world, ant, y, targetDepth, ticks, tracker, trace);
  const excavation = excavationMetrics(before, world, y);

  return {
    depth: shaftDepth(world, y),
    excavated: excavation.excavated,
    mouthWidening: excavation.mouthWidening,
    surfaceDivots: excavation.surfaceDivots,
    roundTrips: tracker.roundTrips,
    alive: world.ants.length > 0,
    energy: ant.energy,
    completedAt: trace.completedAt,
    headingTravel: trace.headingTravel,
    maxRadius: trace.maxRadius,
    mouthReturns: trace.mouthReturns,
  };
}

import { surfaceSpawnY } from "../../src/sim/ant";
import { type Colony } from "../../src/sim/colony";
import { rnnController } from "../../src/sim/controller/rnn";
import { voxelIndex } from "../../src/sim/grid";
import { Material } from "../../src/sim/materials";
import { createRng } from "../../src/sim/rng";
import { createScentField, depositScent } from "../../src/sim/scent";
import { BEACON_PHYSICS, NEST_PHYSICS } from "../../src/sim/tunables";
import { createWorld, mutateVoxel, spawnAnt, stepWorld, type World } from "../../src/sim/world";

/**
 * Probe episodes for seed derivation (§B.9.3): single ants on the real
 * world with synthetic plumes. Each probe returns a 0..~1.5 score; the
 * suite spans forage, deliver (easy and against a competing food plume),
 * heat escape, cool calm (multi-location — single-spot calm overfits),
 * and pickup.
 */
const ARENA_SEED = 7777;
export const NEST = { x: 96, z: 96 };
const EPISODE_TICKS = 350;
const COOL_TICK = 11_500;
const HOT_TICK = 30_500;

let arena: World | null = null;

function world(): World {
  if (arena === null) {
    arena = createWorld(ARENA_SEED);
  }
  return arena;
}

function fakeColony(w: World): Colony {
  return {
    id: 1,
    x: NEST.x,
    y: (surfaceSpawnY(w.grid, NEST.x, NEST.z) ?? 40) - 1,
    z: NEST.z,
    queenGenome: rnnController.seed(createRng(1)),
    sperm: [],
    patrilineDeliveries: new Map(),
    stockpile: 0,
    queenAge: 0,
    queenLifespanTicks: 1_000_000,
    nextPatrilineId: 1,
    lastEggTick: 0,
    lastQueenEggTick: 0,
    starvingSince: -1,
  };
}

/** Synthetic radial plume: an instant gradient without warmup passes. */
function paintPlume(
  w: World,
  field: "foodScent" | "nestScent",
  cx: number,
  cz: number,
  radius: number,
  peak: number,
  owner: number
): void {
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const r = Math.max(Math.abs(dx), Math.abs(dz));
      if (r > radius) {
        continue;
      }
      const sy = surfaceSpawnY(w.grid, cx + dx, cz + dz) ?? 40;
      const strength = peak * (1 - r / (radius + 1));
      depositScent(w[field], voxelIndex(w.grid, cx + dx, sy, cz + dz), strength, owner);
    }
  }
}

export interface EpisodeConfig {
  tickBase: number;
  withNestPlume: boolean;
  foodAt: { dx: number; dz: number } | null;
  physicalFood: boolean;
  startAt: { x: number; z: number };
  carrying: boolean;
  energy: number;
}

function resetArena(w: World, config: EpisodeConfig): void {
  w.config.autoContinue = false; // probe worlds must stay exactly as staged
  w.ants = [];
  w.eggs = [];
  w.eggIndex.clear();
  w.colonies = [];
  w.foodSources.clear();
  w.tick = config.tickBase;
  w.rng = createRng(4242);
  w.rainRemaining = 0;
  w.foodBase = 0;
  w.foodTarget = 0;
  w.pheromoneA = createScentField(w.grid, BEACON_PHYSICS);
  w.pheromoneB = createScentField(w.grid, BEACON_PHYSICS);
  w.foodScent = createScentField(w.grid, BEACON_PHYSICS);
  w.nestScent = createScentField(w.grid, NEST_PHYSICS);
  if (config.withNestPlume) {
    w.colonies = [fakeColony(w)];
    paintPlume(w, "nestScent", NEST.x, NEST.z, 22, 1.5, 1);
  }
  if (config.foodAt) {
    const fx = NEST.x + config.foodAt.dx;
    const fz = NEST.z + config.foodAt.dz;
    paintPlume(w, "foodScent", fx, fz, 10, 1.2, 0);
    if (config.physicalFood) {
      const fy = surfaceSpawnY(w.grid, fx, fz) ?? 40;
      mutateVoxel(w, fx, fy, fz, Material.FOOD);
    }
  }
}

function spawnProbeAnt(w: World, vector: Float32Array, config: EpisodeConfig) {
  const genome = rnnController.deserializeGenome(Float32Array.from(vector));
  const y = surfaceSpawnY(w.grid, config.startAt.x, config.startAt.z) ?? 40;
  const ant = spawnAnt(w, {
    x: config.startAt.x,
    y,
    z: config.startAt.z,
    heading: 0.7,
    energy: config.energy,
    lineageId: config.withNestPlume ? 1 : 0,
    patrilineId: 1,
    motherId: 0,
    fatherId: 0,
    genome,
    controllerState: rnnController.createState(),
    traits: rnnController.physical(genome),
  });
  if (config.carrying) {
    ant.carrying = Material.FOOD;
    ant.spoilLoads = 1;
    ant.carryLoad = 1;
  }
  return ant;
}

function chebTo(ant: { x: number; z: number }, x: number, z: number): number {
  return Math.max(Math.abs(ant.x - x), Math.abs(ant.z - z));
}

/** Closing score toward a target, with an unload bonus when asked. */
function closingEpisode(
  vector: Float32Array,
  config: EpisodeConfig,
  target: { x: number; z: number },
  unloadBonus: boolean
): number {
  const w = world();
  resetArena(w, config);
  const ant = spawnProbeAnt(w, vector, config);
  const start = chebTo(ant, target.x, target.z);
  let best = start;
  for (let t = 0; t < EPISODE_TICKS; t++) {
    stepWorld(w);
    best = Math.min(best, chebTo(ant, target.x, target.z));
  }
  let score = (start - best) / start;
  if (unloadBonus && ant.spoilLoads === 0 && best <= 4) {
    score += 0.5;
  }
  return score;
}

function heatEpisode(vector: Float32Array): number {
  const w = world();
  const config: EpisodeConfig = {
    tickBase: HOT_TICK,
    withNestPlume: false,
    foodAt: null,
    physicalFood: false,
    startAt: { x: NEST.x - 20, z: NEST.z + 15 },
    carrying: false,
    energy: 0.9,
  };
  resetArena(w, config);
  const ant = spawnProbeAnt(w, vector, config);
  let deepest = 0;
  for (let t = 0; t < EPISODE_TICKS; t++) {
    stepWorld(w);
    // Depth below the LOCAL surface — walking downhill is not burrowing.
    // surfaceMap holds the solid-top y; a standing ant sits at +1.
    const local = w.surfaceMap[ant.z * w.grid.sizeX + ant.x];
    deepest = Math.max(deepest, local + 1 - ant.y);
  }
  return Math.min(1, deepest / 3);
}

/** Cool quiet across several spots — single-location calm overfits. */
function calmEpisode(vector: Float32Array): number {
  const w = world();
  const spots = [
    { x: NEST.x - 25, z: NEST.z - 20 },
    { x: NEST.x + 30, z: NEST.z + 10 },
    { x: 60, z: 60 },
  ];
  let quiet = 0;
  for (const startAt of spots) {
    const config: EpisodeConfig = {
      tickBase: COOL_TICK,
      withNestPlume: false,
      foodAt: null,
      physicalFood: false,
      startAt,
      carrying: false,
      energy: 0.9,
    };
    resetArena(w, config);
    const ant = spawnProbeAnt(w, vector, config);
    let digTicks = 0;
    for (let t = 0; t < 150; t++) {
      stepWorld(w);
      if (ant.lastOutputs[4] > 0.5) {
        digTicks += 1;
      }
    }
    quiet += 1 - digTicks / 150;
  }
  return quiet / spots.length;
}

function pickupEpisode(vector: Float32Array): number {
  const w = world();
  const config: EpisodeConfig = {
    tickBase: COOL_TICK,
    withNestPlume: false,
    foodAt: { dx: 1, dz: 0 },
    physicalFood: true,
    startAt: { x: NEST.x, z: NEST.z },
    carrying: false,
    energy: 0.95,
  };
  resetArena(w, config);
  const ant = spawnProbeAnt(w, vector, config);
  for (let t = 0; t < 80; t++) {
    stepWorld(w);
    if (ant.spoilLoads > 0) {
      return 1;
    }
  }
  return 0;
}

export interface ProbeScores {
  forage: number;
  clean: number;
  deliver: number;
  deliverHard: number;
  heat: number;
  calm: number;
  pickup: number;
}

/** Run all probe episodes for one weight vector. */
export function probeVector(vector: Float32Array): ProbeScores {
  const forageConfig: EpisodeConfig = {
    tickBase: COOL_TICK,
    withNestPlume: false,
    foodAt: { dx: 14, dz: 3 },
    physicalFood: false,
    startAt: { x: NEST.x, z: NEST.z },
    carrying: false,
    energy: 0.5,
  };
  const foodTarget = { x: NEST.x + 14, z: NEST.z + 3 };
  const forage = closingEpisode(vector, forageConfig, foodTarget, false);
  const clean = closingEpisode(vector, { ...forageConfig, withNestPlume: true }, foodTarget, false);

  const deliverConfig: EpisodeConfig = {
    tickBase: COOL_TICK,
    withNestPlume: true,
    foodAt: null,
    physicalFood: false,
    startAt: { x: NEST.x + 15, z: NEST.z - 4 },
    carrying: true,
    energy: 0.9,
  };
  const deliver = closingEpisode(vector, deliverConfig, NEST, true);
  const deliverHard = closingEpisode(
    vector,
    { ...deliverConfig, foodAt: { dx: 24, dz: -6 } },
    NEST,
    true
  );

  return {
    forage,
    clean,
    deliver,
    deliverHard,
    heat: heatEpisode(vector),
    calm: calmEpisode(vector),
    pickup: pickupEpisode(vector),
  };
}

export function fitness(s: ProbeScores): number {
  return (
    s.forage +
    s.clean +
    0.8 * s.deliver +
    1.4 * s.deliverHard +
    0.5 * s.heat +
    0.9 * s.calm +
    0.5 * s.pickup
  );
}

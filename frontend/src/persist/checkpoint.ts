import { type Ant } from "../sim/ant";
import { type Colony } from "../sim/colony";
import { INPUT_COUNT, OUTPUT_COUNT } from "../sim/controller/contract";
import { controllerById } from "../sim/controller/registry";
import { type Egg } from "../sim/eggs";
import { voxelIndex } from "../sim/grid";
import { type RngState } from "../sim/rng";
import { restoreScentField, scentActiveIndices, type ScentField } from "../sim/scent";
import { createWorld, type World } from "../sim/world";

export const CHECKPOINT_VERSION = 5;

interface AntRecord {
  scalars: Record<string, number>;
  carrying: number | null;
  genome: Float32Array;
  state: Float32Array;
}

interface EggRecord {
  scalars: Record<string, number>;
  genome: Float32Array;
}

interface ColonyRecord {
  scalars: Record<string, number>;
  queenGenome: Float32Array;
  sperm: { genome: Float32Array; patrilineId: number }[];
  deliveries: [number, number][];
}

interface ScentRecord {
  values: Float32Array;
  owners: Uint8Array;
  active: number[];
}

export interface Checkpoint {
  version: number;
  controllerId: string;
  seed: number;
  tick: number;
  rngState: RngState;
  weatherRngState: RngState;
  rainRemaining: number;
  nextAntId: number;
  nextEggId: number;
  nextColonyId: number;
  foundings: number;
  foundingFailures: number;
  collapses: number;
  queenEggsEaten: number;
  eggsLaid: number;
  eggsPerished: number;
  foodBase: number;
  foodTarget: number;
  grid: Uint8Array;
  foodSources: number[];
  cavities: number[];
  lastVisit: Uint32Array;
  ants: AntRecord[];
  eggs: EggRecord[];
  colonies: ColonyRecord[];
  scents: { a: ScentRecord; b: ScentRecord; food: ScentRecord; nest: ScentRecord };
}

const ANT_SCALARS = [
  "id",
  "x",
  "y",
  "z",
  "prevX",
  "prevY",
  "prevZ",
  "heading",
  "moveCharge",
  "energy",
  "age",
  "bodyScale",
  "carryLoad",
  "spoilLoads",
  "sex",
  "lineageId",
  "patrilineId",
  "motherId",
  "fatherId",
  "deliveries",
] as const;

const EGG_SCALARS = [
  "id",
  "x",
  "y",
  "z",
  "energy",
  "incubationRemaining",
  "sex",
  "queenDestined",
  "lineageId",
  "patrilineId",
  "motherId",
  "fatherId",
] as const;

const COLONY_SCALARS = [
  "id",
  "x",
  "y",
  "z",
  "queenAge",
  "queenLifespanTicks",
  "stockpile",
  "nextPatrilineId",
  "lastEggTick",
  "lastQueenEggTick",
  "starvingSince",
] as const;

function serializeScent(field: ScentField): ScentRecord {
  return {
    values: Float32Array.from(field.values),
    owners: Uint8Array.from(field.owners),
    active: scentActiveIndices(field),
  };
}

function restoreScent(field: ScentField, record: ScentRecord): void {
  restoreScentField(field, record.values, record.owners, record.active);
}

function serializeAnt(world: World, ant: Ant): AntRecord {
  const scalars: Record<string, number> = {};
  for (const key of ANT_SCALARS) {
    scalars[key] = ant[key] as number;
  }
  scalars.falling = ant.falling ? 1 : 0;
  return {
    scalars,
    carrying: ant.carrying,
    genome: world.controller.serializeGenome(ant.genome),
    state: world.controller.serializeState(ant.controllerState),
  };
}

function restoreAnt(world: World, record: AntRecord): Ant {
  const genome = world.controller.deserializeGenome(record.genome);
  const ant = {
    ...(record.scalars as unknown as Ant),
    falling: record.scalars.falling === 1,
    alive: true,
    carrying: record.carrying,
    genome,
    controllerState: world.controller.deserializeState(record.state),
    traits: world.controller.physical(genome),
    lastInputs: new Float32Array(INPUT_COUNT),
    lastOutputs: new Float32Array(OUTPUT_COUNT),
  };
  return ant;
}

function serializeColony(world: World, colony: Colony): ColonyRecord {
  const scalars: Record<string, number> = {};
  for (const key of COLONY_SCALARS) {
    scalars[key] = colony[key] as number;
  }
  return {
    scalars,
    queenGenome: world.controller.serializeGenome(colony.queenGenome),
    sperm: colony.sperm.map((s) => ({
      genome: world.controller.serializeGenome(s.genome),
      patrilineId: s.patrilineId,
    })),
    deliveries: Array.from(colony.patrilineDeliveries.entries()),
  };
}

function restoreColony(world: World, record: ColonyRecord): Colony {
  return {
    ...(record.scalars as unknown as Colony),
    queenGenome: world.controller.deserializeGenome(record.queenGenome),
    sperm: record.sperm.map((s) => ({
      genome: world.controller.deserializeGenome(s.genome),
      patrilineId: s.patrilineId,
    })),
    patrilineDeliveries: new Map(record.deliveries),
  };
}

/** Complete world state, including PRNG and iteration-order-bearing sets. */
export function serializeWorld(world: World): Checkpoint {
  return {
    version: CHECKPOINT_VERSION,
    controllerId: world.controller.id,
    seed: world.seed,
    tick: world.tick,
    rngState: world.rng.getState(),
    weatherRngState: world.weatherRng.getState(),
    rainRemaining: world.rainRemaining,
    nextAntId: world.nextAntId,
    nextEggId: world.nextEggId,
    nextColonyId: world.nextColonyId,
    foundings: world.foundings,
    foundingFailures: world.foundingFailures,
    collapses: world.collapses,
    queenEggsEaten: world.queenEggsEaten,
    eggsLaid: world.eggsLaid,
    eggsPerished: world.eggsPerished,
    foodBase: world.foodBase,
    foodTarget: world.foodTarget,
    grid: Uint8Array.from(world.grid.data),
    foodSources: Array.from(world.foodSources),
    cavities: Array.from(world.cavities),
    lastVisit: Uint32Array.from(world.lastVisit),
    ants: world.ants.map((ant) => serializeAnt(world, ant)),
    eggs: world.eggs.map((egg) => ({
      scalars: Object.fromEntries(EGG_SCALARS.map((key) => [key, egg[key] as number])),
      genome: world.controller.serializeGenome(egg.genome),
    })),
    colonies: world.colonies.map((colony) => serializeColony(world, colony)),
    scents: {
      a: serializeScent(world.pheromoneA),
      b: serializeScent(world.pheromoneB),
      food: serializeScent(world.foodScent),
      nest: serializeScent(world.nestScent),
    },
  };
}

/** Rebuild a live world from a checkpoint. Unknown versions stop the load. */
export function deserializeWorld(checkpoint: Checkpoint): World {
  if (checkpoint.version !== CHECKPOINT_VERSION) {
    throw new Error(`unsupported checkpoint version ${checkpoint.version}`);
  }
  const controller = controllerById(checkpoint.controllerId);
  const world = createWorld(checkpoint.seed, controller);

  world.tick = checkpoint.tick;
  world.rng.setState(checkpoint.rngState);
  world.weatherRng.setState(checkpoint.weatherRngState);
  world.rainRemaining = checkpoint.rainRemaining;
  world.nextAntId = checkpoint.nextAntId;
  world.nextEggId = checkpoint.nextEggId;
  world.nextColonyId = checkpoint.nextColonyId;
  world.foundings = checkpoint.foundings;
  world.foundingFailures = checkpoint.foundingFailures;
  world.collapses = checkpoint.collapses;
  world.queenEggsEaten = checkpoint.queenEggsEaten;
  world.eggsLaid = checkpoint.eggsLaid;
  world.eggsPerished = checkpoint.eggsPerished;
  world.foodBase = checkpoint.foodBase;
  world.foodTarget = checkpoint.foodTarget;
  world.grid.data.set(checkpoint.grid);
  world.foodSources = new Set(checkpoint.foodSources);
  world.cavities = new Set(checkpoint.cavities);
  world.lastVisit.set(checkpoint.lastVisit);
  world.ants = checkpoint.ants.map((record) => restoreAnt(world, record));
  world.eggs = checkpoint.eggs.map((record) => ({
    ...(record.scalars as unknown as Egg),
    genome: controller.deserializeGenome(record.genome),
  }));
  world.eggIndex = new Map();
  for (const egg of world.eggs) {
    world.eggIndex.set(voxelIndex(world.grid, egg.x, egg.y, egg.z), egg);
  }
  world.colonies = checkpoint.colonies.map((record) => restoreColony(world, record));
  restoreScent(world.pheromoneA, checkpoint.scents.a);
  restoreScent(world.pheromoneB, checkpoint.scents.b);
  restoreScent(world.foodScent, checkpoint.scents.food);
  restoreScent(world.nestScent, checkpoint.scents.nest);
  world.dirtyChunks.clear();
  return world;
}

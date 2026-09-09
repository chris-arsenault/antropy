import { FORAGER_CONFIG, PROGRAMMED_LIFECYCLE_CONFIG, type SimConfig } from "./config";
import { snapshotConfig } from "./configValidation";
import { type RegisteredModel, validateRegisteredModel } from "./controller/registeredModel";
import { createControllerState } from "./controller/runtime";
import { createAnt, createQueen } from "./ant";
import { createFields, initializeFields } from "./chemistrySystem";
import { createEconomy, storedFood, totalEnergy } from "./resources";
import { buildEnvironment, type BuiltEnvironment } from "./nest";
import { createRandomState } from "./random";
import { sense } from "./sensors";
import { type ScenarioId, type World, type WorldMetrics } from "./types";
import { createKnowledge } from "./colony/knowledge";
import { seedLinearGenome } from "./controller/linear/seed";
import { createConstruction } from "./construction/state";
import { createClimate } from "./climate/state";
import { createBehavior } from "./colony/behavior";
import { connectedNestCells } from "./construction/nestArea";
export { stepWorld, stepWorldWithRnn } from "./simulation";

function createMetrics(): WorldMetrics {
  return {
    foodPickedUp: 0,
    foodDeposited: 0,
    pheromoneDeposited: 0,
    failedMoves: 0,
    energySpent: 0,
    pickupTicks: [],
    depositTicks: [],
    deaths: 0,
    workerEggs: 0,
    workerHatches: 0,
  };
}

export function createWorld(
  seed: number,
  scenario: ScenarioId,
  config: SimConfig = FORAGER_CONFIG,
  warmup = true,
  restoredEnvironment: BuiltEnvironment | null = null
): World {
  config = snapshotConfig(config);
  const random = createRandomState(seed);
  const environment = restoredEnvironment ?? buildEnvironment(config, random);
  const partial = {
    dimension: "2d" as const,
    checkpointVersion: 19 as const,
    taskOverrides: 0,
    registeredController: null,
    seed,
    tick: 0,
    scenario,
    config,
    random,
    ...environment,
    ...createFields(environment.grid, config),
    metrics: createMetrics(),
  };
  const ants = Array.from({ length: config.workerCount }, (_, index) =>
    createAnt(
      partial,
      index + 1,
      config.mortalityEnabled
        ? Math.floor((index * config.workerLifespan) / Math.max(1, config.workerCount))
        : 0,
      environment.nest.primaryRoute[Math.min(index * 2, environment.nest.primaryRoute.length - 1)]
    )
  );
  const world: World = {
    ...partial,
    behavior: createBehavior(),
    climate: createClimate(environment.grid, config),
    habitat: { sites: new Map(), traffic: new Map() },
    construction: createConstruction(),
    caches: new Map([[-3, environment.cache]]),
    knowledge: createKnowledge(environment.nest, environment.cache),
    linearGenome: scenario === "colony-lgp" ? seedLinearGenome() : null,
    ants,
    get ant() {
      const first = this.ants[0];
      if (!first) throw new Error("single-worker diagnostic requires a living worker");
      return first;
    },
    brood: [],
    queen: createQueen(partial, config.workerCount + 1),
    nextAntId: config.workerCount + 2,
    nextBroodId: 1,
    economy: createEconomy(),
    food: new Map([...environment.foodSources].map((index) => [index, config.initialFoodQuantity])),
    renewableSources: [...environment.foodSources],
  };
  world.economy.initial = totalEnergy(world);
  world.construction.initialNestArea = connectedNestCells(world.grid, world.nest.home).size;
  if (warmup) initializeFields(world);
  for (const ant of world.ants) ant.lastInputs = sense(world, ant);
  return world;
}

export function createRegisteredWorld(
  seed: number,
  model: RegisteredModel,
  config: SimConfig = PROGRAMMED_LIFECYCLE_CONFIG,
  warmup = true
): World {
  const world = createWorld(seed, "registered-colony", config, warmup);
  world.registeredController = validateRegisteredModel(model);
  for (const ant of world.ants) ant.controllerState = createControllerState(model, seed, ant.id);
  return world;
}

export interface WorldSummary {
  readonly tick: number;
  readonly foodRemaining: number;
  readonly foodPickedUp: number;
  readonly foodDeposited: number;
  readonly cacheLoads: number;
  readonly carryingFood: boolean;
  readonly energy: number;
  readonly distanceMoved: number;
  readonly turns: number;
  readonly immediateTurnReversals: number;
  readonly failedMoves: number;
  readonly pheromoneDeposited: number;
  readonly deaths: number;
  readonly workerEggs: number;
  readonly workerHatches: number;
}

export function summarizeWorld(world: World): WorldSummary {
  const ant = world.ants[0] ?? {
    cargo: 0,
    energy: 0,
    distanceMoved: 0,
    turns: 0,
    immediateTurnReversals: 0,
  };
  return {
    tick: world.tick,
    foodRemaining: world.foodSources.size,
    foodPickedUp: world.metrics.foodPickedUp,
    foodDeposited: world.metrics.foodDeposited,
    cacheLoads: storedFood(world) / world.config.initialFoodQuantity,
    carryingFood: ant.cargo > 0,
    energy: ant.energy,
    distanceMoved: ant.distanceMoved,
    turns: ant.turns,
    immediateTurnReversals: ant.immediateTurnReversals,
    failedMoves: world.metrics.failedMoves,
    pheromoneDeposited: world.metrics.pheromoneDeposited,
    deaths: world.metrics.deaths,
    workerEggs: world.metrics.workerEggs,
    workerHatches: world.metrics.workerHatches,
  };
}

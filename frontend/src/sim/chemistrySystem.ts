import { type SimConfig } from "./config";
import { type Grid, cellIndex } from "./grid";
import { Material } from "./materials";
import { terrainDigest } from "./terrain";
import { type World } from "./types";
import {
  activeIndices,
  createChemicalField,
  equilibrateFromSources,
  emitFromSources,
  restoreChemical,
  stepChemical,
} from "./scent";

export function createFields(grid: Grid, config: SimConfig) {
  const supported = config.environment.odorTransport === "supported";
  return {
    foodOdor: createChemicalField(grid, config.chemistry.odor, supported),
    nestOdor: createChemicalField(grid, config.chemistry.nestOdor, supported),
    pheromoneA: createChemicalField(grid, config.chemistry.pheromone, true),
    pheromoneB: createChemicalField(grid, config.chemistry.pheromone, true),
    freshAir: createChemicalField(grid, config.chemistry.freshAir, supported),
  };
}

export type ChemistryContext = Pick<
  World,
  | "grid"
  | "config"
  | "tick"
  | "queen"
  | "cache"
  | "nest"
  | "food"
  | "foodOdor"
  | "nestOdor"
  | "pheromoneA"
  | "pheromoneB"
  | "freshAir"
>;

export const chemistrySystem = {
  id: "chemical-transport",
  version: 1,
  phase: "fields" as const,
  run(world: ChemistryContext): void {
    if (world.tick % world.config.chemistryInterval === 0) stepFields(world);
  },
};

interface ChemicalTemplate {
  readonly active: number[];
  readonly values: number[];
}

interface EquilibriumTemplate {
  readonly nest: ChemicalTemplate;
  readonly exit: ChemicalTemplate;
}

const equilibriumTemplates = new Map<string, EquilibriumTemplate>();

function templateFor(field: World["nestOdor"]): ChemicalTemplate {
  const active = activeIndices(field);
  return { active, values: active.map((index) => field.values[index]) };
}

function equilibriumKey(world: ChemistryContext): string {
  return [
    world.config.width,
    world.config.height,
    terrainDigest(world.grid),
    scentHome(world).x,
    scentHome(world).y,
    world.nest.entrance.x,
    world.nest.entrance.y,
    Number(world.config.mortalityEnabled),
    JSON.stringify(world.config.environment),
    JSON.stringify(world.config.chemistry),
    world.config.chemistry.nestEmission,
    world.config.chemistry.nestEquilibriumRetention,
    world.config.chemistry.exitTrailStrength,
    world.config.chemistry.exitEquilibriumRetention,
  ].join(":");
}

function scentHome(world: ChemistryContext) {
  return world.config.mortalityEnabled ? world.queen : world.cache;
}

function emitOdors(world: ChemistryContext): void {
  emitFoodOdor(world);
  if (world.config.mortalityEnabled && !world.queen.alive) return;
  emitFromSources(
    world.grid,
    world.nestOdor,
    new Set([cellIndex(world.grid, scentHome(world).x, scentHome(world).y)]),
    world.config.chemistry.nestEmission
  );
}

function emitFoodOdor(world: ChemistryContext): void {
  for (const [index, amount] of world.food) {
    if (world.grid.cells[index] !== Material.AIR && world.grid.cells[index] !== Material.CACHE)
      continue;
    emitFromSources(
      world.grid,
      world.foodOdor,
      new Set([index]),
      world.config.chemistry.foodEmission * Math.min(1, amount / world.config.initialFoodQuantity)
    );
  }
}

export function stepFields(world: ChemistryContext): void {
  emitOdors(world);
  stepChemical(world.grid, world.foodOdor);
  stepChemical(world.grid, world.nestOdor);
  stepChemical(world.grid, world.pheromoneA);
  stepChemical(world.grid, world.pheromoneB);
  emitFromSources(
    world.grid,
    world.freshAir,
    new Set([cellIndex(world.grid, world.nest.entrance.x, world.nest.entrance.y)]),
    world.config.chemistry.airEmission
  );
  stepChemical(world.grid, world.freshAir);
}

export function warmFields(world: ChemistryContext): void {
  const cacheSources = new Set([cellIndex(world.grid, scentHome(world).x, scentHome(world).y)]);
  const entranceSources = new Set([
    cellIndex(world.grid, world.nest.entrance.x, world.nest.entrance.y),
  ]);
  const key = equilibriumKey(world);
  const cached = equilibriumTemplates.get(key);
  if (cached) {
    restoreChemical(world.nestOdor, cached.nest.values, cached.nest.active);
    restoreChemical(world.pheromoneA, cached.exit.values, cached.exit.active);
  } else {
    equilibrateFromSources(
      world.grid,
      world.nestOdor,
      cacheSources,
      world.config.chemistry.nestEmission,
      world.config.chemistry.nestEquilibriumRetention,
      world.config.chemistry.nestEquilibriumPasses,
      true
    );
    equilibrateFromSources(
      world.grid,
      world.pheromoneA,
      entranceSources,
      world.config.chemistry.exitTrailStrength,
      world.config.chemistry.exitEquilibriumRetention,
      world.config.chemistry.exitEquilibriumPasses,
      true
    );
    if (equilibriumTemplates.size >= 4) equilibriumTemplates.clear();
    equilibriumTemplates.set(key, {
      nest: templateFor(world.nestOdor),
      exit: templateFor(world.pheromoneA),
    });
  }
  for (let pass = 0; pass < world.config.chemistry.odorWarmupPasses; pass++) {
    emitFoodOdor(world);
    stepChemical(world.grid, world.foodOdor);
    emitFromSources(world.grid, world.nestOdor, cacheSources, world.config.chemistry.nestEmission);
    stepChemical(world.grid, world.nestOdor);
  }
}

export function initializeFields(world: ChemistryContext): void {
  warmFields(world);
  const indices = activeIndices(world.pheromoneA);
  restoreChemical(
    world.freshAir,
    indices.map((index) => world.pheromoneA.values[index]),
    indices
  );
}

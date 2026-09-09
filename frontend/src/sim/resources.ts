import { cellIndex, getCell } from "./grid";
import { Material } from "./materials";
import { isInterior } from "./terrain";
import { type Ant, type Economy, type World } from "./types";

export function createEconomy(): Economy {
  return {
    initial: 0,
    grown: 0,
    dissipated: 0,
    metabolism: 0,
    work: 0,
    queenFed: 0,
    broodFed: 0,
    eaten: 0,
    ageDeaths: 0,
    starvationDeaths: 0,
    broodDeaths: 0,
    queenDeath: null,
    movement: 0,
    workerTicks: 0,
    completedReturns: 0,
    returnTicks: 0,
    harvested: 0,
  };
}

export function foodAt(world: World, x: number, y: number): number {
  const material = getCell(world.grid, x, y);
  if (material !== Material.AIR && material !== Material.CACHE) return 0;
  return world.food.get(cellIndex(world.grid, x, y)) ?? 0;
}

export function storedFood(world: World): number {
  let total = 0;
  for (const [index, amount] of world.food) {
    if (
      isInterior(world.grid, index) &&
      foodAt(world, index % world.grid.width, Math.floor(index / world.grid.width)) > 0
    )
      total += amount;
  }
  return total;
}

export function putFood(
  world: Pick<World, "food" | "foodSources">,
  index: number,
  amount: number
): void {
  if (amount <= 0) return;
  world.food.set(index, (world.food.get(index) ?? 0) + amount);
  world.foodSources.add(index);
}

export function takeFood(world: World, index: number, requested: number): number {
  const material = world.grid.cells[index];
  if (material !== Material.AIR && material !== Material.CACHE) return 0;
  const available = world.food.get(index) ?? 0;
  const taken = Math.min(available, Math.max(0, requested));
  const remaining = available - taken;
  if (remaining > 0) world.food.set(index, remaining);
  else {
    world.food.delete(index);
    world.foodSources.delete(index);
  }
  return taken;
}

export function spend(world: World, ant: Ant, requested: number, metabolic = false): void {
  const amount = Math.min(Math.max(0, ant.energy), requested);
  ant.energy -= amount;
  world.economy.dissipated += amount;
  if (metabolic) world.economy.metabolism += amount;
  else world.economy.work += amount;
  world.metrics.energySpent += amount;
}

export type ResourceContext = Pick<
  World,
  "grid" | "config" | "food" | "foodSources" | "renewableSources" | "economy"
>;

export const resourceSystem = {
  id: "food-regrowth",
  version: 1,
  phase: "resources" as const,
  run: growFood,
};

export function growFood(world: ResourceContext): void {
  for (const index of world.renewableSources) {
    if (world.grid.cells[index] !== Material.AIR) continue;
    const available = world.food.get(index) ?? 0;
    const growth = Math.max(
      0,
      Math.min(world.config.foodRegrowth, world.config.sourceCapacity - available)
    );
    putFood(world, index, growth);
    world.economy.grown += growth * world.config.foodEnergyDensity;
  }
}

export function totalEnergy(world: World): number {
  let total = world.queen.energy + world.queen.cargo * world.config.foodEnergyDensity;
  for (const amount of world.food.values()) total += amount * world.config.foodEnergyDensity;
  for (const ant of world.ants) total += ant.energy + ant.cargo * world.config.foodEnergyDensity;
  for (const brood of world.brood) total += brood.energy + brood.investment;
  return total;
}

export function energyResidual(world: World): number {
  return (
    world.economy.initial + world.economy.grown - world.economy.dissipated - totalEnergy(world)
  );
}

import { type Point } from "../geometry";
import { type World } from "../types";
import { climateMesh, meshIndex } from "./mesh";
import { localClimate, thermalExcess } from "./state";
import { pointAt } from "../grid";
import { takeFood } from "../resources";

/** Body water, including initial hydration, comes from the finite local reservoir. */
export function maintenanceMultiplier(world: World, point: Point, key: string): number {
  if (!world.config.environment.climateEffects || !world.config.environment.microclimate) return 1;
  const state = world.climate,
    config = world.config.climate;
  const local = localClimate(world, point),
    mesh = climateMesh(world.grid, world.config);
  const index = meshIndex(mesh, point.x, point.y);
  if (!state.hydration.has(key)) {
    const initial = Math.min(0.8, state.water[index]);
    state.hydration.set(key, initial);
    state.water[index] -= initial;
  }
  const old = state.hydration.get(key)!;
  const change = Math.max(
    -old,
    Math.min(
      1 - old,
      state.water[index],
      config.waterExchange * (local.moisture - old) * (1 + thermalExcess(local.temperature) * 0.1)
    )
  );
  const hydration = old + change;
  state.hydration.set(key, hydration);
  state.water[index] -= change;
  return (
    1 +
    thermalExcess(local.temperature) * config.thermalStress +
    Math.max(0, 0.5 - hydration) * config.drynessStress
  );
}

export function developmentRate(world: World, point: Point): number {
  if (!world.config.environment.climateEffects) return 1;
  return 1 / (1 + thermalExcess(localClimate(world, point).temperature) * 0.2);
}

export function releaseBodyWater(world: World, point: Point, key: string): void {
  const amount = world.climate.hydration.get(key);
  if (amount === undefined) return;
  const mesh = climateMesh(world.grid, world.config);
  world.climate.water[meshIndex(mesh, point.x, point.y)] += amount;
  world.climate.hydration.delete(key);
}

export function spoilFood(world: World): void {
  if (!world.config.environment.foodSpoilage || !world.config.environment.microclimate) return;
  for (const [index, quantity] of world.food) {
    const local = localClimate(world, pointAt(world.grid, index));
    const rate =
      ((world.config.climate.spoilageRate * Math.max(0, local.temperature - 10)) / 20) *
      Math.max(0, local.moisture - 0.4);
    const lost =
      takeFood(world, index, quantity * Math.min(1, rate)) * world.config.foodEnergyDensity;
    world.economy.dissipated += lost;
    world.climate.spoiledEnergy += lost;
  }
}

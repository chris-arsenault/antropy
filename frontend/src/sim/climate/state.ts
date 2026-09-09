import { type SimConfig } from "../config";
import { type Grid } from "../grid";
import { type Point } from "../geometry";
import { type World } from "../types";
import { climateMesh, meshIndex } from "./mesh";
import { initialTemperature } from "./initialTemperature";

export interface ClimateState {
  heatCapacity: Float64Array;
  initialHeat: number;
  terrainHeat: number;
  temperature: Float64Array;
  water: Float64Array;
  hydration: Map<string, number>;
  boundaryWater: number;
  initialWater: number;
  heatExchange: number;
  spoiledEnergy: number;
}

export function createClimate(grid: Grid, config: SimConfig): ClimateState {
  const mesh = climateMesh(grid, config);
  const temperature = initialTemperature(grid, mesh, config.climate);
  const water = Float64Array.from(
    mesh.waterCapacity,
    (capacity, i) =>
      capacity *
      (mesh.exposure[i] > 0.9 ? config.climate.atmosphereMoisture : config.climate.initialMoisture)
  );
  return {
    heatCapacity: mesh.heatCapacity.slice(),
    initialHeat: mesh.heatCapacity.reduce((sum, value, i) => sum + value * temperature[i], 0),
    terrainHeat: 0,
    temperature,
    water,
    hydration: new Map(),
    boundaryWater: 0,
    initialWater: water.reduce((a, b) => a + b, 0),
    heatExchange: 0,
    spoiledEnergy: 0,
  };
}

export function localClimate(
  world: World,
  point: Point
): { temperature: number; moisture: number } {
  if (!world.config.environment.microclimate) return { temperature: 24, moisture: 0.65 };
  syncClimateGeometry(world);
  const mesh = climateMesh(world.grid, world.config),
    index = meshIndex(mesh, point.x, point.y);
  return {
    temperature: world.climate.temperature[index],
    moisture: Math.min(1, world.climate.water[index] / mesh.waterCapacity[index]),
  };
}

export function thermalExcess(temperature: number): number {
  return Math.max(0, 18 - temperature, temperature - 28);
}

/** Excavated solid leaves at its existing temperature; the thermal boundary is explicit. */
export function syncClimateGeometry(world: World): void {
  const mesh = climateMesh(world.grid, world.config),
    state = world.climate;
  if (state.heatCapacity === mesh.heatCapacity) return;
  for (let i = 0; i < mesh.heatCapacity.length; i++)
    state.terrainHeat += (mesh.heatCapacity[i] - state.heatCapacity[i]) * state.temperature[i];
  state.heatCapacity = mesh.heatCapacity;
}

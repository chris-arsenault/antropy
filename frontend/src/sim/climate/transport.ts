import { type World } from "../types";
import { climateMesh, type ClimateMesh } from "./mesh";
import { syncClimateGeometry } from "./state";

function exchange(
  world: World,
  mesh: ClimateMesh,
  a: number,
  b: number,
  heat: Float64Array,
  water: Float64Array
): void {
  const state = world.climate,
    rate = world.config.climate.exchange / (mesh.size * mesh.size);
  const thermal =
    (state.temperature[b] - state.temperature[a]) *
    rate *
    Math.min(mesh.conductivity[a], mesh.conductivity[b]) *
    Math.min(mesh.heatCapacity[a], mesh.heatCapacity[b]);
  heat[a] += thermal;
  heat[b] -= thermal;
  const moisture =
    (state.water[b] / mesh.waterCapacity[b] - state.water[a] / mesh.waterCapacity[a]) *
    rate *
    Math.min(mesh.permeability[a], mesh.permeability[b]) *
    Math.min(mesh.waterCapacity[a], mesh.waterCapacity[b]);
  water[a] += moisture;
  water[b] -= moisture;
}

function boundary(
  world: World,
  mesh: ClimateMesh,
  i: number,
  heat: Float64Array,
  water: Float64Array
): void {
  const config = world.config.climate;
  const phase = Math.sin((2 * Math.PI * world.tick) / config.dayLength);
  const air = config.meanTemperature + config.temperatureAmplitude * phase;
  const exposed = mesh.exposure[i];
  const thermal =
    exposed *
    mesh.heatCapacity[i] *
    (config.exchange * (air - world.climate.temperature[i]) +
      config.solarHeating * Math.max(0, phase));
  const moisture =
    exposed *
    config.exchange *
    (config.atmosphereMoisture * mesh.waterCapacity[i] - world.climate.water[i]);
  heat[i] += thermal;
  water[i] += moisture;
  world.climate.heatExchange += thermal;
  world.climate.boundaryWater += moisture;
}

export function stepClimate(world: World): void {
  if (!world.config.environment.microclimate || world.tick % world.config.climate.interval !== 0)
    return;
  syncClimateGeometry(world);
  const mesh = climateMesh(world.grid, world.config);
  const heat = new Float64Array(world.climate.water.length),
    water = new Float64Array(heat.length);
  for (let i = 0; i < heat.length; i++) {
    if ((i % mesh.width) + 1 < mesh.width) exchange(world, mesh, i, i + 1, heat, water);
    if (i + mesh.width < heat.length) exchange(world, mesh, i, i + mesh.width, heat, water);
    boundary(world, mesh, i, heat, water);
  }
  for (let i = 0; i < heat.length; i++) {
    world.climate.temperature[i] += heat[i] / mesh.heatCapacity[i];
    world.climate.water[i] += water[i];
  }
}

export const climateSystem = {
  id: "material-microclimate",
  version: 1,
  phase: "fields" as const,
  run: stepClimate,
};

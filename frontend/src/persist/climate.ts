import { type World } from "../sim/types";
import { type ClimateState } from "../sim/climate/state";
import { type Checkpoint2D } from "./checkpoint";

export type ClimateCheckpoint = Omit<
  ClimateState,
  "temperature" | "water" | "hydration" | "heatCapacity"
> & {
  temperature: number[];
  water: number[];
  heatCapacity: number[];
  hydration: [string, number][];
};
export function climateCheckpoint(world: World): ClimateCheckpoint {
  return {
    ...world.climate,
    temperature: [...world.climate.temperature],
    water: [...world.climate.water],
    heatCapacity: [...world.climate.heatCapacity],
    hydration: [...world.climate.hydration],
  };
}
export function restoreClimate(record: ClimateCheckpoint): ClimateState {
  return {
    ...record,
    temperature: Float64Array.from(record.temperature),
    water: Float64Array.from(record.water),
    heatCapacity: Float64Array.from(record.heatCapacity),
    hydration: new Map(record.hydration),
  };
}

function validateArrays(c: Checkpoint2D): void {
  const length =
    Math.ceil(c.config.width / c.config.climate.cellSize) *
    Math.ceil(c.config.height / c.config.climate.cellSize);
  for (const key of ["temperature", "water", "heatCapacity"] as const) {
    const values = c.climate[key];
    if (!Array.isArray(values) || values.length !== length || !values.every(Number.isFinite))
      throw new Error("invalid checkpoint climate field");
  }
  if (
    c.climate.water.some((value) => value < -1e-9) ||
    c.climate.heatCapacity.some((value) => value <= 0)
  )
    throw new Error("invalid checkpoint climate capacity or water");
}

function validateHydration(c: Checkpoint2D): void {
  const keys = new Set<string>();
  const bodies = new Set([
    ...c.ants.map((ant) => `ant:${ant.id}`),
    ...c.brood.map((brood) => `brood:${brood.id}`),
  ]);
  if (c.queen.alive) bodies.add("queen");
  for (const [key, amount] of c.climate.hydration) {
    if (keys.has(key) || !bodies.has(key) || !Number.isFinite(amount) || amount < 0 || amount > 1)
      throw new Error("invalid checkpoint body water");
    keys.add(key);
  }
}

export function validateClimateState(c: Checkpoint2D): void {
  if (!c.climate || !Array.isArray(c.climate.hydration))
    throw new Error("missing checkpoint climate");
  validateArrays(c);
  validateHydration(c);
  const state = c.climate;
  if (
    ![
      state.initialWater,
      state.boundaryWater,
      state.initialHeat,
      state.heatExchange,
      state.terrainHeat,
      state.spoiledEnergy,
    ].every(Number.isFinite)
  )
    throw new Error("invalid checkpoint climate ledger");
  const water =
    state.water.reduce((a, b) => a + b, 0) + state.hydration.reduce((a, [, b]) => a + b, 0);
  if (Math.abs(state.initialWater + state.boundaryWater - water) > Math.max(1e-6, water * 1e-10))
    throw new Error("checkpoint water budget does not conserve");
}

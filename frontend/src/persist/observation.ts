import { type World } from "../sim/types";
import { localIdentity } from "./identity";
import { validateSpatial, validatePopulation } from "./observationValidation";
import {
  spatialHistory,
  restoreSpatialHistory,
  type SpatialHistory,
} from "../observe/spatialHistory";
import {
  populationHistory,
  restorePopulationHistory,
  type PopulationHistory,
} from "../observe/populationHistory";

export interface SavedObservation {
  version: 1;
  runId: string;
  spatial: SpatialHistory;
  population: PopulationHistory;
}
const identities = new WeakMap<World, string>();
export function observationIdentity(world: World): string {
  let id = identities.get(world);
  if (!id) {
    id = localIdentity();
    identities.set(world, id);
  }
  return id;
}
export function saveObservation(world: World): SavedObservation {
  return {
    version: 1,
    runId: observationIdentity(world),
    spatial: spatialHistory(world),
    population: populationHistory(world),
  };
}
export function restoreObservation(world: World, observation: SavedObservation | undefined): void {
  if (!observation) return;
  validateObservation(observation, world.tick);
  identities.set(world, observation.runId);
  restoreSpatialHistory(world, observation.spatial);
  restorePopulationHistory(world, observation.population);
}

/** Validate the bounded observer payload separately from scientific state and ancestry. */
export function validateObservation(value: SavedObservation, tick: number): void {
  if (!value || value.version !== 1 || typeof value.runId !== "string" || value.runId.length > 128)
    throw new Error("Unsupported observation history");
  validateSpatial(value.spatial, tick);
  validatePopulation(value.population, tick);
}

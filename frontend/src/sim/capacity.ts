import { type Ant } from "./ant";
import { type SimConfig } from "./config";

/** Soil/food load capacity: body scale unless an experiment overrides it. */
export function spoilCapacity(ant: Ant, config?: SimConfig): number {
  if (config?.spoilCapacity != null) {
    return Math.max(1, Math.floor(config.spoilCapacity));
  }
  return Math.max(1, Math.round(ant.traits.bodyScale * 2));
}

/** Live-brood capacity: body scale unless an experiment overrides it. */
export function eggCarryCapacity(ant: Ant, config?: SimConfig): number {
  if (config?.broodCapacity != null) {
    return Math.max(1, Math.floor(config.broodCapacity));
  }
  return Math.max(1, Math.round(ant.traits.bodyScale));
}

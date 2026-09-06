import { makeOmniscientForager } from "./oracles/omniscientForager";
import { sensorLimitedForager } from "./oracles/sensorLimitedForager";
import { buildSingleForagerFixture } from "./singleForagerFixture";
import { type World } from "./world";

export const OMNISCIENT_FORAGER_LABEL = "Omniscient pathfinding ant";
export const SENSOR_LIMITED_FORAGER_LABEL = "Programmed sensor-limited ant";

/**
 * Attach full-map planning after the matched physical fixture exists. Planner
 * results remain private to this diagnostic and never alter a sensory field.
 */
export function buildOmniscientForagerWorld(seed: number): World {
  const { world, nest } = buildSingleForagerFixture(seed);
  world.policyOverride = makeOmniscientForager({ homeGoals: [nest.queenHome] });
  return world;
}

/** Attach the pure current-frame policy to an independently built fixture. */
export function buildSensorLimitedForagerWorld(seed: number): World {
  const { world } = buildSingleForagerFixture(seed);
  world.sensorPolicyOverride = sensorLimitedForager;
  return world;
}

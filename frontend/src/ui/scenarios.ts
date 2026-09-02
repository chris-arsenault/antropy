import { foundColony } from "../sim/colony";
import { PHASE2_CONFIG } from "../sim/config";
import { diggerSeedVector, rnnController, setRuntimeSeedBase } from "../sim/controller/rnn";
import { createWorld, populateDiggers, type World } from "../sim/world";

/**
 * What the app can run. A scenario is a world configuration plus the
 * seed the ants ship with — the two things that decide what you actually
 * watch. Without this the app could only ever run the full-liability
 * colony, so the Phase 2 work was invisible outside the test suite.
 */
export type ScenarioId = "colony" | "digging";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  build(seed: number): World;
}

const DIGGER_CREW = 9;

export const SCENARIOS: Scenario[] = [
  {
    id: "digging",
    label: "Nest digging (Phase 2)",
    description:
      "A crew seeded with the three digging reflexes, in the Phase 2 world: " +
      "no decay, weather, seasons, brood, or spoil hauling. Watch them sink a " +
      "shaft and branch it into a nest.",
    build(seed) {
      // The seed base is global controller state; set it around the draws
      // this scenario makes and clear it again immediately.
      setRuntimeSeedBase(diggerSeedVector());
      try {
        const world = createWorld(seed, rnnController, PHASE2_CONFIG);
        world.foodBase = 0; // nothing to forage: this scenario is excavation
        world.foodTarget = 0;
        populateDiggers(world, DIGGER_CREW);
        return world;
      } finally {
        setRuntimeSeedBase(null);
      }
    },
  },
  {
    id: "colony",
    label: "Colony (full world)",
    description:
      "The full-liability colony: seasons, weather, microclimate, brood " +
      "rearing, nest decay, spoil hauling, and automatic refounding.",
    build(seed) {
      setRuntimeSeedBase(null);
      const world = createWorld(seed);
      foundColony(world);
      return world;
    },
  },
];

export function scenarioById(id: ScenarioId): Scenario {
  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) {
    throw new Error(`unknown scenario "${id}"`);
  }
  return scenario;
}

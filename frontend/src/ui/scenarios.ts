import { foundColony } from "../sim/colony";
import { LADDER_STEP12_CONFIG, PHASE2_CONFIG, PROGRAMMED_COLONY_CONFIG } from "../sim/config";
import {
  diggerSeedVector,
  functionalSeedVector,
  rnnController,
  setRuntimeSeedBase,
} from "../sim/controller/rnn";
import { premarkDigSite } from "../sim/oracles/digSite";
import { authorProgrammedNest, occupyProgrammedNest } from "../sim/programmedNest";
import { createWorld, populateDiggers, type World } from "../sim/world";

/**
 * What the app can run. A scenario is a world configuration plus the
 * seed the ants ship with — the two things that decide what you actually
 * watch. Without this the app could only ever run the full-liability
 * colony, so the Phase 2 work was invisible outside the test suite.
 */
export type ScenarioId = "programmed" | "functional" | "colony" | "digging";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  build(seed: number): World;
}

const DIGGER_CREW = 9;

export const SCENARIOS: Scenario[] = [
  {
    id: "programmed",
    label: "Programmed colony review",
    description:
      "A fixed colony inside an authored 3D nest with branching, reconnecting passages and " +
      "separate queen, brood, pupae, and food chambers. Digging, reproduction, mortality, " +
      "weather, decay, and new-colony formation are disabled for structural review.",
    build(seed) {
      setRuntimeSeedBase(null);
      const world = createWorld(seed, rnnController, PROGRAMMED_COLONY_CONFIG);
      const colony = foundColony(world);
      const nest = authorProgrammedNest(world);
      occupyProgrammedNest(world, colony, nest);
      world.foodBase = 0;
      world.foodTarget = 0;
      return world;
    },
  },
  {
    id: "functional",
    label: "Appendix D ladder diagnostic",
    description:
      "The step-12 controller and final ladder configuration: " +
      "construction, spoil hauling, brood and food transport, climate, exposure, weather, " +
      "mortality, reproduction, and deterministic motor jitter. This is a mechanism diagnostic, " +
      "not a self-sustaining colony.",
    build(seed) {
      setRuntimeSeedBase(functionalSeedVector());
      try {
        const world = createWorld(seed, rnnController, LADDER_STEP12_CONFIG);
        const colony = foundColony(world);
        const mouthY = world.surfaceMap[colony.z * world.grid.sizeX + colony.x] + 1;
        premarkDigSite(world, colony.x, mouthY, colony.z, colony.id);
        return world;
      } finally {
        setRuntimeSeedBase(null);
      }
    },
  },
  {
    id: "digging",
    label: "Nest digging (Phase 2)",
    description:
      "A crew seeded with the five construction reflexes, in the Phase 2 world: " +
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

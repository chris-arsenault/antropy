import { foundColony } from "../sim/colony";
import {
  LADDER_STEP12_CONFIG,
  PHASE2_CONFIG,
  PROGRAMMED_COLONY_CONFIG,
  VARIATION_NEST_CONFIG,
} from "../sim/config";
import {
  diggerSeedVector,
  derivedColonySeedVector,
  functionalSeedVector,
  rnnController,
  setRuntimeSeedBase,
} from "../sim/controller/rnn";
import { buildAuthoredNestWorld } from "../sim/nestWorld";
import { colonyLoopOracle } from "../sim/oracles/colonyLoop";
import { premarkDigSite } from "../sim/oracles/digSite";
import { createWorld, populateDiggers, type World } from "../sim/world";

/**
 * What the app can run. A scenario is a world configuration plus the
 * seed the ants ship with — the two things that decide what you actually
 * watch. Without this the app could only ever run the full-liability
 * colony, so the Phase 2 work was invisible outside the test suite.
 */
export type ScenarioId = "programmed" | "rnn" | "variation" | "functional" | "colony" | "digging";

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
    label: "Programmed policy (Appendix E)",
    description:
      "The sensor-limited programmed policy driving ordinary ant bodies inside the authored 3D " +
      "nest. This diagnostic exposes the teacher behavior directly; it is not an evolving colony.",
    build(seed) {
      setRuntimeSeedBase(derivedColonySeedVector());
      try {
        const world = buildAuthoredNestWorld(seed, rnnController, PROGRAMMED_COLONY_CONFIG).world;
        world.sensorPolicyOverride = colonyLoopOracle;
        return world;
      } finally {
        setRuntimeSeedBase(null);
      }
    },
  },
  {
    id: "rnn",
    label: "Trained RNN (Appendix E)",
    description:
      "The trained fixed-genome RNN inside the same authored 3D nest and world configuration as " +
      "the programmed-policy diagnostic.",
    build(seed) {
      setRuntimeSeedBase(derivedColonySeedVector());
      try {
        return buildAuthoredNestWorld(seed, rnnController, PROGRAMMED_COLONY_CONFIG).world;
      } finally {
        setRuntimeSeedBase(null);
      }
    },
  },
  {
    id: "variation",
    label: "Colony with variation",
    description:
      "The instrumented authored nest with mortality, worker replacement, and inherited " +
      "variation. Founding and later ecology remain off, so this shows standing diversity—not " +
      "yet an intergenerational selection loop.",
    build(seed) {
      return buildAuthoredNestWorld(seed, rnnController, VARIATION_NEST_CONFIG).world;
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

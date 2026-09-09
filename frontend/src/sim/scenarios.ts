import {
  FORAGER_CONFIG,
  PROGRAMMED_COLONY_CONFIG,
  PROGRAMMED_LIFECYCLE_CONFIG,
  terrainConfig,
  type TerrainLayout,
  type SimConfig,
} from "./config";
import { createWorld } from "./world";
import { type ScenarioId, type World } from "./types";

export interface ScenarioDefinition {
  readonly id: ScenarioId;
  readonly label: string;
  readonly description: string;
}

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: "colony-programmed",
    label: "Programmed ants · colony knowledge",
    description: "shared discoveries, explicit routes and private task bytes",
  },
  {
    id: "colony-lgp",
    label: "Linear-program ants · colony knowledge",
    description:
      "seeded instruction programs; mutation available, reproductive inheritance pending",
  },
  {
    id: "oracle",
    label: "Map-aware pathing diagnostic",
    description: "full-map ceiling through physical actions",
  },
  {
    id: "programmed",
    label: "Programmed worker colony",
    description: "eight stateless workers over shared food, storage, and pheromones",
  },
  {
    id: "programmed-lifecycle",
    label: "Programmed colony with lifecycle",
    description: "local workers forage, feed a queen and raise brood; population follows resources",
  },
  {
    id: "rnn",
    label: "Experimental RNN creature",
    description: "historical forager comparison; select RNN colony for the trained colony model",
  },
  {
    id: "registered-colony",
    label: "RNN colony",
    description: "local controller with private task memory; awaiting visual review",
  },
] as const;

export const DEFAULT_SCENARIO: ScenarioId = "programmed-lifecycle";

export function scenarioDefinition(id: ScenarioId): ScenarioDefinition {
  const definition = SCENARIOS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`unknown scenario ${id}`);
  return definition;
}

export function scenarioConfig(id: ScenarioId, layout: TerrainLayout): SimConfig {
  let base = FORAGER_CONFIG;
  if (id === "programmed") base = PROGRAMMED_COLONY_CONFIG;
  if (["registered-colony", "programmed-lifecycle", "colony-programmed", "colony-lgp"].includes(id))
    base = PROGRAMMED_LIFECYCLE_CONFIG;
  return terrainConfig(layout, base);
}

export function buildScenarioWorld(
  id: ScenarioId,
  seed: number,
  config = scenarioConfig(id, "reference")
): World {
  if (id === "registered-colony") throw new Error("import a registered RNN model first");
  if (id === "programmed") return createWorld(seed, id, config);
  if (id === "programmed-lifecycle") {
    return createWorld(seed, id, config);
  }
  return createWorld(seed, id, config);
}

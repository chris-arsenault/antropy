import {
  buildOmniscientForagerWorld,
  buildSensorLimitedForagerWorld,
  OMNISCIENT_FORAGER_LABEL,
  SENSOR_LIMITED_FORAGER_LABEL,
} from "../sim/omniscientForagerWorld";
import { type World } from "../sim/world";

export type ScenarioId = "omniscient-single" | "sensor-limited-single";

export interface ScenarioDefinition {
  readonly id: ScenarioId;
  readonly label: string;
  readonly description: string;
  readonly build: (seed: number) => World;
}

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: "omniscient-single",
    label: OMNISCIENT_FORAGER_LABEL,
    description: "full-map pathing baseline",
    build: buildOmniscientForagerWorld,
  },
  {
    id: "sensor-limited-single",
    label: SENSOR_LIMITED_FORAGER_LABEL,
    description: "local sensors and authored physical route marks only",
    build: buildSensorLimitedForagerWorld,
  },
];

export const DEFAULT_SCENARIO: ScenarioId = "omniscient-single";

export function scenarioDefinition(id: ScenarioId): ScenarioDefinition {
  const scenario = SCENARIOS.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`unknown scenario ${id}`);
  return scenario;
}

export function buildScenarioWorld(id: ScenarioId, seed: number): World {
  return scenarioDefinition(id).build(seed);
}

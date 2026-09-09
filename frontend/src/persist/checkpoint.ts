import {
  checkpointEnvironment,
  terrainCheckpoint,
  type TerrainCheckpoint,
} from "./checkpointTerrain";
import { INPUT_COUNT } from "../sim/controller/contract";
import { validateControllerState } from "../sim/controller/runtime";
import { type SimConfig } from "../sim/config";
import { validateConfig } from "../sim/configValidation";
import { validateCheckpointState } from "./checkpointValidation";
import { simulationManifest, validateSimulationManifest } from "../sim/simulation";
import { activeIndices, restoreChemical, type ChemicalField } from "../sim/scent";
import {
  type Ant,
  type Brood,
  type Economy,
  type Queen,
  type ScenarioId,
  type World,
  type WorldMetrics,
} from "../sim/types";
import { createWorld } from "../sim/world";
import { validTask } from "../sim/taskMemory";
import { type RegisteredModel, validateRegisteredModel } from "../sim/controller/registeredModel";
import { validateLinearGenome, type LinearGenome } from "../sim/controller/linear/genome";
import { type KnownLocation } from "../sim/colony/contract";
import { type BehaviorState } from "../sim/colony/behavior";
import { validateBehavior } from "./behavior";
import { validateKnowledgeState } from "./knowledgeValidation";
import {
  constructionCheckpoint,
  restoreConstruction,
  validateConstruction,
  type ConstructionCheckpoint,
} from "./construction";

import {
  climateCheckpoint,
  restoreClimate,
  validateClimateState,
  type ClimateCheckpoint,
} from "./climate";
import {
  habitatCheckpoint,
  restoreHabitat,
  validateHabitat,
  type HabitatCheckpoint,
} from "./habitat";

export const CHECKPOINT_VERSION = 19;
type AntCheckpoint = Omit<Ant, "lastInputs" | "controllerState"> & {
  readonly lastInputs: number[];
  readonly controllerState: number[];
};
interface ChemicalCheckpoint {
  readonly active: number[];
  readonly values: number[];
}

export interface Checkpoint2D {
  readonly behavior: BehaviorState;
  readonly version: 19;
  readonly climate: ClimateCheckpoint;
  readonly habitat: HabitatCheckpoint;
  readonly construction: ConstructionCheckpoint;
  readonly knowledge: { readonly colonyId: number; readonly locations: KnownLocation[] };
  readonly linearGenome: LinearGenome | null;
  readonly mechanisms: typeof simulationManifest;
  readonly taskOverrides: number;
  readonly registeredController: RegisteredModel | null;
  readonly dimension: "2d";
  readonly seed: number;
  readonly tick: number;
  readonly scenario: ScenarioId;
  readonly config: SimConfig;
  readonly randomState: number;
  readonly grid: number[];
  readonly terrain: TerrainCheckpoint;
  readonly food: [number, number][];
  readonly renewableSources: number[];
  readonly foodOdor: ChemicalCheckpoint;
  readonly nestOdor: ChemicalCheckpoint;
  readonly pheromoneA: ChemicalCheckpoint;
  readonly pheromoneB: ChemicalCheckpoint;
  readonly freshAir: ChemicalCheckpoint;
  readonly ants: AntCheckpoint[];
  readonly brood: Brood[];
  readonly queen: AntCheckpoint & Pick<Queen, "caste" | "alive" | "carrier" | "layingAge">;
  readonly economy: Economy;
  readonly nextAntId: number;
  readonly nextBroodId: number;
  readonly metrics: WorldMetrics;
}

function antCheckpoint(ant: Ant): AntCheckpoint {
  return {
    ...ant,
    decision: structuredClone(ant.decision),
    lastInputs: [...ant.lastInputs],
    controllerState: [...ant.controllerState],
    lastAction: { ...ant.lastAction },
  };
}
function chemicalCheckpoint(field: ChemicalField): ChemicalCheckpoint {
  const active = activeIndices(field);
  return { active, values: active.map((index) => field.values[index]) };
}

export function createCheckpoint(world: World): Checkpoint2D {
  return {
    version: CHECKPOINT_VERSION,
    behavior: structuredClone(world.behavior),
    climate: climateCheckpoint(world),
    habitat: habitatCheckpoint(world.habitat),
    construction: constructionCheckpoint(world),
    knowledge: {
      colonyId: world.knowledge.colonyId,
      locations: structuredClone([...world.knowledge.locations.values()]),
    },
    linearGenome: structuredClone(world.linearGenome),
    mechanisms: structuredClone(simulationManifest),
    taskOverrides: world.taskOverrides,
    registeredController: structuredClone(world.registeredController),
    dimension: "2d",
    seed: world.seed,
    tick: world.tick,
    scenario: world.scenario,
    config: structuredClone(world.config),
    randomState: world.random.value,
    grid: [...world.grid.cells],
    terrain: terrainCheckpoint(world),
    food: [...world.food],
    renewableSources: [...world.renewableSources],
    foodOdor: chemicalCheckpoint(world.foodOdor),
    nestOdor: chemicalCheckpoint(world.nestOdor),
    pheromoneA: chemicalCheckpoint(world.pheromoneA),
    pheromoneB: chemicalCheckpoint(world.pheromoneB),
    freshAir: chemicalCheckpoint(world.freshAir),
    ants: world.ants.map(antCheckpoint),
    brood: world.brood.map((brood) => ({ ...brood })),
    queen: {
      ...antCheckpoint(world.queen),
      caste: "queen",
      alive: world.queen.alive,
      carrier: world.queen.carrier,
      layingAge: world.queen.layingAge,
    },
    economy: { ...world.economy },
    nextAntId: world.nextAntId,
    nextBroodId: world.nextBroodId,
    metrics: {
      ...world.metrics,
      pickupTicks: [...world.metrics.pickupTicks],
      depositTicks: [...world.metrics.depositTicks],
    },
  };
}

function checkpointRecord(value: unknown): Checkpoint2D {
  if (!value || typeof value !== "object") throw new Error("invalid checkpoint document");
  const record = value as Partial<Checkpoint2D>;
  if (record.dimension !== "2d" || record.version !== CHECKPOINT_VERSION) {
    throw new Error("checkpoint is not from the current canonical 2D simulation");
  }
  if (
    !Array.isArray(record.ants) ||
    !Array.isArray(record.food) ||
    !Array.isArray(record.brood) ||
    !record.queen ||
    !record.economy
  )
    throw new Error("incomplete colony checkpoint");
  return record as Checkpoint2D;
}

function restoreAnt(checkpoint: AntCheckpoint, model: RegisteredModel | null): Ant {
  if (checkpoint.lastInputs.length !== INPUT_COUNT) {
    throw new Error("checkpoint controller shape mismatch");
  }
  validateControllerState(model, checkpoint.controllerState, checkpoint.task);
  if (
    !validTask(checkpoint.task) ||
    ![checkpoint.taskAge, checkpoint.taskChanges].every(
      (value) => Number.isSafeInteger(value) && value >= 0
    )
  )
    throw new Error("invalid checkpoint task memory");
  if (checkpoint.lastAction.task !== null && !validTask(checkpoint.lastAction.task))
    throw new Error("invalid checkpoint task action");
  return {
    ...checkpoint,
    decision: structuredClone(checkpoint.decision),
    lastInputs: Float32Array.from(checkpoint.lastInputs),
    lastAction: { ...checkpoint.lastAction },
    controllerState: Float32Array.from(checkpoint.controllerState),
  };
}

function restoreFood(world: World, food: readonly [number, number][]): void {
  world.food.clear();
  world.foodSources.clear();
  for (const [index, amount] of food) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= world.grid.cells.length ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error("invalid checkpoint food quantity");
    }
    world.food.set(index, amount);
    world.foodSources.add(index);
  }
}

export function restoreCheckpoint(value: unknown): World {
  const checkpoint = checkpointRecord(value);
  validateSimulationManifest(checkpoint.mechanisms);
  validateConfig(checkpoint.config);
  validateCheckpointState(checkpoint);
  validateKnowledgeState(checkpoint);
  validateConstruction(checkpoint);
  validateClimateState(checkpoint);
  validateHabitat(checkpoint);
  validateBehavior(
    checkpoint.behavior,
    checkpoint.tick,
    checkpoint.config.width,
    checkpoint.config.height
  );
  const config = structuredClone(checkpoint.config);
  const environment = checkpointEnvironment(config, checkpoint.grid, checkpoint.terrain);
  const world = createWorld(checkpoint.seed, checkpoint.scenario, config, false, environment);
  world.knowledge = {
    colonyId: checkpoint.knowledge.colonyId,
    locations: new Map(
      checkpoint.knowledge.locations.map((location) => [location.id, structuredClone(location)])
    ),
  };
  world.linearGenome =
    checkpoint.linearGenome === null ? null : validateLinearGenome(checkpoint.linearGenome);
  if ((world.scenario === "colony-lgp") !== (world.linearGenome !== null))
    throw new Error("checkpoint scenario and linear genome disagree");
  world.registeredController =
    checkpoint.registeredController === null
      ? null
      : validateRegisteredModel(checkpoint.registeredController);
  if ((world.scenario === "registered-colony") !== (world.registeredController !== null))
    throw new Error("checkpoint scenario and registered model disagree");
  if (checkpoint.grid.length !== world.grid.cells.length) {
    throw new Error("checkpoint grid mismatch");
  }
  world.tick = checkpoint.tick;
  world.behavior = structuredClone(checkpoint.behavior);
  if (!Number.isSafeInteger(checkpoint.taskOverrides) || checkpoint.taskOverrides < 0)
    throw new Error("invalid checkpoint task intervention count");
  world.taskOverrides = checkpoint.taskOverrides;
  world.random.value = checkpoint.randomState;
  restoreFood(world, checkpoint.food);
  world.renewableSources.splice(0, world.renewableSources.length, ...checkpoint.renewableSources);
  for (const key of ["foodOdor", "nestOdor", "pheromoneA", "pheromoneB", "freshAir"] as const) {
    restoreChemical(world[key], checkpoint[key].values, checkpoint[key].active);
  }
  world.ants.splice(
    0,
    world.ants.length,
    ...checkpoint.ants.map((ant) => restoreAnt(ant, world.registeredController))
  );
  world.brood.splice(0, world.brood.length, ...checkpoint.brood.map((brood) => ({ ...brood })));
  Object.assign(world.queen, restoreAnt(checkpoint.queen, null));
  restoreConstruction(world, checkpoint.construction);
  world.climate = restoreClimate(checkpoint.climate);
  world.habitat = restoreHabitat(checkpoint.habitat);
  Object.assign(world.economy, checkpoint.economy);
  world.nextAntId = checkpoint.nextAntId;
  world.nextBroodId = checkpoint.nextBroodId;
  Object.assign(world.metrics, checkpoint.metrics, {
    pickupTicks: [...checkpoint.metrics.pickupTicks],
    depositTicks: [...checkpoint.metrics.depositTicks],
  });
  return world;
}

export function encodeCheckpoint(world: World): string {
  return JSON.stringify(createCheckpoint(world));
}
export function decodeCheckpoint(serialized: string): World {
  return restoreCheckpoint(JSON.parse(serialized) as unknown);
}

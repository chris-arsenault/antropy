import {
  validateDirectionalModel,
  DIRECTIONAL_LAYERS,
  type DenseLayer,
  type DirectionalParameters,
} from "./directionalModel";
import { COLONY_OBSERVATION_CONTRACT } from "./colonyObservation";

export const TASK_CONTRACT = "private-task-byte-v1";
export const REGISTERED_LAYERS = ["taskContext", "taskGate", "taskHead"] as const;

export interface RegisteredModel extends DirectionalParameters {
  readonly version: 5;
  readonly observationContract: typeof COLONY_OBSERVATION_CONTRACT;
  readonly taskContract: typeof TASK_CONTRACT;
  readonly globalInputs: readonly number[];
  readonly tasks: number;
  readonly gated: boolean;
  readonly temperature: number;
  readonly taskContext: DenseLayer;
  readonly taskGate: DenseLayer;
  readonly taskHead: DenseLayer;
}

export function validateRegisteredModel(model: RegisteredModel): RegisteredModel {
  const baseInputs = 111 + model.history * 8;
  validateDirectionalModel({ ...model, version: 4, inputs: baseInputs });
  if (
    model.version !== 5 ||
    model.taskContract !== TASK_CONTRACT ||
    !validCardinality(model.tasks) ||
    model.inputs !== baseInputs + model.tasks ||
    typeof model.gated !== "boolean"
  )
    throw new Error("invalid registered controller contract");
  if (!Number.isFinite(model.temperature) || model.temperature < 0 || model.temperature > 10)
    throw new Error("invalid controller sampling temperature");
  const shapes = [
    [model.hidden, model.tasks],
    [26, model.tasks],
    [model.tasks + 1, model.hidden],
  ];
  REGISTERED_LAYERS.forEach((key, index) => {
    const layer = model[key],
      [rows, columns] = shapes[index];
    if (
      !layer ||
      layer.weight.length !== rows * columns ||
      layer.bias.length !== rows ||
      ![...layer.weight, ...layer.bias].every(Number.isFinite)
    )
      throw new Error(`invalid registered layer: ${key}`);
  });
  return model;
}

function validCardinality(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 256;
}

export function registeredStateSize(model: RegisteredModel): number {
  return model.hidden + model.history * 8 + 2;
}

export function registeredParameterCount(model: RegisteredModel): number {
  return (
    model.motorBias.length +
    [...DIRECTIONAL_LAYERS, ...REGISTERED_LAYERS].reduce(
      (sum, key) => sum + model[key].weight.length + model[key].bias.length,
      0
    )
  );
}

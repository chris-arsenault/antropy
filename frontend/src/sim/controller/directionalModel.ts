import { DIRECTION_GLOBALS } from "./directionalEncoding";
import { COLONY_OBSERVATION_CONTRACT } from "./colonyObservation";

export interface DenseLayer {
  readonly weight: readonly number[];
  readonly bias: readonly number[];
}

export interface DirectionalParameters {
  readonly inputs: number;
  readonly hidden: number;
  readonly embedding: number;
  readonly history: number;
  readonly recurrent: boolean;
  readonly globalInputs?: readonly number[];
  readonly encoder: DenseLayer;
  readonly context: DenseLayer;
  readonly recurrence: DenseLayer;
  readonly scorer: DenseLayer;
  readonly direction: DenseLayer;
  readonly care: DenseLayer;
  readonly motorBias: readonly number[];
}

export type DirectionalModel = DirectionalParameters &
  (
    | { readonly version: 2 | 3 }
    | {
        readonly version: 4;
        readonly observationContract: typeof COLONY_OBSERVATION_CONTRACT;
        readonly globalInputs: readonly number[];
      }
  );

export const DIRECTIONAL_LAYERS = [
  "encoder",
  "context",
  "recurrence",
  "scorer",
  "direction",
  "care",
] as const;

function validateGlobalInputs(model: DirectionalModel): void {
  if (model.version === 4) {
    if (
      model.observationContract !== COLONY_OBSERVATION_CONTRACT ||
      JSON.stringify(model.globalInputs) !== JSON.stringify(DIRECTION_GLOBALS)
    )
      throw new Error("invalid matched observation contract");
    return;
  }
  if (
    model.globalInputs &&
    (model.globalInputs.length !== 9 ||
      !model.globalInputs.every((index) => Number.isInteger(index) && index >= 0 && index < 111))
  )
    throw new Error("invalid directional global inputs");
}

export function validateDirectionalModel(model: DirectionalModel): DirectionalModel {
  const { hidden: h, embedding: e, history } = model;
  validateGlobalInputs(model);
  if (
    ![2, 3, 4].includes(model.version) ||
    ![h, e].every((n) => Number.isInteger(n) && n > 0 && n <= 256) ||
    ![0, 4].includes(history) ||
    model.inputs !== 111 + history * 8 ||
    typeof model.recurrent !== "boolean"
  )
    throw new Error("invalid directional contract");
  const shapes = [
    [e, 16],
    [h, 8 * e + (model.version === 4 ? 10 : 9) + history * 8],
    [h, h],
    [e, (model.version !== 2 ? 3 * e + 3 : e) + h],
    [1, e],
    [7, h],
  ];
  DIRECTIONAL_LAYERS.forEach((key, index) => {
    const layer = model[key],
      [rows, cols] = shapes[index];
    if (
      layer.weight.length !== rows * cols ||
      layer.bias.length !== rows ||
      ![...layer.weight, ...layer.bias].every(Number.isFinite)
    )
      throw new Error(`invalid directional layer: ${key}`);
  });
  if (model.motorBias.length !== 3 || !model.motorBias.every(Number.isFinite))
    throw new Error("invalid directional motor bias");
  return model;
}

export function dense(
  inputs: ArrayLike<number>,
  layer: DenseLayer,
  activate: boolean
): Float32Array {
  return Float32Array.from(layer.bias, (bias, row) => {
    let sum = bias;
    for (let col = 0; col < inputs.length; col++)
      sum += layer.weight[row * inputs.length + col] * inputs[col];
    return activate ? Math.tanh(sum) : sum;
  });
}

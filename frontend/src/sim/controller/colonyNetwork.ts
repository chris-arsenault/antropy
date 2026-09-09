import { type ColonyFrame } from "../colonySensors";
import { type RandomState, nextRandom } from "../random";
import {
  COLONY_INPUT_COUNT,
  COLONY_OUTPUT_COUNT,
  decodeColonyOutputs,
  encodeColonyFrame,
} from "./colonyEncoding";

export interface ColonyModel {
  readonly version: 1;
  readonly inputs: number;
  readonly hidden: number;
  readonly recurrent: boolean;
  readonly inputWeight: readonly number[];
  readonly hiddenBias: readonly number[];
  readonly recurrentWeight: readonly number[];
  readonly decisionWeight: readonly number[];
  readonly decisionBias: readonly number[];
  readonly outputWeight: readonly number[];
  readonly outputBias: readonly number[];
}

const WEIGHTS = [
  "inputWeight",
  "hiddenBias",
  "recurrentWeight",
  "decisionWeight",
  "decisionBias",
  "outputWeight",
  "outputBias",
] as const;

export function createColonyState(model: ColonyModel): Float32Array {
  return new Float32Array(model.hidden);
}

export function withoutColonyMemory(model: ColonyModel): ColonyModel {
  return { ...model, recurrent: false };
}

export function validateColonyModel(model: ColonyModel): ColonyModel {
  if (
    model.version !== 1 ||
    model.inputs !== COLONY_INPUT_COUNT ||
    !Number.isInteger(model.hidden) ||
    model.hidden < 1 ||
    model.hidden > 256
  )
    throw new Error("invalid colony model contract");
  const h = model.hidden;
  const sizes = [
    h * model.inputs,
    h,
    h * h,
    h * h,
    h,
    COLONY_OUTPUT_COUNT * h,
    COLONY_OUTPUT_COUNT,
  ];
  WEIGHTS.forEach((key, index) => {
    if (model[key].length !== sizes[index] || !model[key].every(Number.isFinite))
      throw new Error(`invalid colony weights: ${key}`);
  });
  return model;
}

function layer(
  inputs: ArrayLike<number>,
  weights: readonly number[],
  biases: readonly number[],
  activate: boolean
): Float32Array {
  const result = new Float32Array(biases.length);
  for (let row = 0; row < result.length; row++) {
    let sum = biases[row];
    for (let col = 0; col < inputs.length; col++)
      sum += weights[row * inputs.length + col] * inputs[col];
    result[row] = activate ? Math.tanh(sum) : sum;
  }
  return result;
}

export function colonyLogits(
  model: ColonyModel,
  inputs: Float32Array,
  state: Float32Array
): Float32Array {
  const hidden = layer(inputs, model.inputWeight, model.hiddenBias, false);
  for (let row = 0; row < model.hidden; row++) {
    let sum = hidden[row];
    if (model.recurrent) {
      for (let col = 0; col < model.hidden; col++)
        sum += model.recurrentWeight[row * model.hidden + col] * state[col];
    }
    hidden[row] = Math.tanh(sum);
  }
  state.set(hidden);
  const decision = layer(hidden, model.decisionWeight, model.decisionBias, true);
  return layer(decision, model.outputWeight, model.outputBias, false);
}

export function actColonyNetwork(model: ColonyModel, frame: ColonyFrame, state: Float32Array) {
  return decodeColonyOutputs(colonyLogits(model, encodeColonyFrame(frame), state));
}

export function perturbColonyModel(
  model: ColonyModel,
  random: RandomState,
  rms: number
): ColonyModel {
  const result = { ...model };
  for (const key of WEIGHTS) {
    result[key] = model[key].map(
      (weight) => weight + (nextRandom(random) * 2 - 1) * Math.sqrt(3) * rms
    );
  }
  return result;
}

export function colonyModelDistance(left: ColonyModel, right: ColonyModel): number {
  let squared = 0;
  let count = 0;
  for (const key of WEIGHTS)
    for (let index = 0; index < left[key].length; index++) {
      squared += (left[key][index] - right[key][index]) ** 2;
      count++;
    }
  return Math.sqrt(squared / count);
}

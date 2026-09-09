import * as legacy from "../../src/sim/controller/colonyNetwork";
import * as directional from "../../src/sim/controller/directionalNetwork";
import {
  DIRECTIONAL_LAYERS,
  type DirectionalModel,
} from "../../src/sim/controller/directionalModel";
import { type ColonyFrame } from "../../src/sim/colonySensors";
import { nextRandom, type RandomState } from "../../src/sim/random";
import * as registered from "../../src/sim/controller/registeredNetwork";
import { REGISTERED_LAYERS, type RegisteredModel } from "../../src/sim/controller/registeredModel";

export type ColonyModel = legacy.ColonyModel | DirectionalModel | RegisteredModel;

export function createColonyState(model: ColonyModel, seed = 1): Float32Array {
  if (model.version === 5) return registered.createRegisteredState(model, seed);
  return model.version === 1
    ? legacy.createColonyState(model)
    : directional.createDirectionalState(model);
}

export function actColonyNetwork(model: ColonyModel, frame: ColonyFrame, state: Float32Array) {
  if (model.version === 5) return registered.actRegistered(model, frame, state);
  return model.version === 1
    ? legacy.actColonyNetwork(model, frame, state)
    : directional.actDirectionalNetwork(model, frame, state);
}

export function colonyLogits(model: ColonyModel, inputs: Float32Array, state: Float32Array) {
  if (model.version === 5) return registered.registeredLogits(model, inputs, state);
  return model.version === 1
    ? legacy.colonyLogits(model, inputs, state)
    : directional.directionalLogits(model, inputs, state);
}

export function withoutColonyMemory(model: ColonyModel): ColonyModel {
  return { ...model, recurrent: false };
}

export function perturbColonyModel(
  model: ColonyModel,
  random: RandomState,
  rms: number
): ColonyModel {
  if (model.version === 1) return legacy.perturbColonyModel(model, random, rms);
  const perturb = (values: readonly number[]) =>
    values.map((value) => Math.fround(value + (nextRandom(random) * 2 - 1) * Math.sqrt(3) * rms));
  const result = { ...model, motorBias: perturb(model.motorBias) };
  for (const key of DIRECTIONAL_LAYERS)
    result[key] = { weight: perturb(model[key].weight), bias: perturb(model[key].bias) };
  if (model.version === 5)
    return {
      ...result,
      ...Object.fromEntries(
        REGISTERED_LAYERS.map((key) => [
          key,
          { weight: perturb(model[key].weight), bias: perturb(model[key].bias) },
        ])
      ),
    } as RegisteredModel;
  return result;
}

export function colonyModelDistance(left: ColonyModel, right: ColonyModel): number {
  if (left.version === 1 && right.version === 1) return legacy.colonyModelDistance(left, right);
  if (left.version === 1 || right.version === 1 || left.version !== right.version)
    throw new Error("different model topologies");
  const flatten = (model: DirectionalModel | RegisteredModel) => [
    ...model.motorBias,
    ...DIRECTIONAL_LAYERS.flatMap((key) => [...model[key].weight, ...model[key].bias]),
    ...(model.version === 5
      ? REGISTERED_LAYERS.flatMap((key) => [...model[key].weight, ...model[key].bias])
      : []),
  ];
  const a = flatten(left),
    b = flatten(right);
  if (a.length !== b.length) throw new Error("different model sizes");
  return Math.sqrt(a.reduce((sum, value, i) => sum + (value - b[i]) ** 2, 0) / a.length);
}

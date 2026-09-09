import {
  type DirectionalModel,
  DIRECTIONAL_LAYERS,
  validateDirectionalModel,
} from "../../src/sim/controller/directionalModel";
import { DIRECTION_GLOBALS } from "../../src/sim/controller/directionalEncoding";
import { COLONY_OBSERVATION_CONTRACT } from "../../src/sim/controller/colonyObservation";
import { createRandomState, nextRandom } from "../../src/sim/random";
import { type OutcomeResults } from "./colonyOutcomePool";
import { REGISTERED_LAYERS, type RegisteredModel } from "../../src/sim/controller/registeredModel";

/** Explicit initialization from the archived nine-global topology; runtime remains version 4. */
export function outcomeSeed(model: DirectionalModel): DirectionalModel {
  if (model.version === 4) return validateDirectionalModel(model);
  if (
    model.version !== 3 ||
    JSON.stringify(model.globalInputs) !== JSON.stringify(DIRECTION_GLOBALS.slice(0, -1))
  )
    throw new Error("outcome initialization needs the corrected directional input mapping");
  const before = 8 * model.embedding + 9,
    width = before + model.history * 8;
  const weight = Array.from({ length: model.hidden }, (_, row) => [
    ...model.context.weight.slice(row * width, row * width + before),
    0,
    ...model.context.weight.slice(row * width + before, (row + 1) * width),
  ]).flat();
  return validateDirectionalModel({
    ...model,
    version: 4,
    globalInputs: DIRECTION_GLOBALS,
    observationContract: COLONY_OBSERVATION_CONTRACT,
    context: { ...model.context, weight },
  });
}

export function outcomeFitness(results: OutcomeResults) {
  return {
    worst: Math.min(...results.map((result) => result.score)),
    mean: results.reduce((sum, result) => sum + result.score, 0) / results.length,
  };
}

export function compareOutcomes(a: OutcomeResults, b: OutcomeResults): number {
  const left = outcomeFitness(a),
    right = outcomeFitness(b);
  return left.worst - right.worst || left.mean - right.mean;
}

/** Every recurrent actor parameter is mutable. Larger readout perturbations explore action choice. */
export function outcomeMutation<T extends DirectionalModel | RegisteredModel>(
  model: T,
  seed: number,
  sign: number,
  scale: number
): T {
  const random = createRandomState(seed);
  const perturb = (values: readonly number[], amplitude: number) =>
    values.map((value) =>
      Math.fround(value + sign * scale * amplitude * (nextRandom(random) * 2 - 1))
    );
  const layers = Object.fromEntries(
    DIRECTIONAL_LAYERS.map((key) => {
      const readout = key === "care" || key === "direction";
      return [
        key,
        {
          weight: perturb(model[key].weight, readout ? 0.05 : 0.005),
          bias: perturb(model[key].bias, readout ? 0.5 : 0.05),
        },
      ];
    })
  );
  const result = { ...model, ...layers, motorBias: perturb(model.motorBias, 0.5) };
  if (model.version === 5)
    return {
      ...result,
      ...Object.fromEntries(
        REGISTERED_LAYERS.map((key) => [
          key,
          {
            weight: perturb(model[key].weight, key === "taskHead" ? 0.05 : 0.005),
            bias: perturb(model[key].bias, key === "taskHead" ? 0.5 : 0.05),
          },
        ])
      ),
    } as T;
  return result as T;
}

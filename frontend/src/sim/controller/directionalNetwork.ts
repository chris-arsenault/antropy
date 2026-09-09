import { type ColonyFrame } from "../colonySensors";
import { colonyMotor, decodeColonyOutputs } from "./colonyEncoding";
import {
  INITIAL_DIRECTION_GLOBALS,
  directionSamples,
  encodeDirectionalFrame,
  rememberMotor,
} from "./directionalEncoding";
import { dense, type DirectionalModel } from "./directionalModel";
import { recurrentHidden, directionalReadout } from "./directionalCore";

export function createDirectionalState(model: DirectionalModel): Float32Array {
  return new Float32Array(model.hidden + model.history * 8);
}

/** All direction branches share parameters; care and movement compete in the same decoder. */
export function directionalLogits(
  model: DirectionalModel,
  inputs: Float32Array,
  state: Float32Array
): Float32Array {
  const embeddings = directionSamples(inputs).map((sample) => dense(sample, model.encoder, true));
  const context = [
    ...embeddings.flatMap((embedding) => [...embedding]),
    ...(model.globalInputs ?? INITIAL_DIRECTION_GLOBALS).map((index) => inputs[index]),
    ...inputs.slice(111),
  ];
  const hidden = recurrentHidden(model, context, state, null);
  return directionalReadout(model, embeddings, hidden);
}

export function actDirectionalNetwork(
  model: DirectionalModel,
  frame: ColonyFrame,
  state: Float32Array
) {
  const history = state.subarray(model.hidden);
  const action = decodeColonyOutputs(
    directionalLogits(model, encodeDirectionalFrame(frame, history), state)
  );
  rememberMotor(history, colonyMotor(action));
  return action;
}

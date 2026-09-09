import { type ColonyFrame } from "../colonySensors";
import { colonyMotor, decodeColonyOutputs, encodeColonyFrame } from "./colonyEncoding";
import { directionSamples, rememberMotor } from "./directionalEncoding";
import { dense } from "./directionalModel";
import { directionalReadout, recurrentHidden } from "./directionalCore";
import { type RegisteredModel, registeredStateSize } from "./registeredModel";

export function createRegisteredState(model: RegisteredModel, seed = 1): Float32Array {
  const state = new Float32Array(registeredStateSize(model));
  const value = seed >>> 0 || 1;
  state[state.length - 2] = value & 65535;
  state[state.length - 1] = value >>> 16;
  return state;
}

/** Two exact 16-bit words preserve a private PRNG in float32 checkpoint state. */
export function registeredRandom(state: Float32Array): number {
  let value = (state[state.length - 2] | (state[state.length - 1] << 16)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state[state.length - 2] = value & 65535;
  state[state.length - 1] = value >>> 16;
  return (value >>> 0) / 0x100000000;
}

export function encodeRegisteredFrame(
  model: RegisteredModel,
  frame: ColonyFrame,
  history: ArrayLike<number>
): Float32Array {
  return Float32Array.from([
    ...encodeColonyFrame(frame),
    ...Array.from(history),
    ...Array.from({ length: model.tasks }, (_, value) => Number(value === frame.task)),
  ]);
}

/** Task-dependent gates are learned weights over ordinary local receptors, not field selectors. */
export function registeredLogits(
  model: RegisteredModel,
  inputs: Float32Array,
  state: Float32Array
): Float32Array {
  const base = 111 + model.history * 8,
    task = inputs.subarray(base);
  const rawGate = dense(task, model.taskGate, false);
  const gate = rawGate.map((value) => (model.gated ? 2 / (1 + Math.exp(-value)) : 1));
  const embeddings = directionSamples(inputs).map((sample) =>
    dense(
      sample.map((value, index) => value * gate[index]),
      model.encoder,
      true
    )
  );
  const context = [
    ...embeddings.flatMap((embedding) => [...embedding]),
    ...model.globalInputs.map((index, i) => inputs[index] * gate[16 + i]),
    ...inputs.subarray(111, base),
  ];
  const hidden = recurrentHidden(model, context, state, dense(task, model.taskContext, false));
  return Float32Array.from([
    ...directionalReadout(model, embeddings, hidden),
    ...dense(hidden, model.taskHead, false),
  ]);
}

export function categorical(logits: ArrayLike<number>, temperature: number, draw: number): number {
  const values = Array.from(logits);
  const maximum = Math.max(...values);
  if (temperature === 0) return values.indexOf(maximum);
  const weights = values.map((value) => Math.exp((value - maximum) / temperature));
  let threshold = draw * weights.reduce((sum, value) => sum + value, 0);
  for (let i = 0; i < weights.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return i;
  }
  return weights.length - 1;
}

export function registeredAction(
  model: RegisteredModel,
  logits: Float32Array,
  motorDraw: number,
  taskDraw: number
) {
  const motor = categorical(logits.subarray(0, 8), model.temperature, motorDraw);
  const selected = logits.slice(0, 10);
  selected.fill(-1, 0, 8);
  selected[motor] = 1;
  const task = categorical(logits.subarray(10), model.temperature, taskDraw);
  return { ...decodeColonyOutputs(selected), task: task === 0 ? null : task - 1 };
}

export function actRegistered(model: RegisteredModel, frame: ColonyFrame, state: Float32Array) {
  const history = state.subarray(model.hidden, model.hidden + model.history * 8);
  const logits = registeredLogits(model, encodeRegisteredFrame(model, frame, history), state);
  const action = registeredAction(model, logits, registeredRandom(state), registeredRandom(state));
  rememberMotor(history, colonyMotor(action));
  return action;
}

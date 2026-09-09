import { type ColonyFrame } from "../colonySensors";
import { type Action, IDLE_ACTION } from "./contract";
import { quantizeColonyFrame } from "./colonyObservation";

export const COLONY_INPUT_COUNT = 111;
export const COLONY_MOTOR_COUNT = 8;
export const COLONY_OUTPUT_COUNT = 10;
export const COLONY_MOTORS = ["idle", "left", "right", "move", "pickup", "eat", "feed", "release"];

/** Receptor contrast among locally sampled values; no destination or action is encoded. */
function contrast(values: readonly number[]): number[] {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const scale = Math.max(1e-12, ...values.map((value) => Math.abs(value - mean)));
  return values.map((value) => (value - mean) / scale);
}

export function encodeColonyFrame(observation: ColonyFrame): Float32Array {
  const frame = quantizeColonyFrame(observation);
  const values = [...frame.navigation];
  for (const contact of frame.contacts) {
    values.push(
      Number(contact.open),
      Math.min(1, contact.food / 4),
      Number(contact.edible),
      Number(contact.hungry),
      Number(contact.queen)
    );
  }
  values.push(...frame.freshAir, frame.hunger, frame.cargo / 4, ...contrast(frame.freshAir));
  for (const indices of [
    [4, 5, 6, 24, 25],
    [8, 9, 10, 26, 27],
    [12, 13, 14, 28, 29],
    [16, 17, 18, 30, 31],
  ]) {
    values.push(...contrast(indices.map((index) => frame.navigation[index])));
  }
  return Float32Array.from(values);
}

export function colonyMotor(action: Action): number {
  if (action.eat) return 5;
  if (action.feed) return 6;
  if (action.release) return 7;
  if (action.mandible) return 4;
  if (action.turn !== 0) return action.turn === 1 ? 1 : 2;
  return action.move ? 3 : 0;
}

export function decodeColonyOutputs(outputs: ArrayLike<number>): Action {
  let motor = 0;
  for (let index = 1; index < COLONY_MOTOR_COUNT; index++) {
    if (outputs[index] > outputs[motor]) motor = index;
  }
  let turn: -1 | 0 | 1 = 0;
  if (motor === 1) turn = 1;
  if (motor === 2) turn = -1;
  return {
    ...IDLE_ACTION,
    turn,
    move: motor === 3,
    mandible: motor === 4,
    eat: motor === 5,
    feed: motor === 6,
    release: motor === 7,
    pheromoneA: 1 / (1 + Math.exp(-outputs[8])),
    pheromoneB: 1 / (1 + Math.exp(-outputs[9])),
  };
}

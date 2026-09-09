import { type ColonyFrame } from "../colonySensors";
import { encodeColonyFrame } from "./colonyEncoding";
import { Input } from "./contract";

export const DIRECTION_FEATURES = 16;
export const DIRECTION_GLOBALS = [
  Input.FOOD_CENTER,
  Input.NEST_CENTER,
  Input.PHEROMONE_A_CENTER,
  Input.PHEROMONE_B_CENTER,
  Input.SKY_LIGHT,
  Input.JITTER,
  Input.HANDEDNESS,
  81,
  82,
  Input.CARRYING,
];
export const INITIAL_DIRECTION_GLOBALS = [3, 7, 11, 15, 22, 23, 32, 81, 82];
const ODORS = [
  [4, 5, 6, 24, 25],
  [8, 9, 10, 26, 27],
  [12, 13, 14, 28, 29],
  [16, 17, 18, 30, 31],
];
const SAMPLED = [0, 1, 7, 2, 6];

/** Missing rear odor receptors are explicitly masked; no heading is selected here. */
export function directionSamples(inputs: ArrayLike<number>): Float32Array[] {
  return Array.from({ length: 8 }, (_, offset) => {
    const position = SAMPLED.indexOf(offset);
    const contact = Array.from({ length: 5 }, (_, i) => inputs[33 + offset * 5 + i]);
    const raw = ODORS.map((indices) => (position < 0 ? 0 : inputs[indices[position]]));
    const normalized = ODORS.map((_, i) => (position < 0 ? 0 : inputs[91 + i * 5 + position]));
    return Float32Array.from([
      ...contact,
      inputs[73 + offset],
      inputs[83 + offset],
      ...raw,
      ...normalized,
      Number(position >= 0),
    ]);
  });
}

export function encodeDirectionalFrame(
  frame: ColonyFrame,
  history: ArrayLike<number>
): Float32Array {
  return Float32Array.from([...encodeColonyFrame(frame), ...Array.from(history)]);
}

/** Most recent attempted motor first. This records commands, not privileged action outcomes. */
export function rememberMotor(history: Float32Array, motor: number): void {
  if (history.length === 0) return;
  history.copyWithin(8, 0, history.length - 8);
  history.fill(0, 0, 8);
  history[motor] = 1;
}

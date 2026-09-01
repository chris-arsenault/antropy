import { ACTION_THRESHOLD, Output } from "./controller/contract";
import { type MotorState } from "./movement";

/** Decoded motor outputs for one tick. */
export interface Actions {
  motor: MotorState;
  eat: boolean;
  dig: boolean;
  pheromoneA: number;
  pheromoneB: number;
  layEgg: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Single-threaded scratch — contents valid until the next decodeOutputs call.
const ACTIONS_SCRATCH: Actions = {
  motor: { turn: 0, forward: 0, verticalBias: 0 },
  eat: false,
  dig: false,
  pheromoneA: 0,
  pheromoneB: 0,
  layEgg: false,
};

/**
 * Decode a controller's raw output vector (design spec §4). Returns a reused
 * scratch object — consume before the next call, do not retain.
 */
export function decodeOutputs(outputs: Float32Array): Actions {
  ACTIONS_SCRATCH.motor.turn = clamp(outputs[Output.TURN], -1, 1);
  ACTIONS_SCRATCH.motor.forward = clamp(outputs[Output.FORWARD], 0, 1);
  ACTIONS_SCRATCH.motor.verticalBias = clamp(outputs[Output.VERTICAL_BIAS], -1, 1);
  ACTIONS_SCRATCH.eat = outputs[Output.EAT] > ACTION_THRESHOLD;
  ACTIONS_SCRATCH.dig = outputs[Output.DIG] > ACTION_THRESHOLD;
  ACTIONS_SCRATCH.pheromoneA = clamp(outputs[Output.PHEROMONE_A], 0, 1);
  ACTIONS_SCRATCH.pheromoneB = clamp(outputs[Output.PHEROMONE_B], 0, 1);
  ACTIONS_SCRATCH.layEgg = outputs[Output.LAY_EGG] > ACTION_THRESHOLD;
  return ACTIONS_SCRATCH;
}

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

/** Decode a controller's raw output vector (design spec §4). */
export function decodeOutputs(outputs: Float32Array): Actions {
  return {
    motor: {
      turn: clamp(outputs[Output.TURN], -1, 1),
      forward: clamp(outputs[Output.FORWARD], 0, 1),
      verticalBias: clamp(outputs[Output.VERTICAL_BIAS], -1, 1),
    },
    eat: outputs[Output.EAT] > ACTION_THRESHOLD,
    dig: outputs[Output.DIG] > ACTION_THRESHOLD,
    pheromoneA: clamp(outputs[Output.PHEROMONE_A], 0, 1),
    pheromoneB: clamp(outputs[Output.PHEROMONE_B], 0, 1),
    layEgg: outputs[Output.LAY_EGG] > ACTION_THRESHOLD,
  };
}

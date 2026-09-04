import { ACTION_THRESHOLD, Output, OUTPUT_COUNT } from "../../src/sim/controller/contract";
import { type SensorFrame } from "../experiments/colonyLoop";

export interface ActionClassBalance {
  actionPositiveCounts: number[];
  actionPositiveWeights: number[];
}

export const BINARY_OUTPUTS = [Output.EAT, Output.DIG, Output.LAY_EGG] as const;

function accumulatePositiveActions(frame: SensorFrame, counts: number[]): void {
  for (const output of BINARY_OUTPUTS) {
    if (frame.outputs[output] > ACTION_THRESHOLD) {
      counts[output] += 1;
    }
  }
}

/** Balance rare binary actuator labels against their inactive frames. */
export function actionClassBalance(training: SensorFrame[][]): ActionClassBalance {
  const counts = new Array<number>(OUTPUT_COUNT).fill(0);
  let frameCount = 0;
  for (const frames of training) {
    for (const frame of frames) {
      frameCount += 1;
      accumulatePositiveActions(frame, counts);
    }
  }
  const weights = new Array<number>(OUTPUT_COUNT).fill(1);
  for (const output of BINARY_OUTPUTS) {
    if (counts[output] > 0) {
      weights[output] = (frameCount - counts[output]) / counts[output];
    }
  }
  return { actionPositiveCounts: counts, actionPositiveWeights: weights };
}

export function trainingBalance(
  training: SensorFrame[][],
  useCorpusBalance: boolean
): ActionClassBalance {
  const balance = actionClassBalance(training);
  if (useCorpusBalance) return balance;
  balance.actionPositiveWeights[Output.EAT] = 40;
  balance.actionPositiveWeights[Output.DIG] = 40;
  balance.actionPositiveWeights[Output.LAY_EGG] = 1;
  return balance;
}

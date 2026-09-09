import { type Action } from "../../src/sim/controller/contract";
import { RNN_OUTPUT_COUNT, RnnOutput } from "../../src/sim/controller/rnn";

export function actionCategory(action: Action): string {
  if (action.mandible) return "mandible";
  if (action.turn < 0) return "turn-right";
  if (action.turn > 0) return "turn-left";
  if (action.move && action.pheromoneB > 0) return "return-move";
  if (action.move) return "outbound-move";
  return "idle";
}

function motorFor(action: Action): RnnOutput {
  if (action.mandible) return RnnOutput.MANDIBLE;
  if (action.turn > 0) return RnnOutput.TURN_LEFT;
  if (action.turn < 0) return RnnOutput.TURN_RIGHT;
  return action.move ? RnnOutput.MOVE : RnnOutput.IDLE;
}

export function trainingTargets(action: Action): Float32Array {
  const result = new Float32Array(RNN_OUTPUT_COUNT);
  result[motorFor(action)] = 1;
  result[RnnOutput.PHEROMONE_A] = action.pheromoneA > 0 ? 1 : 0;
  result[RnnOutput.PHEROMONE_B] = action.pheromoneB > 0 ? 1 : 0;
  return result;
}

export function actionsMatch(left: Action, right: Action): boolean {
  return (
    left.turn === right.turn &&
    left.move === right.move &&
    left.mandible === right.mandible &&
    left.pheromoneA > 0 === right.pheromoneA > 0 &&
    left.pheromoneB > 0 === right.pheromoneB > 0
  );
}

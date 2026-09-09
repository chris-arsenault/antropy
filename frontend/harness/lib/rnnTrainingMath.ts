import { INPUT_COUNT } from "../../src/sim/controller/contract";
import {
  DECISION_COUNT,
  HIDDEN_COUNT,
  RNN_GENOME_LENGTH,
  RNN_LAYOUT,
  RNN_OUTPUT_COUNT,
} from "../../src/sim/controller/rnn";
import { createRandomState, nextRandom, type RandomState } from "../../src/sim/random";

function randomizeMatrix(
  genome: Float32Array,
  start: number,
  rows: number,
  columns: number,
  random: RandomState,
  scale: number
): void {
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      genome[start + row * columns + column] = (nextRandom(random) * 2 - 1) * scale;
    }
  }
}

export function initializeTrainingGenome(): Float32Array {
  const random = createRandomState(0x2d_12);
  const genome = new Float32Array(RNN_GENOME_LENGTH);
  const scale = Math.sqrt(6 / (INPUT_COUNT + HIDDEN_COUNT));
  randomizeMatrix(genome, RNN_LAYOUT.input, HIDDEN_COUNT, INPUT_COUNT, random, scale);
  randomizeMatrix(genome, RNN_LAYOUT.decision, DECISION_COUNT, HIDDEN_COUNT, random, scale);
  randomizeMatrix(genome, RNN_LAYOUT.output, RNN_OUTPUT_COUNT, DECISION_COUNT, random, scale);
  return genome;
}

function activatedLayer(
  genome: Float32Array,
  inputs: ArrayLike<number>,
  weights: number,
  biases: number,
  units: number
): Float64Array {
  const result = new Float64Array(units);
  for (let unit = 0; unit < units; unit++) {
    let sum = genome[biases + unit];
    for (let input = 0; input < inputs.length; input++) {
      sum += genome[weights + unit * inputs.length + input] * inputs[input];
    }
    result[unit] = Math.tanh(sum);
  }
  return result;
}

function outputLogits(genome: Float32Array, decision: Float64Array): Float64Array {
  const logits = new Float64Array(RNN_OUTPUT_COUNT);
  for (let output = 0; output < RNN_OUTPUT_COUNT; output++) {
    let sum = genome[RNN_LAYOUT.outputBias + output];
    for (let unit = 0; unit < DECISION_COUNT; unit++) {
      sum += genome[RNN_LAYOUT.output + output * DECISION_COUNT + unit] * decision[unit];
    }
    logits[output] = sum;
  }
  return logits;
}

export function trainingForward(
  genome: Float32Array,
  inputs: Float32Array
): [Float64Array, Float64Array, Float64Array] {
  const hidden = activatedLayer(
    genome,
    inputs,
    RNN_LAYOUT.input,
    RNN_LAYOUT.hiddenBias,
    HIDDEN_COUNT
  );
  const decision = activatedLayer(
    genome,
    hidden,
    RNN_LAYOUT.decision,
    RNN_LAYOUT.decisionBias,
    DECISION_COUNT
  );
  return [hidden, decision, outputLogits(genome, decision)];
}

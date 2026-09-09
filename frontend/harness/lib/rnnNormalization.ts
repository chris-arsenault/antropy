import { Input, INPUT_COUNT } from "../../src/sim/controller/contract";
import { HIDDEN_COUNT, RNN_LAYOUT } from "../../src/sim/controller/rnn";

export interface InputNormalization {
  readonly mean: Float64Array;
  readonly inverseDeviation: Float64Array;
}

const DIFFERENCE_BASE = new Map<Input, Input>([
  [Input.FOOD_LEFT, Input.FOOD_FORWARD],
  [Input.FOOD_RIGHT, Input.FOOD_FORWARD],
  [Input.FOOD_WIDE_RIGHT, Input.FOOD_WIDE_LEFT],
  [Input.NEST_LEFT, Input.NEST_FORWARD],
  [Input.NEST_RIGHT, Input.NEST_FORWARD],
  [Input.NEST_WIDE_RIGHT, Input.NEST_WIDE_LEFT],
  [Input.PHEROMONE_A_LEFT, Input.PHEROMONE_A_FORWARD],
  [Input.PHEROMONE_A_RIGHT, Input.PHEROMONE_A_FORWARD],
  [Input.PHEROMONE_A_WIDE_RIGHT, Input.PHEROMONE_A_WIDE_LEFT],
  [Input.PHEROMONE_B_LEFT, Input.PHEROMONE_B_FORWARD],
  [Input.PHEROMONE_B_RIGHT, Input.PHEROMONE_B_FORWARD],
  [Input.PHEROMONE_B_WIDE_RIGHT, Input.PHEROMONE_B_WIDE_LEFT],
]);

function comparisonBasis(inputs: Float32Array): Float32Array {
  const transformed = Float32Array.from(inputs);
  for (const [difference, base] of DIFFERENCE_BASE) {
    transformed[difference] -= inputs[base];
  }
  return transformed;
}

export function inputNormalization(frames: readonly Float32Array[]): InputNormalization {
  const transformed = frames.map(comparisonBasis);
  const mean = new Float64Array(INPUT_COUNT);
  const variance = new Float64Array(INPUT_COUNT);
  for (const frame of transformed) {
    for (let input = 0; input < INPUT_COUNT; input++) mean[input] += frame[input];
  }
  for (let input = 0; input < INPUT_COUNT; input++) mean[input] /= frames.length;
  for (const frame of transformed) {
    for (let input = 0; input < INPUT_COUNT; input++) {
      variance[input] += (frame[input] - mean[input]) ** 2;
    }
  }
  const inverseDeviation = Float64Array.from(variance, (value) => {
    const deviation = Math.sqrt(value / transformed.length);
    return deviation > 1e-8 ? 1 / deviation : 1;
  });
  return { mean, inverseDeviation };
}

export function normalizeInputs(
  inputs: Float32Array,
  normalization: InputNormalization
): Float32Array {
  const transformed = comparisonBasis(inputs);
  return Float32Array.from(
    transformed,
    (value, input) => (value - normalization.mean[input]) * normalization.inverseDeviation[input]
  );
}

function foldRows(
  genome: Float32Array,
  folded: Float32Array,
  weights: number,
  biases: number,
  rows: number,
  normalization: InputNormalization
): void {
  for (let row = 0; row < rows; row++) {
    let bias = genome[biases + row];
    const inputStart = weights + row * INPUT_COUNT;
    folded.fill(0, inputStart, inputStart + INPUT_COUNT);
    for (let input = 0; input < INPUT_COUNT; input++) {
      const index = inputStart + input;
      const coefficient = genome[index] * normalization.inverseDeviation[input];
      folded[index] += coefficient;
      const base = DIFFERENCE_BASE.get(input);
      if (base !== undefined) folded[inputStart + base] -= coefficient;
      bias -= coefficient * normalization.mean[input];
    }
    folded[biases + row] = bias;
  }
}

export function foldInputNormalization(
  genome: Float32Array,
  normalization: InputNormalization
): Float32Array {
  const folded = Float32Array.from(genome);
  foldRows(genome, folded, RNN_LAYOUT.input, RNN_LAYOUT.hiddenBias, HIDDEN_COUNT, normalization);
  return folded;
}

function unfoldRows(
  genome: Float32Array,
  unfolded: Float32Array,
  weights: number,
  biases: number,
  rows: number,
  normalization: InputNormalization
): void {
  for (let row = 0; row < rows; row++) {
    const inputStart = weights + row * INPUT_COUNT;
    const coefficients = Float64Array.from(genome.subarray(inputStart, inputStart + INPUT_COUNT));
    for (const [difference, base] of DIFFERENCE_BASE) {
      coefficients[base] += coefficients[difference];
    }
    let bias = genome[biases + row];
    for (let input = 0; input < INPUT_COUNT; input++) {
      unfolded[inputStart + input] = coefficients[input] / normalization.inverseDeviation[input];
      bias += coefficients[input] * normalization.mean[input];
    }
    unfolded[biases + row] = bias;
  }
}

export function unfoldInputNormalization(
  genome: Float32Array,
  normalization: InputNormalization
): Float32Array {
  const unfolded = Float32Array.from(genome);
  unfoldRows(
    genome,
    unfolded,
    RNN_LAYOUT.input,
    RNN_LAYOUT.hiddenBias,
    HIDDEN_COUNT,
    normalization
  );
  return unfolded;
}

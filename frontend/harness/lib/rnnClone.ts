import { ACTION_THRESHOLD, INPUT_COUNT, OUTPUT_COUNT } from "../../src/sim/controller/contract";
import { GENOME_LENGTH, HIDDEN_COUNT, WEIGHT_COUNT } from "../../src/sim/controller/rnn";
import { randNormal, type Rng } from "../../src/sim/rng";
import { type SensorFrame } from "../experiments/colonyLoop";
import { type ActionClassBalance, BINARY_OUTPUTS, trainingBalance } from "./rnnCloneBalance";

export { actionClassBalance, type ActionClassBalance } from "./rnnCloneBalance";

const W_IN = 0;
const W_REC = W_IN + HIDDEN_COUNT * INPUT_COUNT;
const B_H = W_REC + HIDDEN_COUNT * HIDDEN_COUNT;
const W_OUT = B_H + HIDDEN_COUNT;
const B_OUT = W_OUT + OUTPUT_COUNT * HIDDEN_COUNT;
const OUTPUT_WEIGHTS = [1, 1, 2, 4, 5, 1, 1, 2] as const;

interface Chunk {
  hidden: Float64Array[];
  outputs: Float64Array[];
}

export interface CloneTrainingResult {
  vector: Float32Array;
  losses: number[];
  validationLoss: number;
  validationLosses: number[];
  bestEpoch: number;
  actionPositiveCounts: number[];
  actionPositiveWeights: number[];
}

export interface CloneTrainingOptions {
  readonly balanceActions?: boolean;
  readonly earlyStopping?: boolean;
  readonly parameterNoise?: number;
}

function selectTrainingResult(
  options: CloneTrainingOptions,
  vector: Float64Array,
  bestVector: Float64Array,
  validationLosses: number[],
  bestValidationLoss: number,
  bestEpoch: number
): { vector: Float64Array; validationLoss: number; epoch: number } {
  if (options.earlyStopping) {
    return { vector: bestVector, validationLoss: bestValidationLoss, epoch: bestEpoch };
  }
  return {
    vector,
    validationLoss: validationLosses.at(-1) as number,
    epoch: validationLosses.length - 1,
  };
}

function sampleTrainingVector(vector: Float64Array, rng: Rng, sigma: number): Float64Array {
  if (sigma === 0) return vector;
  const sampled = Float64Array.from(vector);
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    sampled[locus] += randNormal(rng) * sigma;
  }
  return sampled;
}

function parameterNoiseOf(options: CloneTrainingOptions): number {
  const sigma = options.parameterNoise ?? 0;
  if (!Number.isFinite(sigma) || sigma < 0) {
    throw new Error("parameter noise must be finite and non-negative");
  }
  return sigma;
}

/**
 * Give continuous actuators that were inactive in every teacher frame a
 * physical no-op margin. Zero-valued regression targets otherwise leave
 * small positive residuals that rectified actuators turn into real work.
 */
export function withInactiveOutputs(
  initial: Float32Array,
  outputs: readonly number[],
  margin: number
): Float32Array {
  const vector = Float32Array.from(initial);
  for (const output of outputs) {
    for (let hidden = 0; hidden < HIDDEN_COUNT; hidden++) {
      vector[W_OUT + output * HIDDEN_COUNT + hidden] = 0;
    }
    vector[B_OUT + output] = -Math.abs(margin);
  }
  return vector;
}

function initializedVector(rng: Rng): Float64Array {
  const vector = new Float64Array(GENOME_LENGTH);
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    vector[locus] = randNormal(rng) * 0.03;
  }
  return vector;
}

function forwardFrame(
  vector: Float64Array,
  inputs: Float32Array,
  previous: Float64Array
): { hidden: Float64Array; outputs: Float64Array } {
  const hidden = new Float64Array(HIDDEN_COUNT);
  for (let h = 0; h < HIDDEN_COUNT; h++) {
    let sum = vector[B_H + h];
    for (let i = 0; i < INPUT_COUNT; i++) {
      sum += vector[W_IN + h * INPUT_COUNT + i] * inputs[i];
    }
    for (let r = 0; r < HIDDEN_COUNT; r++) {
      sum += vector[W_REC + h * HIDDEN_COUNT + r] * previous[r];
    }
    hidden[h] = Math.tanh(sum);
  }
  const outputs = new Float64Array(OUTPUT_COUNT);
  for (let o = 0; o < OUTPUT_COUNT; o++) {
    let sum = vector[B_OUT + o];
    for (let h = 0; h < HIDDEN_COUNT; h++) {
      sum += vector[W_OUT + o * HIDDEN_COUNT + h] * hidden[h];
    }
    outputs[o] = Math.tanh(sum);
  }
  return { hidden, outputs };
}

function forwardChunk(
  vector: Float64Array,
  frames: SensorFrame[],
  start: number,
  end: number,
  initialHidden: Float64Array
): Chunk {
  const hidden: Float64Array[] = [Float64Array.from(initialHidden)];
  const outputs: Float64Array[] = [];
  for (let frame = start; frame < end; frame++) {
    const next = forwardFrame(vector, frames[frame].inputs, hidden.at(-1) as Float64Array);
    hidden.push(next.hidden);
    outputs.push(next.outputs);
  }
  return { hidden, outputs };
}

function sampleWeight(target: number, channel: number, balance: ActionClassBalance): number {
  const positiveAction = BINARY_OUTPUTS.includes(channel as (typeof BINARY_OUTPUTS)[number]);
  const classWeight =
    positiveAction && target > ACTION_THRESHOLD ? balance.actionPositiveWeights[channel] : 1;
  return OUTPUT_WEIGHTS[channel] * classWeight;
}

function outputGradient(
  predicted: number,
  target: number,
  channel: number,
  balance: ActionClassBalance
): number {
  return (
    (2 *
      sampleWeight(target, channel, balance) *
      (predicted - target) *
      (1 - predicted * predicted)) /
    OUTPUT_COUNT
  );
}

function backpropagateOutput(
  vector: Float64Array,
  target: Float32Array,
  predicted: Float64Array,
  hidden: Float64Array,
  gradient: Float64Array,
  hiddenGradient: Float64Array,
  balance: ActionClassBalance
): void {
  for (let output = 0; output < OUTPUT_COUNT; output++) {
    const delta = outputGradient(predicted[output], target[output], output, balance);
    gradient[B_OUT + output] += delta;
    for (let h = 0; h < HIDDEN_COUNT; h++) {
      gradient[W_OUT + output * HIDDEN_COUNT + h] += delta * hidden[h];
      hiddenGradient[h] += vector[W_OUT + output * HIDDEN_COUNT + h] * delta;
    }
  }
}

function backpropagateHidden(
  vector: Float64Array,
  inputs: Float32Array,
  hidden: Float64Array,
  previous: Float64Array,
  hiddenGradient: Float64Array,
  gradient: Float64Array
): Float64Array {
  const nextCarry = new Float64Array(HIDDEN_COUNT);
  for (let h = 0; h < HIDDEN_COUNT; h++) {
    const delta = hiddenGradient[h] * (1 - hidden[h] * hidden[h]);
    gradient[B_H + h] += delta;
    for (let input = 0; input < INPUT_COUNT; input++) {
      gradient[W_IN + h * INPUT_COUNT + input] += delta * inputs[input];
    }
    for (let recurrent = 0; recurrent < HIDDEN_COUNT; recurrent++) {
      gradient[W_REC + h * HIDDEN_COUNT + recurrent] += delta * previous[recurrent];
      nextCarry[recurrent] += vector[W_REC + h * HIDDEN_COUNT + recurrent] * delta;
    }
  }
  return nextCarry;
}

function backpropagate(
  vector: Float64Array,
  frames: SensorFrame[],
  start: number,
  chunk: Chunk,
  balance: ActionClassBalance
): Float64Array {
  const gradient = new Float64Array(WEIGHT_COUNT);
  let hiddenCarry: Float64Array = new Float64Array(HIDDEN_COUNT);
  for (let local = chunk.outputs.length - 1; local >= 0; local--) {
    const frame = frames[start + local];
    const hidden = chunk.hidden[local + 1];
    const previous = chunk.hidden[local];
    const hiddenGradient = Float64Array.from(hiddenCarry);
    backpropagateOutput(
      vector,
      frame.outputs,
      chunk.outputs[local],
      hidden,
      gradient,
      hiddenGradient,
      balance
    );
    hiddenCarry = backpropagateHidden(
      vector,
      frame.inputs,
      hidden,
      previous,
      hiddenGradient,
      gradient
    );
  }
  return gradient;
}

function clip(gradient: Float64Array, maximum: number): void {
  let squared = 0;
  for (const value of gradient) squared += value * value;
  const norm = Math.sqrt(squared);
  if (norm <= maximum) return;
  const scale = maximum / norm;
  for (let i = 0; i < gradient.length; i++) gradient[i] *= scale;
}

function updateAdam(
  vector: Float64Array,
  gradient: Float64Array,
  first: Float64Array,
  second: Float64Array,
  step: number,
  rate: number
): void {
  const beta1 = 0.9;
  const beta2 = 0.999;
  const correction1 = 1 - Math.pow(beta1, step);
  const correction2 = 1 - Math.pow(beta2, step);
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    first[locus] = beta1 * first[locus] + (1 - beta1) * gradient[locus];
    second[locus] = beta2 * second[locus] + (1 - beta2) * gradient[locus] * gradient[locus];
    const mean = first[locus] / correction1;
    const variance = second[locus] / correction2;
    vector[locus] -= (rate * mean) / (Math.sqrt(variance) + 1e-8);
  }
}

function sequenceLoss(
  vector: Float64Array,
  frames: SensorFrame[],
  balance: ActionClassBalance
): number {
  let hidden: Float64Array = new Float64Array(HIDDEN_COUNT);
  let loss = 0;
  for (const frame of frames) {
    const result = forwardFrame(vector, frame.inputs, hidden);
    hidden = result.hidden;
    for (let channel = 0; channel < OUTPUT_COUNT; channel++) {
      const error = result.outputs[channel] - frame.outputs[channel];
      loss += sampleWeight(frame.outputs[channel], channel, balance) * error * error;
    }
  }
  return loss / Math.max(1, frames.length * OUTPUT_COUNT);
}

interface AdamState {
  first: Float64Array;
  second: Float64Array;
  step: number;
}

function trainSequence(
  vector: Float64Array,
  frames: SensorFrame[],
  chunkLength: number,
  optimizer: AdamState,
  rate: number,
  balance: ActionClassBalance,
  rng: Rng,
  parameterNoise: number
): void {
  let carried: Float64Array = new Float64Array(HIDDEN_COUNT);
  for (let start = 0; start < frames.length; start += chunkLength) {
    const end = Math.min(frames.length, start + chunkLength);
    const sampled = sampleTrainingVector(vector, rng, parameterNoise);
    const chunk = forwardChunk(sampled, frames, start, end, carried);
    const gradient = backpropagate(sampled, frames, start, chunk, balance);
    for (let locus = 0; locus < gradient.length; locus++) {
      gradient[locus] /= end - start;
    }
    clip(gradient, 5);
    optimizer.step += 1;
    updateAdam(vector, gradient, optimizer.first, optimizer.second, optimizer.step, rate);
    carried = chunk.hidden.at(-1) as Float64Array;
  }
}

export function trainBehaviorClone(
  training: SensorFrame[][],
  validation: SensorFrame[][],
  rng: Rng,
  epochs: number,
  rate: number,
  chunkLength: number,
  initial: Float32Array | null = null,
  options: CloneTrainingOptions = {}
): CloneTrainingResult {
  const vector = initial === null ? initializedVector(rng) : Float64Array.from(initial);
  const balance = trainingBalance(training, options.balanceActions ?? false);
  const parameterNoise = parameterNoiseOf(options);
  const optimizer: AdamState = {
    first: new Float64Array(WEIGHT_COUNT),
    second: new Float64Array(WEIGHT_COUNT),
    step: 0,
  };
  const losses: number[] = [];
  const validationLosses: number[] = [];
  let bestVector = Float64Array.from(vector);
  let validationLoss = Number.POSITIVE_INFINITY;
  let bestEpoch = -1;
  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const frames of training) {
      trainSequence(vector, frames, chunkLength, optimizer, rate, balance, rng, parameterNoise);
    }
    const loss = training.reduce((sum, frames) => sum + sequenceLoss(vector, frames, balance), 0);
    losses.push(loss / training.length);
    const candidateValidationLoss =
      validation.reduce((sum, frames) => sum + sequenceLoss(vector, frames, balance), 0) /
      validation.length;
    validationLosses.push(candidateValidationLoss);
    if (candidateValidationLoss < validationLoss) {
      validationLoss = candidateValidationLoss;
      bestEpoch = epoch;
      bestVector = Float64Array.from(vector);
    }
  }
  const selected = selectTrainingResult(
    options,
    vector,
    bestVector,
    validationLosses,
    validationLoss,
    bestEpoch
  );
  return {
    vector: Float32Array.from(selected.vector),
    losses,
    validationLoss: selected.validationLoss,
    validationLosses,
    bestEpoch: selected.epoch,
    ...balance,
  };
}

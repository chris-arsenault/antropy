import {
  ACTION_THRESHOLD,
  INPUT_COUNT,
  Output,
  OUTPUT_COUNT,
} from "../../src/sim/controller/contract";
import { GENOME_LENGTH, HIDDEN_COUNT, WEIGHT_COUNT } from "../../src/sim/controller/rnn";
import { randNormal, type Rng } from "../../src/sim/rng";
import { type SensorFrame } from "../experiments/colonyLoop";
import { actionClassBalance } from "./rnnCloneBalance";
import { type CloneTrainingResult } from "./rnnClone";

const W_IN = 0;
const W_REC = W_IN + HIDDEN_COUNT * INPUT_COUNT;
const B_H = W_REC + HIDDEN_COUNT * HIDDEN_COUNT;
const W_OUT = B_H + HIDDEN_COUNT;
const B_OUT = W_OUT + OUTPUT_COUNT * HIDDEN_COUNT;
const OUTPUT_WEIGHTS = [1, 1, 2, 4, 5, 1, 1, 2] as const;
const ZERO_EPSILON = 0.000001;

export const FRAME_DISTILLATION_SETTINGS = {
  epochs: 512,
  rate: 0.002,
  batchSize: 64,
} as const;

export interface FrameDistillationSettings {
  readonly epochs: number;
  readonly rate: number;
  readonly batchSize: number;
}

export interface FrameDistillationResult extends CloneTrainingResult {
  readonly frameClassCounts: Readonly<Record<string, number>>;
  readonly samplesPerEpoch: number;
  readonly recurrentWeightNorm: number;
}

interface FrameCorpus {
  readonly classes: ReadonlyMap<string, readonly SensorFrame[]>;
  readonly classCounts: Readonly<Record<string, number>>;
  readonly frameCount: number;
}

interface ForwardResult {
  readonly hidden: Float64Array;
  readonly outputs: Float64Array;
}

interface AdamState {
  readonly first: Float64Array;
  readonly second: Float64Array;
  step: number;
}

function signedClass(value: number): string {
  if (value > ZERO_EPSILON) return "p";
  if (value < -ZERO_EPSILON) return "n";
  return "z";
}

function magnitudeClass(value: number): string {
  if (value <= ZERO_EPSILON) return "z";
  return value > ACTION_THRESHOLD ? "h" : "l";
}

/** Output-defined behavior regime, independent of world position or oracle internals. */
export function frameClass(frame: SensorFrame): string {
  const outputs = frame.outputs;
  return [
    signedClass(outputs[Output.TURN]),
    magnitudeClass(outputs[Output.FORWARD]),
    signedClass(outputs[Output.VERTICAL_BIAS]),
    outputs[Output.EAT] > ACTION_THRESHOLD ? "e" : "-",
    outputs[Output.DIG] > ACTION_THRESHOLD ? "d" : "-",
    magnitudeClass(outputs[Output.PHEROMONE_A]),
    magnitudeClass(outputs[Output.PHEROMONE_B]),
    outputs[Output.LAY_EGG] > ACTION_THRESHOLD ? "g" : "-",
  ].join("");
}

function corpusOf(sequences: readonly SensorFrame[][]): FrameCorpus {
  const classes = new Map<string, SensorFrame[]>();
  let frameCount = 0;
  for (const sequence of sequences) {
    for (const frame of sequence) {
      const key = frameClass(frame);
      const frames = classes.get(key) ?? [];
      frames.push(frame);
      classes.set(key, frames);
      frameCount += 1;
    }
  }
  const classCounts = Object.fromEntries(
    [...classes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, frames]) => [key, frames.length])
  );
  return { classes, classCounts, frameCount };
}

function shuffle<T>(values: T[], rng: Rng): void {
  for (let index = values.length - 1; index > 0; index--) {
    const swap = Math.floor(rng.next() * (index + 1));
    [values[index], values[swap]] = [values[swap], values[index]];
  }
}

function balancedEpoch(corpus: FrameCorpus, rng: Rng): SensorFrame[] {
  const classKeys = [...corpus.classes.keys()].sort();
  const samplesPerClass = Math.ceil(corpus.frameCount / classKeys.length);
  const frames: SensorFrame[] = [];
  for (const key of classKeys) {
    const candidates = [...(corpus.classes.get(key) as readonly SensorFrame[])];
    shuffle(candidates, rng);
    for (let sample = 0; sample < samplesPerClass; sample++) {
      frames.push(candidates[sample % candidates.length]);
    }
  }
  shuffle(frames, rng);
  return frames;
}

/** One deterministic, equal-regime epoch for bounded trainer tests and diagnostics. */
export function balancedFramesForEpoch(
  sequences: readonly SensorFrame[][],
  rng: Rng
): { readonly frames: SensorFrame[]; readonly classCounts: Readonly<Record<string, number>> } {
  const corpus = corpusOf(sequences);
  if (corpus.frameCount === 0) throw new Error("frame corpus must not be empty");
  return { frames: balancedEpoch(corpus, rng), classCounts: corpus.classCounts };
}

function initializedVector(rng: Rng): Float64Array {
  const vector = new Float64Array(GENOME_LENGTH);
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    if (locus < W_REC || locus >= B_H) vector[locus] = randNormal(rng) * 0.03;
  }
  return vector;
}

function forwardFrame(vector: Float64Array, inputs: Float32Array): ForwardResult {
  const hidden = new Float64Array(HIDDEN_COUNT);
  for (let h = 0; h < HIDDEN_COUNT; h++) {
    let sum = vector[B_H + h];
    for (let input = 0; input < INPUT_COUNT; input++) {
      sum += vector[W_IN + h * INPUT_COUNT + input] * inputs[input];
    }
    hidden[h] = Math.tanh(sum);
  }
  const outputs = new Float64Array(OUTPUT_COUNT);
  for (let output = 0; output < OUTPUT_COUNT; output++) {
    let sum = vector[B_OUT + output];
    for (let h = 0; h < HIDDEN_COUNT; h++) {
      sum += vector[W_OUT + output * HIDDEN_COUNT + h] * hidden[h];
    }
    outputs[output] = Math.tanh(sum);
  }
  return { hidden, outputs };
}

function outputDelta(predicted: number, target: number, output: number): number {
  return (
    (2 * OUTPUT_WEIGHTS[output] * (predicted - target) * (1 - predicted * predicted)) / OUTPUT_COUNT
  );
}

function accumulateGradient(
  vector: Float64Array,
  frame: SensorFrame,
  gradient: Float64Array
): void {
  const result = forwardFrame(vector, frame.inputs);
  const hiddenGradient = new Float64Array(HIDDEN_COUNT);
  for (let output = 0; output < OUTPUT_COUNT; output++) {
    const delta = outputDelta(result.outputs[output], frame.outputs[output], output);
    gradient[B_OUT + output] += delta;
    for (let h = 0; h < HIDDEN_COUNT; h++) {
      gradient[W_OUT + output * HIDDEN_COUNT + h] += delta * result.hidden[h];
      hiddenGradient[h] += vector[W_OUT + output * HIDDEN_COUNT + h] * delta;
    }
  }
  for (let h = 0; h < HIDDEN_COUNT; h++) {
    const delta = hiddenGradient[h] * (1 - result.hidden[h] * result.hidden[h]);
    gradient[B_H + h] += delta;
    for (let input = 0; input < INPUT_COUNT; input++) {
      gradient[W_IN + h * INPUT_COUNT + input] += delta * frame.inputs[input];
    }
  }
}

function clip(gradient: Float64Array, maximum: number): void {
  let squared = 0;
  for (const value of gradient) squared += value * value;
  const norm = Math.sqrt(squared);
  if (norm <= maximum) return;
  const scale = maximum / norm;
  for (let locus = 0; locus < gradient.length; locus++) gradient[locus] *= scale;
}

function updateAdam(
  vector: Float64Array,
  gradient: Float64Array,
  optimizer: AdamState,
  rate: number
): void {
  const beta1 = 0.9;
  const beta2 = 0.999;
  const correction1 = 1 - Math.pow(beta1, optimizer.step);
  const correction2 = 1 - Math.pow(beta2, optimizer.step);
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    if (locus >= W_REC && locus < B_H) continue;
    optimizer.first[locus] = beta1 * optimizer.first[locus] + (1 - beta1) * gradient[locus];
    optimizer.second[locus] =
      beta2 * optimizer.second[locus] + (1 - beta2) * gradient[locus] * gradient[locus];
    const mean = optimizer.first[locus] / correction1;
    const variance = optimizer.second[locus] / correction2;
    vector[locus] -= (rate * mean) / (Math.sqrt(variance) + 1e-8);
  }
}

function trainBatch(
  vector: Float64Array,
  frames: readonly SensorFrame[],
  optimizer: AdamState,
  rate: number
): void {
  const gradient = new Float64Array(WEIGHT_COUNT);
  for (const frame of frames) accumulateGradient(vector, frame, gradient);
  for (let locus = 0; locus < gradient.length; locus++) gradient[locus] /= frames.length;
  clip(gradient, 5);
  optimizer.step += 1;
  updateAdam(vector, gradient, optimizer, rate);
}

function frameLoss(vector: Float64Array, frame: SensorFrame): number {
  const predicted = forwardFrame(vector, frame.inputs).outputs;
  let loss = 0;
  for (let output = 0; output < OUTPUT_COUNT; output++) {
    const error = predicted[output] - frame.outputs[output];
    loss += OUTPUT_WEIGHTS[output] * error * error;
  }
  return loss / OUTPUT_COUNT;
}

function balancedLoss(vector: Float64Array, corpus: FrameCorpus): number {
  let total = 0;
  for (const frames of corpus.classes.values()) {
    total += frames.reduce((sum, frame) => sum + frameLoss(vector, frame), 0) / frames.length;
  }
  return total / corpus.classes.size;
}

function validateSettings(settings: FrameDistillationSettings): void {
  if (!Number.isInteger(settings.epochs) || settings.epochs < 1) {
    throw new Error("epochs must be a positive integer");
  }
  if (!Number.isInteger(settings.batchSize) || settings.batchSize < 1) {
    throw new Error("batch size must be a positive integer");
  }
  if (!Number.isFinite(settings.rate) || settings.rate <= 0) {
    throw new Error("rate must be finite and positive");
  }
}

function recurrentWeightNorm(vector: Float64Array): number {
  let squared = 0;
  for (let locus = W_REC; locus < B_H; locus++) squared += vector[locus] * vector[locus];
  return Math.sqrt(squared);
}

/** Distill a zero-state oracle into the feed-forward slice of the evolvable RNN genome. */
export function trainFrameDistillation(
  training: readonly SensorFrame[][],
  validation: readonly SensorFrame[][],
  rng: Rng,
  settings: FrameDistillationSettings = FRAME_DISTILLATION_SETTINGS
): FrameDistillationResult {
  validateSettings(settings);
  const trainingCorpus = corpusOf(training);
  const validationCorpus = corpusOf(validation);
  if (trainingCorpus.frameCount === 0 || validationCorpus.frameCount === 0) {
    throw new Error("training and validation corpora must not be empty");
  }
  const vector = initializedVector(rng);
  const optimizer: AdamState = {
    first: new Float64Array(WEIGHT_COUNT),
    second: new Float64Array(WEIGHT_COUNT),
    step: 0,
  };
  const losses: number[] = [];
  const validationLosses: number[] = [];
  let bestVector = Float64Array.from(vector);
  let bestValidationLoss = Number.POSITIVE_INFINITY;
  let bestEpoch = -1;
  let samplesPerEpoch = 0;
  for (let epoch = 0; epoch < settings.epochs; epoch++) {
    const frames = balancedEpoch(trainingCorpus, rng);
    samplesPerEpoch = frames.length;
    for (let start = 0; start < frames.length; start += settings.batchSize) {
      trainBatch(vector, frames.slice(start, start + settings.batchSize), optimizer, settings.rate);
    }
    losses.push(balancedLoss(vector, trainingCorpus));
    const validationLoss = balancedLoss(vector, validationCorpus);
    validationLosses.push(validationLoss);
    if (validationLoss < bestValidationLoss) {
      bestValidationLoss = validationLoss;
      bestEpoch = epoch;
      bestVector = Float64Array.from(vector);
    }
  }
  const balance = actionClassBalance(training);
  return {
    vector: Float32Array.from(bestVector),
    losses,
    validationLoss: bestValidationLoss,
    validationLosses,
    bestEpoch,
    actionPositiveCounts: balance.actionPositiveCounts,
    actionPositiveWeights: new Array<number>(OUTPUT_COUNT).fill(1),
    frameClassCounts: trainingCorpus.classCounts,
    samplesPerEpoch,
    recurrentWeightNorm: recurrentWeightNorm(bestVector),
  };
}

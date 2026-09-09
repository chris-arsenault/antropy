import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INPUT_COUNT } from "../../src/sim/controller/contract";
import {
  DECISION_COUNT,
  HIDDEN_COUNT,
  RNN_GENOME_LENGTH,
  RNN_LAYOUT,
  RNN_OUTPUT_COUNT,
  RnnOutput,
} from "../../src/sim/controller/rnn";
import { FORAGER_RNN_WEIGHTS } from "../../src/sim/controller/rnnSeed";
import { createRandomState, nextRandom } from "../../src/sim/random";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import {
  foldInputNormalization,
  inputNormalization,
  type InputNormalization,
  normalizeInputs,
  unfoldInputNormalization,
} from "../lib/rnnNormalization";
import { trainRecurrentSequences, type SequenceFrame } from "../lib/rnnSequenceTraining";
import {
  collectBalancedFrames,
  collectHeadingCoverage,
  collectSequences,
  rebalance,
} from "../lib/rnnTrainingData";
import { initializeTrainingGenome, trainingForward } from "../lib/rnnTrainingMath";

type Sample = SequenceFrame;

interface TrainingState {
  readonly genome: Float32Array;
  readonly firstMoment: Float64Array;
  readonly secondMoment: Float64Array;
  step: number;
}

const BATCH_SIZE = 64;
const LEARNING_RATE = 0.003;
const MOTOR_COUNT = RnnOutput.MANDIBLE + 1;

function normalizeSamples(samples: readonly Sample[], normalization: InputNormalization): Sample[] {
  return samples.map((sample) => ({
    ...sample,
    inputs: normalizeInputs(sample.inputs, normalization),
  }));
}

function normalizeSequences(
  sequences: readonly Sample[][],
  normalization: InputNormalization
): Sample[][] {
  return sequences.map((sequence) => normalizeSamples(sequence, normalization));
}

function initialize(initialGenome?: Float32Array): TrainingState {
  if (initialGenome?.length === RNN_GENOME_LENGTH) {
    return {
      genome: Float32Array.from(initialGenome),
      firstMoment: new Float64Array(RNN_GENOME_LENGTH),
      secondMoment: new Float64Array(RNN_GENOME_LENGTH),
      step: 0,
    };
  }
  const genome = initializeTrainingGenome();
  return {
    genome,
    firstMoment: new Float64Array(RNN_GENOME_LENGTH),
    secondMoment: new Float64Array(RNN_GENOME_LENGTH),
    step: 0,
  };
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function motorProbabilities(logits: Float64Array): Float64Array {
  const result = new Float64Array(MOTOR_COUNT);
  let maximum = Number.NEGATIVE_INFINITY;
  for (let motor = 0; motor < MOTOR_COUNT; motor++) maximum = Math.max(maximum, logits[motor]);
  let total = 0;
  for (let motor = 0; motor < MOTOR_COUNT; motor++) {
    result[motor] = Math.exp(logits[motor] - maximum);
    total += result[motor];
  }
  for (let motor = 0; motor < MOTOR_COUNT; motor++) result[motor] /= total;
  return result;
}

function binaryLoss(logit: number, target: number): number {
  return Math.max(logit, 0) - logit * target + Math.log1p(Math.exp(-Math.abs(logit)));
}

function outputGradients(
  logits: Float64Array,
  targets: Float32Array
): { gradients: Float64Array; loss: number } {
  const gradients = new Float64Array(RNN_OUTPUT_COUNT);
  const probabilities = motorProbabilities(logits);
  let loss = 0;
  for (let output = 0; output < MOTOR_COUNT; output++) {
    gradients[output] = probabilities[output] - targets[output];
    if (targets[output] > 0) loss -= Math.log(Math.max(probabilities[output], 1e-12));
  }
  for (let output = MOTOR_COUNT; output < RNN_OUTPUT_COUNT; output++) {
    gradients[output] = sigmoid(logits[output]) - targets[output];
    loss += binaryLoss(logits[output], targets[output]);
  }
  return { gradients, loss: loss / 3 };
}

function accumulateOutputWeights(
  decision: Float64Array,
  outputGradient: Float64Array,
  gradient: Float64Array
): void {
  for (let output = 0; output < RNN_OUTPUT_COUNT; output++) {
    gradient[RNN_LAYOUT.outputBias + output] += outputGradient[output];
    for (let unit = 0; unit < DECISION_COUNT; unit++) {
      gradient[RNN_LAYOUT.output + output * DECISION_COUNT + unit] +=
        outputGradient[output] * decision[unit];
    }
  }
}

function accumulateDecisionWeights(
  state: TrainingState,
  hidden: Float64Array,
  decision: Float64Array,
  outputGradient: Float64Array,
  gradient: Float64Array
): Float64Array {
  const decisionGradient = new Float64Array(DECISION_COUNT);
  for (let unit = 0; unit < DECISION_COUNT; unit++) {
    let propagated = 0;
    for (let output = 0; output < RNN_OUTPUT_COUNT; output++) {
      propagated +=
        outputGradient[output] * state.genome[RNN_LAYOUT.output + output * DECISION_COUNT + unit];
    }
    decisionGradient[unit] = propagated * (1 - decision[unit] * decision[unit]);
    gradient[RNN_LAYOUT.decisionBias + unit] += decisionGradient[unit];
    for (let hiddenUnit = 0; hiddenUnit < HIDDEN_COUNT; hiddenUnit++) {
      gradient[RNN_LAYOUT.decision + unit * HIDDEN_COUNT + hiddenUnit] +=
        decisionGradient[unit] * hidden[hiddenUnit];
    }
  }
  return decisionGradient;
}

function accumulateHiddenWeights(
  state: TrainingState,
  sample: Sample,
  hidden: Float64Array,
  decisionGradient: Float64Array,
  gradient: Float64Array
): void {
  for (let unit = 0; unit < HIDDEN_COUNT; unit++) {
    let propagated = 0;
    for (let decision = 0; decision < DECISION_COUNT; decision++) {
      propagated +=
        decisionGradient[decision] *
        state.genome[RNN_LAYOUT.decision + decision * HIDDEN_COUNT + unit];
    }
    const hiddenGradient = propagated * (1 - hidden[unit] * hidden[unit]);
    gradient[RNN_LAYOUT.hiddenBias + unit] += hiddenGradient;
    for (let input = 0; input < INPUT_COUNT; input++) {
      gradient[RNN_LAYOUT.input + unit * INPUT_COUNT + input] +=
        hiddenGradient * sample.inputs[input];
    }
  }
}

function accumulateGradient(state: TrainingState, sample: Sample, gradient: Float64Array): number {
  const [hidden, decision, logits] = trainingForward(state.genome, sample.inputs);
  const output = outputGradients(logits, sample.targets);
  accumulateOutputWeights(decision, output.gradients, gradient);
  const decisionGradient = accumulateDecisionWeights(
    state,
    hidden,
    decision,
    output.gradients,
    gradient
  );
  accumulateHiddenWeights(state, sample, hidden, decisionGradient, gradient);
  return output.loss;
}

function strongestMotor(logits: Float64Array): number {
  let strongest = 0;
  for (let motor = 1; motor < MOTOR_COUNT; motor++) {
    if (logits[motor] > logits[strongest]) strongest = motor;
  }
  return strongest;
}

function reportAccuracy(samples: readonly Sample[], state: TrainingState): void {
  const categories = new Map<string, { correct: number; total: number }>();
  let correct = 0;
  for (const sample of samples) {
    const [, , logits] = trainingForward(state.genome, sample.inputs);
    const matched = sample.targets[strongestMotor(logits)] > 0;
    if (matched) correct += 1;
    const result = categories.get(sample.category) ?? { correct: 0, total: 0 };
    result.total += 1;
    if (matched) result.correct += 1;
    categories.set(sample.category, result);
  }
  const byCategory = Object.fromEntries(
    [...categories].map(([name, result]) => [name, result.correct / result.total])
  );
  console.log(
    `motor accuracy ${(correct / samples.length).toFixed(6)} ${JSON.stringify(byCategory)}`
  );
}

function update(state: TrainingState, gradient: Float64Array, batchSize: number): void {
  state.step += 1;
  const correction1 = 1 - 0.9 ** state.step;
  const correction2 = 1 - 0.999 ** state.step;
  for (let index = 0; index < state.genome.length; index++) {
    const value = gradient[index] / batchSize;
    state.firstMoment[index] = 0.9 * state.firstMoment[index] + 0.1 * value;
    state.secondMoment[index] = 0.999 * state.secondMoment[index] + 0.001 * value * value;
    const first = state.firstMoment[index] / correction1;
    const second = state.secondMoment[index] / correction2;
    state.genome[index] -= (LEARNING_RATE * first) / (Math.sqrt(second) + 1e-8);
  }
}

function shuffle(samples: Sample[], epoch: number): void {
  const random = createRandomState(epoch + 1);
  for (let index = samples.length - 1; index > 0; index--) {
    const other = Math.floor(nextRandom(random) * (index + 1));
    [samples[index], samples[other]] = [samples[other], samples[index]];
  }
}

function train(samples: Sample[], epochs: number, initialGenome?: Float32Array): TrainingState {
  const state = initialize(initialGenome);
  for (let epoch = 0; epoch < epochs; epoch++) {
    shuffle(samples, epoch);
    let loss = 0;
    for (let start = 0; start < samples.length; start += BATCH_SIZE) {
      const gradient = new Float64Array(RNN_GENOME_LENGTH);
      const end = Math.min(samples.length, start + BATCH_SIZE);
      for (let index = start; index < end; index++) {
        loss += accumulateGradient(state, samples[index], gradient);
      }
      update(state, gradient, end - start);
    }
    if ((epoch + 1) % 25 === 0)
      console.log(`epoch ${epoch + 1}: loss ${(loss / samples.length).toFixed(6)}`);
  }
  return state;
}

function writeSeed(genome: Float32Array): void {
  const directory = path.dirname(fileURLToPath(import.meta.url));
  const output = path.join(directory, "../../src/sim/controller/rnnSeed.ts");
  const values = [...genome].map((value) => Number(value.toFixed(8)));
  writeFileSync(
    output,
    `/** Generated by \`pnpm harness train-rnn\`; do not hand-edit. */\nexport const FORAGER_RNN_WEIGHTS: readonly number[] = ${JSON.stringify(values)};\n`
  );
}

export function runTrainRnn(flags: Flags): void {
  const seeds = seedsFlag(flags, "1,2,3,4,5,6,7,8");
  const ticks = integerFlag(flags, "ticks", 5_000);
  const cap = integerFlag(flags, "cap", 12_000);
  const daggerIterations = integerFlag(flags, "dagger", 0);
  const daggerEpochs = integerFlag(flags, "dagger-epochs", 100);
  const daggerCap = integerFlag(flags, "dagger-cap", 200);
  const sequenceEpochs = integerFlag(flags, "sequence-epochs", 0);
  const sequenceLength = integerFlag(flags, "sequence-length", 32);
  const sequenceDagger = integerFlag(flags, "sequence-dagger", 0);
  const sequenceDaggerEpochs = integerFlag(flags, "sequence-dagger-epochs", 10);
  let rawSamples = collectBalancedFrames(seeds, ticks, cap, "programmed");
  const headingCoverage = collectHeadingCoverage(
    seeds,
    ticks,
    integerFlag(flags, "heading-cadence", 4),
    cap
  );
  rawSamples = rebalance([...rawSamples, ...headingCoverage]);
  const normalization = inputNormalization(rawSamples.map((sample) => sample.inputs));
  let samples = normalizeSamples(rawSamples, normalization);
  console.log(
    `training on ${samples.length} balanced frames from ${seeds.length} worlds ` +
      `(${headingCoverage.length} physical heading/load variants)`
  );
  const resume = flag(flags, "resume", "false") === "true";
  const initial = resume
    ? unfoldInputNormalization(Float32Array.from(FORAGER_RNN_WEIGHTS), normalization)
    : undefined;
  let state = train(samples, integerFlag(flags, "epochs", 250), initial);
  reportAccuracy(samples, state);
  for (let iteration = 1; iteration <= daggerIterations; iteration++) {
    const rolloutGenome = foldInputNormalization(state.genome, normalization);
    const offPolicy = collectBalancedFrames(seeds, ticks, daggerCap, "rnn", rolloutGenome);
    rawSamples = rebalance([...rawSamples, ...offPolicy]);
    samples = normalizeSamples(rawSamples, normalization);
    console.log(
      `DAgger ${iteration}: added ${offPolicy.length} frames; aggregate ${samples.length}`
    );
    state = train(samples, daggerEpochs, state.genome);
    reportAccuracy(samples, state);
  }
  const teacherSequences = normalizeSequences(collectSequences(seeds, ticks), normalization);
  if (sequenceEpochs > 0) {
    const frameCount = teacherSequences.reduce((total, sequence) => total + sequence.length, 0);
    console.log(
      `sequence training on ${frameCount} ordered frames from ${teacherSequences.length} worlds`
    );
    state = initialize(
      trainRecurrentSequences(state.genome, teacherSequences, sequenceEpochs, sequenceLength)
    );
  }
  for (let iteration = 1; iteration <= sequenceDagger; iteration++) {
    const rolloutGenome = foldInputNormalization(state.genome, normalization);
    const onPolicy = normalizeSequences(
      collectSequences(seeds, ticks, "rnn", rolloutGenome),
      normalization
    );
    const frameCount = onPolicy.reduce((total, sequence) => total + sequence.length, 0);
    console.log(`sequence DAgger ${iteration}: added ${frameCount} on-policy frames`);
    state = initialize(
      trainRecurrentSequences(
        state.genome,
        [...teacherSequences, ...onPolicy],
        sequenceDaggerEpochs,
        sequenceLength
      )
    );
  }
  writeSeed(foldInputNormalization(state.genome, normalization));
  console.log(`wrote ${state.genome.length} RNN loci`);
}

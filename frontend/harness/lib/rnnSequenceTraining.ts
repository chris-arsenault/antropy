import { INPUT_COUNT } from "../../src/sim/controller/contract";
import {
  DECISION_COUNT,
  HIDDEN_COUNT,
  RNN_GENOME_LENGTH,
  RNN_LAYOUT,
  RNN_OUTPUT_COUNT,
  RnnOutput,
} from "../../src/sim/controller/rnn";

export interface SequenceFrame {
  readonly inputs: Float32Array;
  readonly targets: Float32Array;
  readonly category: string;
}

interface Trace extends SequenceFrame {
  readonly previous: Float64Array;
  readonly hidden: Float64Array;
  readonly decision: Float64Array;
  readonly outputGradient: Float64Array;
  readonly loss: number;
  readonly weight: number;
}

interface Optimizer {
  readonly first: Float64Array;
  readonly second: Float64Array;
  step: number;
}

const MOTOR_COUNT = RnnOutput.MANDIBLE + 1;
const LEARNING_RATE = 0.000_3;

function hiddenStep(
  genome: Float32Array,
  inputs: Float32Array,
  previous: Float64Array
): Float64Array {
  const hidden = new Float64Array(HIDDEN_COUNT);
  for (let unit = 0; unit < HIDDEN_COUNT; unit++) {
    let sum = genome[RNN_LAYOUT.hiddenBias + unit];
    for (let input = 0; input < INPUT_COUNT; input++) {
      sum += genome[RNN_LAYOUT.input + unit * INPUT_COUNT + input] * inputs[input];
    }
    for (let prior = 0; prior < HIDDEN_COUNT; prior++) {
      sum += genome[RNN_LAYOUT.recurrent + unit * HIDDEN_COUNT + prior] * previous[prior];
    }
    hidden[unit] = Math.tanh(sum);
  }
  return hidden;
}

function decisionStep(genome: Float32Array, hidden: Float64Array): Float64Array {
  const decision = new Float64Array(DECISION_COUNT);
  for (let unit = 0; unit < DECISION_COUNT; unit++) {
    let sum = genome[RNN_LAYOUT.decisionBias + unit];
    for (let hiddenUnit = 0; hiddenUnit < HIDDEN_COUNT; hiddenUnit++) {
      sum += genome[RNN_LAYOUT.decision + unit * HIDDEN_COUNT + hiddenUnit] * hidden[hiddenUnit];
    }
    decision[unit] = Math.tanh(sum);
  }
  return decision;
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

function motorProbabilities(logits: Float64Array): Float64Array {
  const probabilities = new Float64Array(MOTOR_COUNT);
  let maximum = Number.NEGATIVE_INFINITY;
  for (let motor = 0; motor < MOTOR_COUNT; motor++) maximum = Math.max(maximum, logits[motor]);
  let total = 0;
  for (let motor = 0; motor < MOTOR_COUNT; motor++) {
    probabilities[motor] = Math.exp(logits[motor] - maximum);
    total += probabilities[motor];
  }
  for (let motor = 0; motor < MOTOR_COUNT; motor++) probabilities[motor] /= total;
  return probabilities;
}

function outputLoss(logits: Float64Array, targets: Float32Array): [Float64Array, number] {
  const gradient = new Float64Array(RNN_OUTPUT_COUNT);
  const probabilities = motorProbabilities(logits);
  let loss = 0;
  for (let output = 0; output < MOTOR_COUNT; output++) {
    gradient[output] = probabilities[output] - targets[output];
    if (targets[output] > 0) loss -= Math.log(Math.max(probabilities[output], 1e-12));
  }
  for (let output = MOTOR_COUNT; output < RNN_OUTPUT_COUNT; output++) {
    const probability = 1 / (1 + Math.exp(-logits[output]));
    gradient[output] = probability - targets[output];
    loss +=
      Math.max(logits[output], 0) -
      logits[output] * targets[output] +
      Math.log1p(Math.exp(-Math.abs(logits[output])));
  }
  return [gradient, loss / 3];
}

function traceFrame(
  genome: Float32Array,
  frame: SequenceFrame,
  previous: Float64Array,
  weight: number
): Trace {
  const hidden = hiddenStep(genome, frame.inputs, previous);
  const decision = decisionStep(genome, hidden);
  const [outputGradient, loss] = outputLoss(outputLogits(genome, decision), frame.targets);
  return { ...frame, previous, hidden, decision, outputGradient, loss, weight };
}

function outputBackprop(genome: Float32Array, trace: Trace, gradient: Float64Array): Float64Array {
  const decisionGradient = new Float64Array(DECISION_COUNT);
  for (let output = 0; output < RNN_OUTPUT_COUNT; output++) {
    const value = trace.outputGradient[output] * trace.weight;
    gradient[RNN_LAYOUT.outputBias + output] += value;
    for (let unit = 0; unit < DECISION_COUNT; unit++) {
      const index = RNN_LAYOUT.output + output * DECISION_COUNT + unit;
      gradient[index] += value * trace.decision[unit];
      decisionGradient[unit] += value * genome[index];
    }
  }
  return decisionGradient;
}

function decisionBackprop(
  genome: Float32Array,
  trace: Trace,
  propagated: Float64Array,
  gradient: Float64Array
): Float64Array {
  const hiddenGradient = new Float64Array(HIDDEN_COUNT);
  for (let unit = 0; unit < DECISION_COUNT; unit++) {
    const value = propagated[unit] * (1 - trace.decision[unit] ** 2);
    gradient[RNN_LAYOUT.decisionBias + unit] += value;
    for (let hidden = 0; hidden < HIDDEN_COUNT; hidden++) {
      const index = RNN_LAYOUT.decision + unit * HIDDEN_COUNT + hidden;
      gradient[index] += value * trace.hidden[hidden];
      hiddenGradient[hidden] += value * genome[index];
    }
  }
  return hiddenGradient;
}

function hiddenBackprop(
  genome: Float32Array,
  trace: Trace,
  propagated: Float64Array,
  futureDelta: Float64Array,
  gradient: Float64Array
): Float64Array {
  const currentDelta = new Float64Array(HIDDEN_COUNT);
  for (let unit = 0; unit < HIDDEN_COUNT; unit++) {
    let total = propagated[unit];
    for (let next = 0; next < HIDDEN_COUNT; next++) {
      total += futureDelta[next] * genome[RNN_LAYOUT.recurrent + next * HIDDEN_COUNT + unit];
    }
    const value = total * (1 - trace.hidden[unit] ** 2);
    currentDelta[unit] = value;
    gradient[RNN_LAYOUT.hiddenBias + unit] += value;
    for (let input = 0; input < INPUT_COUNT; input++) {
      gradient[RNN_LAYOUT.input + unit * INPUT_COUNT + input] += value * trace.inputs[input];
    }
    for (let prior = 0; prior < HIDDEN_COUNT; prior++) {
      gradient[RNN_LAYOUT.recurrent + unit * HIDDEN_COUNT + prior] += value * trace.previous[prior];
    }
  }
  return currentDelta;
}

function backward(genome: Float32Array, traces: readonly Trace[]): Float64Array {
  const gradient = new Float64Array(RNN_GENOME_LENGTH);
  let futureDelta: Float64Array = new Float64Array(HIDDEN_COUNT);
  for (let index = traces.length - 1; index >= 0; index--) {
    const trace = traces[index];
    const decision = outputBackprop(genome, trace, gradient);
    const hidden = decisionBackprop(genome, trace, decision, gradient);
    futureDelta = hiddenBackprop(genome, trace, hidden, futureDelta, gradient);
  }
  return gradient;
}

function update(
  genome: Float32Array,
  optimizer: Optimizer,
  gradient: Float64Array,
  weight: number
): void {
  optimizer.step += 1;
  const correction1 = 1 - 0.9 ** optimizer.step;
  const correction2 = 1 - 0.999 ** optimizer.step;
  for (let index = 0; index < genome.length; index++) {
    const value = gradient[index] / weight;
    optimizer.first[index] = optimizer.first[index] * 0.9 + value * 0.1;
    optimizer.second[index] = optimizer.second[index] * 0.999 + value * value * 0.001;
    const first = optimizer.first[index] / correction1;
    const second = optimizer.second[index] / correction2;
    genome[index] -= (LEARNING_RATE * first) / (Math.sqrt(second) + 1e-8);
  }
}

function categoryWeights(sequences: readonly SequenceFrame[][]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const sequence of sequences) {
    for (const frame of sequence) counts.set(frame.category, (counts.get(frame.category) ?? 0) + 1);
  }
  const maximum = Math.max(...counts.values());
  return new Map(
    [...counts].map(([category, count]) => [category, Math.min(16, Math.sqrt(maximum / count))])
  );
}

function trainChunk(
  genome: Float32Array,
  frames: readonly SequenceFrame[],
  previous: Float64Array,
  weights: ReadonlyMap<string, number>,
  optimizer: Optimizer
): { hidden: Float64Array; loss: number; weight: number } {
  const traces: Trace[] = [];
  let hidden = previous;
  let loss = 0;
  let totalWeight = 0;
  for (const frame of frames) {
    const weight = weights.get(frame.category) ?? 1;
    const trace = traceFrame(genome, frame, hidden, weight);
    traces.push(trace);
    hidden = trace.hidden;
    loss += trace.loss * weight;
    totalWeight += weight;
  }
  update(genome, optimizer, backward(genome, traces), totalWeight);
  return { hidden, loss, weight: totalWeight };
}

export function trainRecurrentSequences(
  initial: Float32Array,
  sequences: readonly SequenceFrame[][],
  epochs: number,
  chunkLength: number
): Float32Array {
  const genome = Float32Array.from(initial);
  const optimizer: Optimizer = {
    first: new Float64Array(RNN_GENOME_LENGTH),
    second: new Float64Array(RNN_GENOME_LENGTH),
    step: 0,
  };
  const weights = categoryWeights(sequences);
  for (let epoch = 0; epoch < epochs; epoch++) {
    let loss = 0;
    let totalWeight = 0;
    for (let offset = 0; offset < sequences.length; offset++) {
      const sequence = sequences[(epoch + offset) % sequences.length];
      let previous: Float64Array = new Float64Array(HIDDEN_COUNT);
      for (let start = 0; start < sequence.length; start += chunkLength) {
        const result = trainChunk(
          genome,
          sequence.slice(start, start + chunkLength),
          previous,
          weights,
          optimizer
        );
        previous = result.hidden;
        loss += result.loss;
        totalWeight += result.weight;
      }
    }
    if ((epoch + 1) % 5 === 0) {
      console.log(`sequence epoch ${epoch + 1}: loss ${(loss / totalWeight).toFixed(6)}`);
    }
  }
  return genome;
}

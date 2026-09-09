import { nextRandom, type RandomState } from "../random";
import { type Action, type Controller, IDLE_ACTION, INPUT_COUNT } from "./contract";
import { FORAGER_RNN_WEIGHTS } from "./rnnSeed";

export const HIDDEN_COUNT = 32;
export const DECISION_COUNT = 32;
export const RNN_OUTPUT_COUNT = 7;
const W_INPUT = 0;
const W_RECURRENT = W_INPUT + HIDDEN_COUNT * INPUT_COUNT;
const B_HIDDEN = W_RECURRENT + HIDDEN_COUNT * HIDDEN_COUNT;
const W_DECISION = B_HIDDEN + HIDDEN_COUNT;
const B_DECISION = W_DECISION + DECISION_COUNT * HIDDEN_COUNT;
const W_OUTPUT = B_DECISION + DECISION_COUNT;
const B_OUTPUT = W_OUTPUT + RNN_OUTPUT_COUNT * DECISION_COUNT;
export const RNN_GENOME_LENGTH = B_OUTPUT + RNN_OUTPUT_COUNT;
const MUTATION_SCALE = 0.08;

export enum RnnOutput {
  IDLE = 0,
  TURN_LEFT = 1,
  TURN_RIGHT = 2,
  MOVE = 3,
  MANDIBLE = 4,
  PHEROMONE_A = 5,
  PHEROMONE_B = 6,
}

export type RnnGenome = Float32Array;
export type RnnState = Float32Array;

export const RNN_LAYOUT = Object.freeze({
  input: W_INPUT,
  recurrent: W_RECURRENT,
  hiddenBias: B_HIDDEN,
  decision: W_DECISION,
  decisionBias: B_DECISION,
  output: W_OUTPUT,
  outputBias: B_OUTPUT,
});

function randomWeight(random: RandomState, scale: number): number {
  return (nextRandom(random) * 2 - 1) * scale;
}

function randomGenome(random: RandomState): RnnGenome {
  const genome = new Float32Array(RNN_GENOME_LENGTH);
  const scale = Math.sqrt(6 / (INPUT_COUNT + HIDDEN_COUNT));
  for (let index = 0; index < genome.length; index++) genome[index] = randomWeight(random, scale);
  return genome;
}

function hiddenStep(genome: RnnGenome, inputs: Float32Array, state: RnnState): Float32Array {
  const next = new Float32Array(HIDDEN_COUNT);
  for (let hidden = 0; hidden < HIDDEN_COUNT; hidden++) {
    let sum = genome[B_HIDDEN + hidden];
    for (let input = 0; input < INPUT_COUNT; input++) {
      sum += genome[W_INPUT + hidden * INPUT_COUNT + input] * inputs[input];
    }
    for (let previous = 0; previous < HIDDEN_COUNT; previous++) {
      sum += genome[W_RECURRENT + hidden * HIDDEN_COUNT + previous] * state[previous];
    }
    next[hidden] = Math.tanh(sum);
  }
  return next;
}

export function evaluateRnn(
  genome: RnnGenome,
  inputs: Float32Array,
  state: RnnState
): Float32Array {
  const next = hiddenStep(genome, inputs, state);
  state.set(next);
  const decision = new Float32Array(DECISION_COUNT);
  for (let unit = 0; unit < DECISION_COUNT; unit++) {
    let sum = genome[B_DECISION + unit];
    for (let hidden = 0; hidden < HIDDEN_COUNT; hidden++) {
      sum += genome[W_DECISION + unit * HIDDEN_COUNT + hidden] * next[hidden];
    }
    decision[unit] = Math.tanh(sum);
  }
  const outputs = new Float32Array(RNN_OUTPUT_COUNT);
  for (let output = 0; output < RNN_OUTPUT_COUNT; output++) {
    let sum = genome[B_OUTPUT + output];
    for (let unit = 0; unit < DECISION_COUNT; unit++) {
      sum += genome[W_OUTPUT + output * DECISION_COUNT + unit] * decision[unit];
    }
    outputs[output] = Math.tanh(sum);
  }
  return outputs;
}

function strongestMotor(outputs: Float32Array): RnnOutput {
  let strongest = RnnOutput.IDLE;
  for (let output = RnnOutput.TURN_LEFT; output <= RnnOutput.MANDIBLE; output++) {
    if (outputs[output] > outputs[strongest]) strongest = output;
  }
  return strongest;
}

function motorTurn(motor: RnnOutput): -1 | 0 | 1 {
  if (motor === RnnOutput.TURN_LEFT) return 1;
  if (motor === RnnOutput.TURN_RIGHT) return -1;
  return 0;
}

export function decodeRnnOutputs(outputs: Float32Array): Action {
  const motor = strongestMotor(outputs);
  return {
    ...IDLE_ACTION,
    turn: motorTurn(motor),
    move: motor === RnnOutput.MOVE,
    mandible: motor === RnnOutput.MANDIBLE,
    pheromoneA: Math.max(0, outputs[RnnOutput.PHEROMONE_A]),
    pheromoneB: Math.max(0, outputs[RnnOutput.PHEROMONE_B]),
  };
}

function fixedGenome(): RnnGenome {
  if (FORAGER_RNN_WEIGHTS.length !== RNN_GENOME_LENGTH) return new Float32Array(RNN_GENOME_LENGTH);
  return Float32Array.from(FORAGER_RNN_WEIGHTS);
}

export const rnnController: Controller<RnnGenome, RnnState> = {
  id: "rnn-32x32x2d",
  seed: randomGenome,
  fixedSeed: fixedGenome,
  createState: () => new Float32Array(HIDDEN_COUNT),
  act(genome, inputs, state) {
    return decodeRnnOutputs(evaluateRnn(genome, inputs, state));
  },
  mutate(genome, random) {
    const result = Float32Array.from(genome);
    for (let index = 0; index < result.length; index++) {
      if (nextRandom(random) < 0.05) result[index] += randomWeight(random, MUTATION_SCALE);
    }
    return result;
  },
  recombine(left, right, random) {
    const result = new Float32Array(RNN_GENOME_LENGTH);
    for (let index = 0; index < result.length; index++) {
      result[index] = nextRandom(random) < 0.5 ? left[index] : right[index];
    }
    return result;
  },
  genomeDistance(left, right) {
    let squared = 0;
    for (let index = 0; index < left.length; index++) squared += (left[index] - right[index]) ** 2;
    return Math.sqrt(squared / left.length);
  },
  inspectState: (state) => state,
};

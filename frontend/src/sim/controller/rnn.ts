import { nextRandom, type RandomState } from "../random";
import { INPUTS, type Action } from "../interface";

export const HIDDEN = 16,
  OUTPUTS = 5,
  PARAMETERS = 597;
const RECURRENT = INPUTS * HIDDEN,
  BIAS = RECURRENT + HIDDEN * HIDDEN;
const OUTPUT = BIAS + HIDDEN,
  OUTPUT_BIAS = OUTPUT + OUTPUTS * HIDDEN;
export interface Genome {
  readonly weights: Float32Array;
}
export interface BrainState {
  hidden: Float32Array;
  task: number;
}
export const createState = (): BrainState => ({ hidden: new Float32Array(HIDDEN), task: 0 });
const f = Math.fround;

/** A small, erasable chemotactic founder; every response lives in ordinary RNN weights. */
export function seed(): Genome {
  const w = new Float32Array(PARAMETERS);
  for (let i = 0; i < INPUTS; i++) w[i * INPUTS + i] = 1.5;
  w[3 * INPUTS + 3] = 8;
  w[7 * INPUTS + 7] = 4;
  w[RECURRENT + 1 * HIDDEN + 1] = 0.5;
  w[OUTPUT_BIAS] = 0.7;
  w[OUTPUT] = -0.6;
  w[OUTPUT + 1] = -0.2;
  w[OUTPUT + 10] = -0.4;
  w[OUTPUT + HIDDEN + 3] = -3;
  w[OUTPUT + HIDDEN + 11] = 1;
  w[OUTPUT + HIDDEN + 13] = -1;
  w[OUTPUT + 2 * HIDDEN] = 0.12;
  w[OUTPUT_BIAS + 2] = -0.02;
  w[OUTPUT + 3 * HIDDEN] = 2;
  w[OUTPUT_BIAS + 3] = -1;
  w[OUTPUT_BIAS + 4] = 1;
  return { weights: w };
}

function dot(w: Float32Array, offset: number, values: Float32Array, initial: number): number {
  let total = initial;
  for (let i = 0; i < values.length; i++) total = f(total + f(w[offset + i] * values[i]));
  return total;
}

export function act(genome: Genome, observation: Float32Array, state: BrainState): Action {
  const w = genome.weights,
    hidden = new Float32Array(HIDDEN);
  for (let h = 0; h < HIDDEN; h++) {
    const current = dot(w, h * INPUTS, observation, w[BIAS + h]);
    hidden[h] = f(Math.tanh(dot(w, RECURRENT + h * HIDDEN, state.hidden, current)));
  }
  const logits = Array.from({ length: OUTPUTS }, (_, o) =>
    dot(w, OUTPUT + o * HIDDEN, hidden, w[OUTPUT_BIAS + o])
  );
  state.hidden = hidden;
  if (logits[4] >= 0) state.task = Math.round(255 / (1 + Math.exp(-logits[3])));
  return {
    swim: Math.max(0, Math.tanh(logits[0])),
    turn: Math.tanh(logits[1]),
    secrete: Math.max(0, Math.tanh(logits[2])),
  };
}

export function mutate(genome: Genome, rng: RandomState, rate: number, scale: number): Genome {
  const weights = genome.weights.slice();
  for (let i = 0; i < weights.length; i++)
    if (nextRandom(rng) < rate)
      weights[i] = Math.max(-16, Math.min(16, weights[i] + (nextRandom(rng) * 2 - 1) * scale));
  return { weights };
}

export function genomeDistance(a: Genome, b: Genome): number {
  let distance = 0;
  for (let i = 0; i < PARAMETERS; i++) distance += (a.weights[i] - b.weights[i]) ** 2;
  return Math.sqrt(distance / PARAMETERS);
}

export function recombine(a: Genome, b: Genome, rng: RandomState): Genome {
  return {
    weights: Float32Array.from(a.weights, (v, i) => (nextRandom(rng) < 0.5 ? v : b.weights[i])),
  };
}

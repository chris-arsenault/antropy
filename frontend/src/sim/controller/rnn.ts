import { type RandomState } from "../random";
import { INPUTS, type Action } from "../interface";
import {
  combineVector,
  meanVector,
  mutateVector,
  type Mutation,
  type Crossover,
} from "../genetics/operators";
import {
  DEFAULT_LEARNING,
  seedPlasticity,
  updateTraces,
  type LearningContext,
  type PlasticState,
} from "./plasticity";

export const HIDDEN = 24,
  OUTPUTS = 8,
  PARAMETERS = INPUTS * HIDDEN + HIDDEN * HIDDEN + HIDDEN + OUTPUTS * HIDDEN + OUTPUTS;
const RECURRENT = INPUTS * HIDDEN,
  BIAS = RECURRENT + HIDDEN * HIDDEN;
const OUTPUT = BIAS + HIDDEN,
  OUTPUT_BIAS = OUTPUT + OUTPUTS * HIDDEN;
export interface Genome {
  readonly weights: Float32Array;
  readonly plasticity: Float32Array;
}
export interface BrainState extends PlasticState {
  hidden: Float32Array;
  task: number;
}
export const createState = (): BrainState => ({
  hidden: new Float32Array(HIDDEN),
  task: 0,
  traces: new Float32Array(HIDDEN * HIDDEN),
  lastReserve: null,
});
const f = Math.fround;

/** A small, erasable chemotactic founder; every response lives in ordinary RNN weights. */
export function seed(): Genome {
  const w = new Float32Array(PARAMETERS);
  for (let i = 0; i < 15; i++) w[i * INPUTS + i] = 1.5;
  [19, 20, 21, 22, 23, 25, 26, 27, 30].forEach((input, i) => {
    w[(15 + i) * INPUTS + input] = 1.5;
  });
  w[3 * INPUTS + 3] = 8;
  w[7 * INPUTS + 7] = 4;
  w[RECURRENT + 1 * HIDDEN + 1] = 0.5;
  w[OUTPUT_BIAS] = 0.7;
  w[OUTPUT] = -0.6;
  w[OUTPUT + 1] = -0.2;
  w[OUTPUT + 10] = -0.4;
  w[OUTPUT + 15] = -0.6;
  w[OUTPUT + 19] = 0.4;
  w[OUTPUT + HIDDEN + 3] = -3;
  w[OUTPUT + HIDDEN + 11] = 1;
  w[OUTPUT + HIDDEN + 13] = -1;
  w[18 * INPUTS + 22] = 8;
  w[OUTPUT + HIDDEN + 18] = -3;
  w[OUTPUT + HIDDEN + 21] = 4;
  w[OUTPUT + 2 * HIDDEN] = 0.12;
  w[OUTPUT_BIAS + 2] = -0.02;
  w[OUTPUT + 3 * HIDDEN] = 2;
  w[OUTPUT_BIAS + 3] = -1;
  w[OUTPUT_BIAS + 4] = 1;
  w[OUTPUT + 5 * HIDDEN] = 0.12;
  w[OUTPUT + 5 * HIDDEN + 15] = 0.12;
  w[OUTPUT + 5 * HIDDEN + 10] = 0.08;
  w[OUTPUT + 5 * HIDDEN + 19] = -0.4;
  w[OUTPUT_BIAS + 5] = -0.04;
  w[OUTPUT + 6 * HIDDEN] = 0.25;
  w[OUTPUT + 6 * HIDDEN + 15] = 0.25;
  w[OUTPUT + 6 * HIDDEN + 19] = -0.1;
  w[OUTPUT_BIAS + 6] = -0.03;
  w[OUTPUT + 7 * HIDDEN + 23] = 2;
  w[OUTPUT_BIAS + 7] = -0.01;
  return { weights: w, plasticity: seedPlasticity() };
}

/** Weights, traces and hidden state are float32 storage; arithmetic runs in double precision. */
function dot(w: Float32Array, offset: number, values: Float32Array, initial: number): number {
  let total = initial;
  for (let i = 0; i < values.length; i++) total += w[offset + i] * values[i];
  return total;
}
/** Recurrent contribution through the inherited weights plus the acquired trace delta. */
function recur(
  w: Float32Array,
  traces: Float32Array,
  previous: Float32Array,
  h: number,
  alpha: number,
  initial: number
): number {
  let current = initial;
  const offset = h * HIDDEN;
  for (let j = 0; j < HIDDEN; j++) {
    const index = offset + j;
    current += (w[RECURRENT + index] + alpha * traces[index]) * previous[j];
  }
  return current;
}
const scratch = new Float32Array(HIDDEN),
  logits = new Float64Array(OUTPUTS);

export function act(
  genome: Genome,
  observation: Float32Array,
  state: BrainState,
  context: LearningContext = DEFAULT_LEARNING
): Action {
  if (observation.length !== INPUTS) throw new Error("Incorrect sensor count");
  const w = genome.weights,
    previous = state.hidden,
    hidden = scratch;
  const alpha = context.plastic ? Math.abs(genome.plasticity[0]) : 0;
  for (let h = 0; h < HIDDEN; h++) {
    const current = dot(w, h * INPUTS, observation, w[BIAS + h]);
    hidden[h] = Math.tanh(recur(w, state.traces, previous, h, alpha, current));
  }
  for (let o = 0; o < OUTPUTS; o++)
    logits[o] = dot(w, OUTPUT + o * HIDDEN, hidden, w[OUTPUT_BIAS + o]);
  updateTraces(genome.plasticity, state, previous, hidden, observation, context);
  previous.set(hidden);
  if (logits[4] >= 0) state.task = Math.round(255 / (1 + Math.exp(-logits[3])));
  return {
    swim: Math.max(0, Math.tanh(logits[0])),
    turn: Math.tanh(logits[1]),
    secrete: Math.max(0, Math.tanh(logits[2])),
    toxin: Math.max(0, Math.tanh(logits[5])),
    matrix: Math.max(0, Math.tanh(logits[6])),
    repair: Math.max(0, Math.tanh(logits[7])),
  };
}

export function mutate(
  genome: Genome,
  rng: RandomState,
  rate: number,
  scale: number,
  kind: Mutation = "uniform"
): Genome {
  const options = { rate, scale, kind };
  return {
    weights: mutateVector(genome.weights, rng, options, 16),
    plasticity: mutateVector(genome.plasticity, rng, options, 1),
  };
}

export function genomeDistance(a: Genome, b: Genome): number {
  let distance = 0;
  for (let i = 0; i < PARAMETERS; i++) distance += (a.weights[i] - b.weights[i]) ** 2;
  for (let i = 0; i < a.plasticity.length; i++)
    distance += (a.plasticity[i] - b.plasticity[i]) ** 2;
  return Math.sqrt(distance / (PARAMETERS + a.plasticity.length));
}

export function recombine(
  a: Genome,
  b: Genome,
  rng: RandomState,
  kind: Crossover = "uniform"
): Genome {
  return {
    weights: combineVector(a.weights, b.weights, rng, kind),
    plasticity: combineVector(a.plasticity, b.plasticity, rng, kind),
  };
}
export function express(a: Genome, b: Genome): Genome {
  return {
    weights: meanVector(a.weights, b.weights),
    plasticity: meanVector(a.plasticity, b.plasticity),
  };
}
/** Incorporate acquired changes once into a child chromosome, never into a shared parent genome. */
export function assimilate(
  allele: Genome,
  expressed: Genome,
  state: BrainState,
  retention: number
): Genome {
  const weights = allele.weights.slice();
  const strength = Math.abs(expressed.plasticity[0]);
  for (let i = 0; i < state.traces.length; i++)
    weights[RECURRENT + i] = Math.max(
      -16,
      Math.min(16, weights[RECURRENT + i] + f(retention * f(strength * state.traces[i])))
    );
  return { weights, plasticity: allele.plasticity.slice() };
}

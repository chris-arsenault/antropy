import { nextRandom, type RandomState } from "../random";

export const perturbations = {
  uniform: (rng: RandomState) => nextRandom(rng) * 2 - 1,
  gaussian: (rng: RandomState) =>
    Math.sqrt(-2 * Math.log(Math.max(1e-12, nextRandom(rng)))) *
    Math.cos(2 * Math.PI * nextRandom(rng)),
};
export type Mutation = keyof typeof perturbations;
export interface MutationOptions {
  rate: number;
  scale: number;
  kind: Mutation;
}
export function mutateVector(
  values: Float32Array,
  rng: RandomState,
  options: MutationOptions,
  limit: number
): Float32Array {
  return Float32Array.from(values, (v) =>
    nextRandom(rng) < options.rate
      ? Math.max(-limit, Math.min(limit, v + perturbations[options.kind](rng) * options.scale))
      : v
  );
}
export const crossovers = {
  uniform: (length: number, rng: RandomState) =>
    Array.from({ length }, () => nextRandom(rng) < 0.5),
  "one-point": (length: number, rng: RandomState) => {
    const cut = Math.floor(nextRandom(rng) * (length + 1)),
      first = nextRandom(rng) < 0.5;
    return Array.from({ length }, (_, i) => (i < cut ? first : !first));
  },
};
export type Crossover = keyof typeof crossovers;
export function combineVector(
  a: Float32Array,
  b: Float32Array,
  rng: RandomState,
  kind: Crossover
): Float32Array {
  const mask = crossovers[kind](a.length, rng);
  return Float32Array.from(a, (v, i) => (mask[i] ? v : b[i]));
}
export const meanVector = (a: Float32Array, b: Float32Array): Float32Array =>
  Float32Array.from(a, (v, i) => (v + b[i]) / 2);

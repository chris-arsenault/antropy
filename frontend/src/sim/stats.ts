import { type PhysicalTraits } from "./controller/contract";
import { type World } from "./world";

/** Trait keys tracked by the instrumentation, in display order. */
export const TRAIT_KEYS = [
  "bodyScale",
  "legLength",
  "sensorGain",
  "storage",
  "eggEndowment",
  "lifespanTicks",
  "mutationSigma",
] as const satisfies readonly (keyof PhysicalTraits)[];

export const TRAIT_LABELS = ["body", "legs", "sensor", "store", "endow", "life", "sigma"] as const;

export interface WorldStats {
  tick: number;
  population: number;
  eggCount: number;
  /** Population mean per trait, TRAIT_KEYS order. */
  traitMeans: number[];
  /** Population variance per trait. */
  traitVariances: number[];
  /**
   * Live selection differential (design spec §11.4): Pearson correlation
   * between each trait and the delivery-rate fitness proxy among living ants.
   */
  selectionDifferential: number[];
  /** Share of the population belonging to the largest patriline. */
  dominantPatrilineShare: number;
  stockpile: number;
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) {
    return 0;
  }
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    covariance += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) {
    return 0;
  }
  return covariance / Math.sqrt(varX * varY);
}

function meanAndVariance(values: number[]): { mean: number; variance: number } {
  if (values.length === 0) {
    return { mean: 0, variance: 0 };
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length;
  return { mean, variance };
}

function dominantShare(world: World): number {
  if (world.ants.length === 0) {
    return 0;
  }
  const counts = new Map<number, number>();
  for (const ant of world.ants) {
    counts.set(ant.patrilineId, (counts.get(ant.patrilineId) ?? 0) + 1);
  }
  let max = 0;
  for (const count of counts.values()) {
    max = Math.max(max, count);
  }
  return max / world.ants.length;
}

/** One instrumentation sample over the living population. */
export function computeStats(world: World): WorldStats {
  const fitness = world.ants.map((ant) => ant.deliveries / (ant.age + 1));
  const traitMeans: number[] = [];
  const traitVariances: number[] = [];
  const selectionDifferential: number[] = [];

  for (const key of TRAIT_KEYS) {
    const values = world.ants.map((ant) => ant.traits[key]);
    const { mean, variance } = meanAndVariance(values);
    traitMeans.push(mean);
    traitVariances.push(variance);
    selectionDifferential.push(pearson(values, fitness));
  }

  return {
    tick: world.tick,
    population: world.ants.length,
    eggCount: world.eggs.length,
    traitMeans,
    traitVariances,
    selectionDifferential,
    dominantPatrilineShare: dominantShare(world),
    stockpile: world.colonies.reduce((sum, colony) => sum + colony.stockpile, 0),
  };
}

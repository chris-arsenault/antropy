import { INPUT_COUNT, type PhysicalTraits } from "./controller/contract";
import { computeEvolutionStats, type Estimate, type EvolutionStats } from "./evolutionStats";
import { voxelIndex } from "./grid";
import { computeRatios, type ViabilityRatios } from "./ratios";
import { sampleScent } from "./scent";
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
  /** Descriptive live trait/merit-rate correlation; not a heritability estimate. */
  traitMeritCorrelation: Estimate[];
  /** Completed-life ancestry, effective-population, diversity, and founder-line instruments. */
  evolution: EvolutionStats;
  /** Share of the population belonging to the largest patriline. */
  dominantPatrilineShare: number;
  stockpile: number;
  colonyCount: number;
  foundings: number;
  collapses: number;
  /** Auto-continue force-foundings (R3): the world was never left dead. */
  continuations: number;
  /** Live §B.3 viability ratios. */
  ratios: ViabilityRatios;
  /** Mean absolute activation per sensory input (circling checklist §B.6). */
  inputActivity: number[];
  /** Fraction of sampled surface positions with a resolvable food gradient. */
  gradientVisibility: number;
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

function pearsonEstimate(xs: number[], ys: number[]): Estimate {
  if (xs.length < 3) return { value: null, samples: xs.length };
  const xSpread = Math.max(...xs) - Math.min(...xs);
  const ySpread = Math.max(...ys) - Math.min(...ys);
  return {
    value: xSpread === 0 || ySpread === 0 ? null : pearson(xs, ys),
    samples: xs.length,
  };
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

function inputActivity(world: World): number[] {
  const sums = new Array<number>(INPUT_COUNT).fill(0);
  if (world.ants.length === 0) {
    return sums;
  }
  for (const ant of world.ants) {
    for (let i = 0; i < INPUT_COUNT && i < ant.lastInputs.length; i++) {
      sums[i] += Math.abs(ant.lastInputs[i]);
    }
  }
  return sums.map((s) => s / world.ants.length);
}

const GRADIENT_SAMPLE_STRIDE = 12;
const GRADIENT_RESOLUTION = 0.02;

/** Strided (rng-free) surface sweep: where can an ant smell food at all? */
function gradientVisibility(world: World): number {
  const { sizeX, sizeZ } = world.grid;
  let sampled = 0;
  let visible = 0;
  for (let z = 1; z < sizeZ - 1; z += GRADIENT_SAMPLE_STRIDE) {
    for (let x = 1; x < sizeX - 1; x += GRADIENT_SAMPLE_STRIDE) {
      const surface = world.surfaceMap[z * sizeX + x];
      const y = Math.min(world.grid.sizeY - 1, surface + 1);
      sampled += 1;
      if (sampleScent(world.foodScent, voxelIndex(world.grid, x, y, z), 0) >= GRADIENT_RESOLUTION) {
        visible += 1;
      }
    }
  }
  return sampled === 0 ? 0 : visible / sampled;
}

/** One instrumentation sample over the living population. */
export function computeStats(world: World): WorldStats {
  const fitness = world.ants.map((ant) => ant.netEnergyDelivered / (ant.age + 1));
  const traitMeans: number[] = [];
  const traitVariances: number[] = [];
  const traitMeritCorrelation: Estimate[] = [];

  for (const key of TRAIT_KEYS) {
    const values = world.ants.map((ant) => ant.traits[key]);
    const { mean, variance } = meanAndVariance(values);
    traitMeans.push(mean);
    traitVariances.push(variance);
    traitMeritCorrelation.push(pearsonEstimate(values, fitness));
  }

  return {
    tick: world.tick,
    population: world.ants.length,
    eggCount: world.eggs.length,
    traitMeans,
    traitVariances,
    traitMeritCorrelation,
    evolution: computeEvolutionStats(world),
    dominantPatrilineShare: dominantShare(world),
    stockpile: world.colonies.reduce((sum, colony) => sum + colony.stockpile, 0),
    colonyCount: world.colonies.length,
    foundings: world.foundings,
    collapses: world.collapses,
    continuations: world.continuations,
    ratios: computeRatios(world),
    inputActivity: inputActivity(world),
    gradientVisibility: gradientVisibility(world),
  };
}

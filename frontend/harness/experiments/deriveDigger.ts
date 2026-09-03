import {
  diggerSeedLocusGroups,
  diggerSeedLoci,
  diggerSeedVector,
  GENOME_LENGTH,
} from "../../src/sim/controller/rnn";
import { runDigger, type DiggerRun } from "../../src/sim/oracles/diggerRun";
import { createRng, randNormal, type Rng } from "../../src/sim/rng";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

interface Score {
  fitness: number;
  runs: DiggerRun[];
}

interface LocusValue {
  locus: number;
  value: number;
}

function startingVector(flags: Flags): { vector: Float32Array; parentRun: number | null } {
  if (!flags.values.has("start-run")) {
    return { vector: diggerSeedVector(), parentRun: null };
  }
  const parentRun = intFlag(flags, "start-run", 0);
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(parentRun) as
    | {
        summary: string;
      }
    | undefined;
  if (row === undefined) {
    throw new Error(`unknown start run ${parentRun}`);
  }
  const summary = JSON.parse(row.summary) as { locusValues?: LocusValue[] };
  if (summary.locusValues === undefined) {
    throw new Error(`run ${parentRun} has no digger locus values`);
  }
  const vector = diggerSeedVector();
  for (const { locus, value } of summary.locusValues) {
    vector[locus] = value;
  }
  return { vector, parentRun };
}

function selectedGroups(flags: Flags): number[][] {
  const all = diggerSeedLocusGroups();
  const indices = flag(flags, "groups", all.map((_, index) => index).join(","))
    .split(",")
    .map(Number);
  return indices.map((index) => all[index]);
}

/** Preserve the authorized topology and signs; optimize only its magnitudes. */
function perturb(mean: Float32Array, groups: number[][], sigma: number, rng: Rng): Float32Array {
  const candidate = Float32Array.from(mean);
  for (const group of groups) {
    const factor = Math.exp(randNormal(rng) * sigma);
    for (const locus of group) {
      const magnitude = Math.min(12, Math.max(0.05, Math.abs(mean[locus]) * factor));
      candidate[locus] = Math.sign(mean[locus]) * magnitude;
    }
  }
  return candidate;
}

function runFitness(run: DiggerRun, targetDepth: number): number {
  const pass =
    run.depth >= targetDepth &&
    run.roundTrips > 0 &&
    run.alive &&
    run.energy > 0.5 &&
    run.surfaceDivots === 0;
  const strayExcavation = Math.max(0, run.excavated - run.depth);
  return (
    run.depth * 1000 +
    run.roundTrips * 25 +
    Math.min(run.mouthReturns, targetDepth) * 5 +
    Math.max(0, run.energy) * 500 -
    strayExcavation * 20 -
    run.surfaceDivots * 500 -
    Math.max(0, run.maxRadius - 12) * 2 +
    (pass ? 4000 : 0)
  );
}

function evaluate(
  vector: Float32Array,
  worldSeeds: number[],
  targetDepth: number,
  ticks: number
): Score {
  const runs = worldSeeds.map((seed) => runDigger(vector, seed, targetDepth, ticks));
  const fitness = runs.reduce((sum, run) => sum + runFitness(run, targetDepth), 0) / runs.length;
  return { fitness, runs };
}

interface ResultContext {
  generations: number;
  lambda: number;
  mu: number;
  ticks: number;
  targetDepth: number;
  worldSeeds: number[];
  rngSeed: number;
  loci: number[];
  groups: number[][];
  parentRun: number | null;
  wallMs: number;
}

interface Candidate {
  candidate: Float32Array;
  score: Score;
}

function averageElite(ranked: Candidate[], mu: number): Float32Array {
  const next = new Float32Array(GENOME_LENGTH);
  for (const { candidate } of ranked.slice(0, mu)) {
    for (let i = 0; i < GENOME_LENGTH; i++) {
      next[i] += candidate[i] / mu;
    }
  }
  return next;
}

function advanceGeneration(
  mean: Float32Array,
  meanScore: Score,
  groups: number[][],
  sigma: number,
  rng: Rng,
  lambda: number,
  mu: number,
  worldSeeds: number[],
  targetDepth: number,
  ticks: number
): { mean: Float32Array; meanScore: Score; top: Candidate } {
  const ranked = Array.from({ length: lambda }, () => {
    const candidate = perturb(mean, groups, sigma, rng);
    return { candidate, score: evaluate(candidate, worldSeeds, targetDepth, ticks) };
  }).sort((a, b) => b.score.fitness - a.score.fitness);
  const next = averageElite(ranked, mu);
  const choices = [
    { candidate: next, score: evaluate(next, worldSeeds, targetDepth, ticks) },
    ranked[0],
  ].sort((a, b) => b.score.fitness - a.score.fitness);
  if (choices[0].score.fitness > meanScore.fitness) {
    return {
      mean: Float32Array.from(choices[0].candidate),
      meanScore: choices[0].score,
      top: ranked[0],
    };
  }
  return { mean, meanScore, top: ranked[0] };
}

function recordResult(
  flags: Flags,
  context: ResultContext,
  best: Score,
  bestMean: Float32Array,
  trajectory: number[]
): void {
  const locusValues = context.loci.map((locus) => ({ locus, value: bestMean[locus] }));
  console.log(`best runs: ${JSON.stringify(best.runs)}`);
  console.log(`best loci: ${JSON.stringify(locusValues)}`);
  const params = {
    lambda: context.lambda,
    mu: context.mu,
    generations: context.generations,
    targetDepth: context.targetDepth,
    worldSeeds: context.worldSeeds,
    loci: context.loci,
    groups: context.groups,
    parentRun: context.parentRun,
  };
  const runId = recordRun(
    openLedger(),
    {
      experiment: "derive-digger",
      label: flag(flags, "label", ""),
      driver: "es-step8",
      seed: context.rngSeed,
      ticks: context.ticks,
      cadence: 0,
      params,
      patches: [],
      summary: { finalFitness: best.fitness, runs: best.runs, trajectory, locusValues },
      wallMs: context.wallMs,
    },
    [],
    []
  );
  console.log(
    `[run ${runId}] derive-digger: ${trajectory[0].toFixed(2)} -> ${best.fitness.toFixed(2)}`
  );
}

/**
 * Appendix D escalation: the existing diagonal-ES pattern, restricted to
 * the five-reflex nonzero loci. No connection, recurrence, or physical gene
 * can enter the search.
 */
export function runDeriveDigger(flags: Flags): void {
  const generations = intFlag(flags, "generations", 16);
  const lambda = intFlag(flags, "lambda", 16);
  const mu = intFlag(flags, "mu", 4);
  const ticks = intFlag(flags, "ticks", 1500);
  const targetDepth = intFlag(flags, "depth", 8);
  const worldSeeds = flag(flags, "world-seeds", "9950").split(",").map(Number);
  const rngSeed = intFlag(flags, "seed", 6500);
  const rng = createRng(rngSeed);
  const groups = selectedGroups(flags);
  const loci = diggerSeedLoci();
  let sigma = Number(flag(flags, "sigma", "0.55"));
  const startVector = startingVector(flags);
  let mean = startVector.vector;
  let bestMean = Float32Array.from(mean);
  let best = evaluate(mean, worldSeeds, targetDepth, ticks);
  let meanScore = best;
  const trajectory = [best.fitness];
  const start = Date.now();
  console.log(`gen 0: fitness=${best.fitness.toFixed(2)} loci=${loci.length}`);

  for (let generation = 1; generation <= generations; generation++) {
    const advanced = advanceGeneration(
      mean,
      meanScore,
      groups,
      sigma,
      rng,
      lambda,
      mu,
      worldSeeds,
      targetDepth,
      ticks
    );
    mean = advanced.mean;
    meanScore = advanced.meanScore;
    trajectory.push(meanScore.fitness);
    if (advanced.top.score.fitness > best.fitness) {
      best = advanced.top.score;
      bestMean = Float32Array.from(advanced.top.candidate);
    }
    if (meanScore.fitness > best.fitness) {
      best = meanScore;
      bestMean = Float32Array.from(mean);
    }
    sigma *= 0.96;
    console.log(
      `gen ${generation}: mean=${meanScore.fitness.toFixed(2)} ` +
        `best=${best.fitness.toFixed(2)} top=${advanced.top.score.fitness.toFixed(2)} ` +
        `sigma=${sigma.toFixed(3)}`
    );
  }

  recordResult(
    flags,
    {
      generations,
      lambda,
      mu,
      ticks,
      targetDepth,
      worldSeeds,
      rngSeed,
      loci,
      groups,
      parentRun: startVector.parentRun,
      wallMs: Date.now() - start,
    },
    best,
    bestMean,
    trajectory
  );
}

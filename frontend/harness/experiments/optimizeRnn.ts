import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RNN_GENOME_LENGTH } from "../../src/sim/controller/rnn";
import { FORAGER_RNN_WEIGHTS } from "../../src/sim/controller/rnnSeed";
import { createRandomState, nextRandom, type RandomState } from "../../src/sim/random";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { type RnnFitness } from "../rnnFitnessWorker";

interface Sample {
  readonly vector: Float32Array;
  readonly noise: Float64Array;
}

interface Candidate extends Sample {
  readonly fitness: RnnFitness;
}

interface MeanUpdate {
  readonly vector: Float32Array;
  readonly rms: number;
}

const WORKER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "rnnFitnessWorker.ts");

function numericFlag(flags: Flags, key: string, fallback: number): number {
  const value = Number(flag(flags, key, String(fallback)));
  if (!Number.isFinite(value)) throw new Error(`--${key} must be numeric`);
  return value;
}

function normal(random: RandomState): number {
  const first = Math.max(Number.EPSILON, nextRandom(random));
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * nextRandom(random));
}

function mirrored(mean: Float32Array, pairs: number, sigma: number, random: RandomState): Sample[] {
  const result: Sample[] = [];
  for (let pair = 0; pair < pairs; pair++) {
    const direction = Float64Array.from({ length: mean.length }, () => normal(random));
    for (const sign of [-1, 1]) {
      const noise = Float64Array.from(direction, (value) => value * sign);
      const vector = Float32Array.from(mean, (value, index) => value + noise[index] * sigma);
      result.push({ vector, noise });
    }
  }
  return result;
}

function evaluateBatch(
  vectors: readonly Float32Array[],
  seeds: readonly number[],
  ticks: number
): Promise<RnnFitness[]> {
  return new Promise((resolve, reject) => {
    // Local harness fan-out; this process path is never used by the browser application.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn("pnpm", ["exec", "tsx", WORKER], {
      cwd: path.join(path.dirname(WORKER), ".."),
      stdio: ["pipe", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (data: Buffer) => (output += data.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(JSON.parse(output) as RnnFitness[]);
      else reject(new Error(`RNN fitness worker exited ${code}`));
    });
    child.stdin.end(
      JSON.stringify({ vectors: vectors.map((vector) => Array.from(vector)), seeds, ticks })
    );
  });
}

async function evaluatePopulation(
  vectors: readonly Float32Array[],
  seeds: readonly number[],
  ticks: number,
  jobs: number
): Promise<RnnFitness[]> {
  const batches = Array.from({ length: Math.min(jobs, vectors.length) }, () => [] as number[]);
  for (let index = 0; index < vectors.length; index++) batches[index % batches.length].push(index);
  const results = new Array<RnnFitness>(vectors.length);
  await Promise.all(
    batches.map(async (indices) => {
      const batch = await evaluateBatch(
        indices.map((index) => vectors[index]),
        seeds,
        ticks
      );
      for (let index = 0; index < indices.length; index++) results[indices[index]] = batch[index];
    })
  );
  return results;
}

function rankUtilities(candidates: readonly Candidate[]): Float64Array {
  const order = candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((left, right) =>
      left.candidate.fitness.score === right.candidate.fitness.score
        ? left.candidate.fitness.worst - right.candidate.fitness.worst
        : left.candidate.fitness.score - right.candidate.fitness.score
    );
  const utilities = new Float64Array(candidates.length);
  for (let rank = 0; rank < order.length; rank++) {
    utilities[order[rank].index] = rank / Math.max(1, order.length - 1) - 0.5;
  }
  const magnitude = utilities.reduce((total, value) => total + Math.abs(value), 0);
  return Float64Array.from(utilities, (value) => value / magnitude);
}

function updateMean(
  mean: Float32Array,
  candidates: readonly Candidate[],
  sigma: number,
  learningRate: number,
  maximumStepFraction: number
): MeanUpdate {
  const utilities = rankUtilities(candidates);
  const delta = Float64Array.from(mean, (_, locus) => {
    let direction = 0;
    for (let sample = 0; sample < candidates.length; sample++) {
      direction += utilities[sample] * candidates[sample].noise[locus];
    }
    return (learningRate * direction) / sigma;
  });
  const proposedRms = Math.sqrt(
    delta.reduce((total, value) => total + value ** 2, 0) / delta.length
  );
  const maximumRms = sigma * maximumStepFraction;
  const scale = proposedRms > maximumRms ? maximumRms / proposedRms : 1;
  return {
    vector: Float32Array.from(mean, (value, locus) => value + delta[locus] * scale),
    rms: proposedRms * scale,
  };
}

function writeSeed(genome: Float32Array): void {
  const output = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../src/sim/controller/rnnSeed.ts"
  );
  const values = [...genome].map((value) => Number(value.toFixed(8)));
  writeFileSync(
    output,
    `/** Generated by \`pnpm harness train-rnn\`; do not hand-edit. */\nexport const FORAGER_RNN_WEIGHTS: readonly number[] = ${JSON.stringify(values)};\n`
  );
}

function report(
  generation: number,
  fitness: RnnFitness,
  populationBest: RnnFitness,
  best: RnnFitness,
  stepRms: number
): void {
  console.log(
    `generation ${generation}: mean=${fitness.score.toFixed(3)} worst=${fitness.worst.toFixed(3)} ` +
      `pickups=${fitness.pickups} deposits=${fitness.deposits}; ` +
      `population-best=${populationBest.score.toFixed(3)} retained=${best.score.toFixed(3)} ` +
      `step-rms=${stepRms.toFixed(6)}`
  );
}

export async function runOptimizeRnn(flags: Flags): Promise<void> {
  if (FORAGER_RNN_WEIGHTS.length !== RNN_GENOME_LENGTH) throw new Error("RNN seed shape mismatch");
  const seeds = seedsFlag(flags, "1,2");
  const ticks = integerFlag(flags, "ticks", 1_200);
  const jobs = integerFlag(flags, "jobs", 5);
  const pairs = integerFlag(flags, "pairs", 12);
  const generations = integerFlag(flags, "generations", 12);
  const sigma = numericFlag(flags, "sigma", 0.003);
  const learningRate = numericFlag(flags, "learning-rate", 0.000_3);
  const maximumStepFraction = numericFlag(flags, "maximum-step-fraction", 0.25);
  const random = createRandomState(integerFlag(flags, "rng-seed", 20_260_906));
  let mean: Float32Array = Float32Array.from(FORAGER_RNN_WEIGHTS);
  let best = (await evaluatePopulation([mean], seeds, ticks, 1))[0];
  let bestGenome = Float32Array.from(mean);
  report(0, best, best, best, 0);
  for (let generation = 1; generation <= generations; generation++) {
    const samples = mirrored(mean, pairs, sigma, random);
    const fitnesses = await evaluatePopulation(
      samples.map((sample) => sample.vector),
      seeds,
      ticks,
      jobs
    );
    const candidates = samples.map((sample, index) => ({ ...sample, fitness: fitnesses[index] }));
    const populationBest = candidates.reduce((current, candidate) =>
      candidate.fitness.score > current.fitness.score ? candidate : current
    ).fitness;
    const update = updateMean(mean, candidates, sigma, learningRate, maximumStepFraction);
    mean = update.vector;
    const meanFitness = (await evaluatePopulation([mean], seeds, ticks, 1))[0];
    if (
      meanFitness.deposits > best.deposits ||
      (meanFitness.deposits === best.deposits && meanFitness.score > best.score)
    ) {
      best = meanFitness;
      bestGenome = Float32Array.from(mean);
    }
    report(generation, meanFitness, populationBest, best, update.rms);
  }
  writeSeed(bestGenome);
  console.log(`wrote outcome-trained RNN with ${best.deposits} training-world deposits`);
}

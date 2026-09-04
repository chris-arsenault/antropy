import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENOME_LENGTH, WEIGHT_COUNT } from "../../src/sim/controller/rnn";
import { createRng, randNormal, type Rng } from "../../src/sim/rng";
import { type ColonyEnergyVerdict } from "../colonyEnergyWorker";
import { type ColonyOutcomeVerdict } from "../lib/colonyOutcome";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { bakeClone } from "./cloneColonyLoop";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENERGY_WORKER = path.join(ROOT, "colonyEnergyWorker.ts");
const CACHE_WORKER = path.join(ROOT, "colonyOutcomeWorker.ts");

interface Sample {
  vector: Float32Array;
  noise: Float64Array;
  verdict?: ColonyEnergyVerdict;
}

interface GuardedVerdict {
  energy: ColonyEnergyVerdict;
  cache: ColonyOutcomeVerdict;
}

interface GuardedProposal extends GuardedVerdict {
  vector: Float32Array;
}

interface InterpolationSettings {
  parentRun: number;
  towardRun: number | null;
  fraction: number;
}

function seedList(raw: string): number[] {
  return raw.split(",").map(Number);
}

function startingVector(runId: number): Float32Array {
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(runId) as
    { summary: string } | undefined;
  const vector = row ? (JSON.parse(row.summary) as { vector?: number[] }).vector : undefined;
  if (vector?.length !== GENOME_LENGTH) throw new Error(`run ${runId} has no controller vector`);
  return Float32Array.from(vector);
}

function interpolationSettings(flags: Flags): InterpolationSettings {
  return {
    parentRun: intFlag(flags, "start-run", 851),
    towardRun: flags.values.has("toward-run") ? intFlag(flags, "toward-run", 0) : null,
    fraction: Number(flag(flags, "interpolation", "0")),
  };
}

function interpolatedVector(settings: InterpolationSettings): Float32Array {
  const parent = startingVector(settings.parentRun);
  if (settings.towardRun === null) return parent;
  const target = startingVector(settings.towardRun);
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    parent[locus] += (target[locus] - parent[locus]) * settings.fraction;
  }
  return parent;
}

function runWorker<T>(worker: string, job: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    // Harness-only process fan-out; no shell or production execution.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn("pnpm", ["exec", "tsx", worker], {
      cwd: ROOT,
      stdio: ["pipe", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (data: Buffer) => (output += data.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(JSON.parse(output) as T);
      else reject(new Error(`worker ${path.basename(worker)} exited ${code}`));
    });
    child.stdin.end(JSON.stringify(job));
  });
}

async function pooled<T>(tasks: (() => Promise<T>)[], jobs: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const lane = async (): Promise<void> => {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(jobs, tasks.length) }, lane));
  return results;
}

function evaluateEnergy(
  vector: Float32Array,
  worldSeeds: number[],
  ticks: number
): Promise<ColonyEnergyVerdict> {
  return runWorker(ENERGY_WORKER, { vector: Array.from(vector), worldSeeds, ticks });
}

function evaluateCache(
  vector: Float32Array,
  worldSeeds: number[],
  ticks: number
): Promise<ColonyOutcomeVerdict> {
  return runWorker(CACHE_WORKER, { vector: Array.from(vector), worldSeeds, ticks });
}

function compareEnergy(left: ColonyEnergyVerdict, right: ColonyEnergyVerdict): number {
  const leftOrder = [left.medianBalance, left.positiveCount, left.worstBalance, left.meanBalance];
  const rightOrder = [
    right.medianBalance,
    right.positiveCount,
    right.worstBalance,
    right.meanBalance,
  ];
  for (let index = 0; index < leftOrder.length; index++) {
    if (leftOrder[index] !== rightOrder[index]) return leftOrder[index] - rightOrder[index];
  }
  return 0;
}

function compareGuarded(left: GuardedVerdict, right: GuardedVerdict): number {
  const leftCache = [
    left.cache.completionCount,
    left.cache.cacheCount,
    left.cache.returnCount,
    left.cache.pickupCount,
    left.cache.exitCount,
  ];
  const rightCache = [
    right.cache.completionCount,
    right.cache.cacheCount,
    right.cache.returnCount,
    right.cache.pickupCount,
    right.cache.exitCount,
  ];
  for (let index = 0; index < leftCache.length; index++) {
    if (leftCache[index] !== rightCache[index]) return leftCache[index] - rightCache[index];
  }
  return compareEnergy(left.energy, right.energy);
}

function mirrored(mean: Float32Array, pairs: number, sigma: number, rng: Rng): Sample[] {
  const samples: Sample[] = [];
  for (let pair = 0; pair < pairs; pair++) {
    const direction = new Float64Array(WEIGHT_COUNT);
    for (let locus = 0; locus < WEIGHT_COUNT; locus++) direction[locus] = randNormal(rng);
    for (const sign of [-1, 1]) {
      const vector = Float32Array.from(mean);
      const noise = new Float64Array(WEIGHT_COUNT);
      for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
        noise[locus] = direction[locus] * sign;
        vector[locus] += sigma * noise[locus];
      }
      samples.push({ vector, noise });
    }
  }
  return samples;
}

function updateMean(
  mean: Float32Array,
  samples: Sample[],
  sigma: number,
  rate: number
): Float32Array {
  const order = [...samples].sort((left, right) =>
    compareEnergy(left.verdict as ColonyEnergyVerdict, right.verdict as ColonyEnergyVerdict)
  );
  const utilities = new Map(
    order.map((sample, rank) => [sample, rank / Math.max(1, order.length - 1) - 0.5])
  );
  const next = Float32Array.from(mean);
  for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
    let gradient = 0;
    for (const sample of samples) gradient += (utilities.get(sample) ?? 0) * sample.noise[locus];
    next[locus] += (rate * gradient) / (sigma * samples.length);
  }
  return next;
}

async function proposals(
  mean: Float32Array,
  pairs: number,
  sigma: number,
  rate: number,
  rng: Rng,
  energySeeds: number[],
  energyTicks: number,
  jobs: number,
  eliteCount: number
): Promise<Float32Array[]> {
  const samples = mirrored(mean, pairs, sigma, rng);
  const verdicts = await pooled(
    samples.map(
      ({ vector }) =>
        () =>
          evaluateEnergy(vector, energySeeds, energyTicks)
    ),
    jobs
  );
  for (let index = 0; index < samples.length; index++) samples[index].verdict = verdicts[index];
  const elites = [...samples]
    .sort((left, right) =>
      compareEnergy(right.verdict as ColonyEnergyVerdict, left.verdict as ColonyEnergyVerdict)
    )
    .slice(0, eliteCount)
    .map(({ vector }) => vector);
  return [updateMean(mean, samples, sigma, rate), ...elites];
}

async function guard(
  vector: Float32Array,
  cacheSeeds: number[],
  cacheTicks: number,
  energySeeds: number[],
  energyTicks: number
): Promise<GuardedVerdict> {
  const [cache, energy] = await Promise.all([
    evaluateCache(vector, cacheSeeds, cacheTicks),
    evaluateEnergy(vector, energySeeds, energyTicks),
  ]);
  return { cache, energy };
}

async function bestGuardedProposal(
  vectors: Float32Array[],
  cacheSeeds: number[],
  cacheTicks: number,
  energySeeds: number[],
  energyTicks: number,
  jobs: number
): Promise<GuardedProposal> {
  const verdicts = await pooled(
    vectors.map((vector) => () => guard(vector, cacheSeeds, cacheTicks, energySeeds, energyTicks)),
    jobs
  );
  const guarded = vectors.map((vector, index) => ({ vector, ...verdicts[index] }));
  return guarded.reduce((best, candidate) =>
    compareGuarded(candidate, best) > 0 ? candidate : best
  );
}

function recordEnergyRun(
  vector: Float32Array,
  verdict: GuardedVerdict,
  flags: Flags,
  params: Record<string, unknown>,
  wallMs: number,
  checkpoint: boolean
): number {
  return recordRun(
    openLedger(),
    {
      experiment: checkpoint ? "optimize-colony-energy/checkpoint" : "optimize-colony-energy",
      label: flag(flags, "label", ""),
      driver: "full-rnn-energy-es",
      seed: params.rngSeed as number,
      ticks: params.energyTicks as number,
      cadence: 0,
      params,
      patches: [],
      summary: { ...verdict, vector: Array.from(vector) },
      wallMs,
    },
    [],
    []
  );
}

function recordAccepted(
  vector: Float32Array,
  verdict: GuardedVerdict,
  flags: Flags,
  params: Record<string, unknown>,
  generation: number,
  sigma: number,
  rate: number,
  started: number
): void {
  const runId = recordEnergyRun(
    vector,
    verdict,
    flags,
    { ...params, generation, sigma, rate },
    Date.now() - started,
    true
  );
  console.log(`accepted checkpoint run ${runId}`);
}

/** Full-weight recurrent search against real colony energy with behavior guards. */
export async function runOptimizeColonyEnergy(flags: Flags): Promise<void> {
  const generations = intFlag(flags, "generations", 6);
  const pairs = intFlag(flags, "pairs", 6);
  const jobs = intFlag(flags, "jobs", Math.max(2, os.cpus().length - 2));
  const eliteCount = intFlag(flags, "guard-elites", 2);
  const cacheTicks = intFlag(flags, "cache-ticks", 1800);
  const energyTicks = intFlag(flags, "energy-ticks", 1200);
  const cacheSeeds = seedList(flag(flags, "cache-seeds", "9400,9401,9403,9404"));
  const energySeeds = seedList(flag(flags, "energy-seeds", "9800,9801,9802"));
  const interpolation = interpolationSettings(flags);
  const rngSeed = intFlag(flags, "seed", 9900);
  const rate = Number(flag(flags, "rate", "0.02"));
  let sigma = Number(flag(flags, "sigma", "0.025"));
  let mean = interpolatedVector(interpolation);
  let verdict = await guard(mean, cacheSeeds, cacheTicks, energySeeds, energyTicks);
  const started = Date.now();
  const params = {
    ...interpolation,
    rngSeed,
    cacheSeeds,
    energySeeds,
    cacheTicks,
    energyTicks,
    pairs,
    jobs,
  };
  console.log(
    `gen 0: cache=${verdict.cache.completionCount}/${cacheSeeds.length} energy-median=${verdict.energy.medianBalance.toFixed(3)} pheromone=${verdict.energy.meanPheromoneEnergyBurned.toFixed(3)}`
  );
  const rng = createRng(rngSeed);
  for (let generation = 1; generation <= generations; generation++) {
    const proposed = await proposals(
      mean,
      pairs,
      sigma,
      rate,
      rng,
      energySeeds,
      energyTicks,
      jobs,
      eliteCount
    );
    const best = await bestGuardedProposal(
      proposed,
      cacheSeeds,
      cacheTicks,
      energySeeds,
      energyTicks,
      jobs
    );
    if (compareGuarded(best, verdict) > 0) {
      mean = best.vector;
      verdict = best;
      recordAccepted(mean, verdict, flags, params, generation, sigma, rate, started);
    }
    sigma *= 0.97;
    console.log(
      `gen ${generation}: cache=${verdict.cache.completionCount}/${cacheSeeds.length} energy-median=${verdict.energy.medianBalance.toFixed(3)} pheromone=${verdict.energy.meanPheromoneEnergyBurned.toFixed(3)} sigma=${sigma.toFixed(4)}`
    );
    if (verdict.energy.medianBalance > 0) break;
  }
  const runId = recordEnergyRun(
    mean,
    verdict,
    flags,
    { ...params, generations, sigma, rate, eliteCount },
    Date.now() - started,
    false
  );
  console.log(
    `[run ${runId}] cache=${verdict.cache.completionCount}/${cacheSeeds.length} energy-median=${verdict.energy.medianBalance.toFixed(3)}`
  );
  if (flag(flags, "bake", "false") === "true") console.log(`baked ${bakeClone(mean, runId)}`);
}

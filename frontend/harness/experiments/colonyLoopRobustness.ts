import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENOME_LENGTH, rnnController } from "../../src/sim/controller/rnn";
import { createRng, type Rng } from "../../src/sim/rng";
import { type ColonyOutcomeVerdict } from "../lib/colonyOutcome";
import { flag, intFlag, seedsOf, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

const WORKER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "colonyOutcomeWorker.ts"
);

interface PerturbedController {
  readonly sigma: number;
  readonly sample: number;
  readonly vector: Float32Array;
}

export interface RobustnessScale {
  readonly sigma: number;
  readonly samples: number;
  readonly retained: number;
  readonly retention: number;
  readonly completedEpisodes: number;
  readonly episodeCompletionRate: number;
  readonly meanMilestoneScore: number;
  readonly minimumMilestoneScore: number;
}

function numbers(raw: string): number[] {
  return raw.split(",").filter(Boolean).map(Number);
}

function loadVector(runId: number): Float32Array {
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(runId) as
    { summary: string } | undefined;
  const vector = row ? (JSON.parse(row.summary) as { vector?: number[] }).vector : undefined;
  if (vector?.length !== GENOME_LENGTH) throw new Error(`run ${runId} has no controller vector`);
  return Float32Array.from(vector);
}

function diploid(vector: Float32Array): Float32Array {
  const result = new Float32Array(GENOME_LENGTH * 2);
  result.set(vector);
  result.set(vector, GENOME_LENGTH);
  return result;
}

/** Apply the production mutation operator to two identical copies. */
export function mutateController(vector: Float32Array, sigma: number, rng: Rng): Float32Array {
  const base = diploid(vector);
  if (sigma === 0) return base;
  const genome = rnnController.deserializeGenome(base);
  return rnnController.serializeGenome(rnnController.mutate(genome, sigma, rng));
}

function candidates(
  vector: Float32Array,
  sigmas: number[],
  sampleCount: number,
  rng: Rng
): PerturbedController[] {
  return sigmas.flatMap((sigma) => {
    const count = sigma === 0 ? 1 : sampleCount;
    return Array.from({ length: count }, (_, sample) => ({
      sigma,
      sample,
      vector: mutateController(vector, sigma, rng),
    }));
  });
}

function evaluate(
  candidate: PerturbedController,
  worldSeeds: number[],
  ticks: number
): Promise<ColonyOutcomeVerdict> {
  return new Promise((resolve, reject) => {
    // Harness-only process fan-out; no shell or production execution.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn("pnpm", ["exec", "tsx", WORKER], {
      cwd: path.join(path.dirname(WORKER), ".."),
      stdio: ["pipe", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (data: Buffer) => (output += data.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(JSON.parse(output) as ColonyOutcomeVerdict);
      else reject(new Error(`colony outcome worker exited ${code}`));
    });
    child.stdin.end(
      JSON.stringify({
        vector: Array.from(candidate.vector),
        worldSeeds,
        ticks,
        exact: true,
      })
    );
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

export function summarizeRobustnessScale(
  sigma: number,
  verdicts: ColonyOutcomeVerdict[],
  worldCount: number,
  requiredCompletionRate: number
): RobustnessScale {
  const requiredCompletions = Math.ceil(worldCount * requiredCompletionRate);
  const completedEpisodes = verdicts.reduce((total, verdict) => total + verdict.completionCount, 0);
  const retained = verdicts.filter(
    (verdict) => verdict.completionCount >= requiredCompletions
  ).length;
  return {
    sigma,
    samples: verdicts.length,
    retained,
    retention: retained / verdicts.length,
    completedEpisodes,
    episodeCompletionRate: completedEpisodes / (verdicts.length * worldCount),
    meanMilestoneScore:
      verdicts.reduce((total, verdict) => total + verdict.mean, 0) / verdicts.length,
    minimumMilestoneScore: Math.min(...verdicts.map((verdict) => verdict.worst)),
  };
}

function validate(
  runIds: number[],
  sigmas: number[],
  samples: number,
  requiredCompletionRate: number
): void {
  if (runIds.length === 0) throw new Error("--controller-runs is required");
  if (sigmas.length === 0 || sigmas.some((sigma) => !Number.isFinite(sigma) || sigma < 0)) {
    throw new Error("--sigmas must contain finite non-negative values");
  }
  if (!Number.isInteger(samples) || samples < 1) throw new Error("--samples must be positive");
  if (requiredCompletionRate <= 0 || requiredCompletionRate > 1) {
    throw new Error("--required-completion-rate must be in (0, 1]");
  }
}

/** Measure held-out behavior retention under the production mutation operator. */
export async function runColonyLoopRobustness(flags: Flags): Promise<void> {
  const runIds = numbers(flag(flags, "controller-runs", ""));
  const sigmas = numbers(flag(flags, "sigmas", "0,0.05,0.1,0.25,0.5,1"));
  const samples = intFlag(flags, "samples", 8);
  const worldSeeds = seedsOf(flags, "19600,19601,19602,19603,19604,19605,19606,19607");
  const ticks = intFlag(flags, "ticks", 2500);
  const jobs = intFlag(flags, "jobs", Math.min(8, Math.max(2, os.cpus().length - 2)));
  const rngSeed = intFlag(flags, "mutation-seed", 19700);
  const requiredCompletionRate = Number(flag(flags, "required-completion-rate", "0.75"));
  validate(runIds, sigmas, samples, requiredCompletionRate);
  const rng = createRng(rngSeed);
  for (const sourceRun of runIds) {
    const started = Date.now();
    const perturbed = candidates(loadVector(sourceRun), sigmas, samples, rng);
    const verdicts = await pooled(
      perturbed.map((candidate) => () => evaluate(candidate, worldSeeds, ticks)),
      jobs
    );
    const curve = sigmas.map((sigma) =>
      summarizeRobustnessScale(
        sigma,
        verdicts.filter((_, index) => perturbed[index].sigma === sigma),
        worldSeeds.length,
        requiredCompletionRate
      )
    );
    const outcomes = perturbed.map((candidate, index) => {
      const verdict = verdicts[index];
      return {
        sigma: candidate.sigma,
        sample: candidate.sample,
        completionCount: verdict.completionCount,
        cacheCount: verdict.cacheCount,
        returnCount: verdict.returnCount,
        pickupCount: verdict.pickupCount,
        exitCount: verdict.exitCount,
        meanMilestoneScore: verdict.mean,
        minimumMilestoneScore: verdict.worst,
        worldScores: verdict.scores,
      };
    });
    const runId = recordRun(
      openLedger(),
      {
        experiment: "colony-loop/robustness",
        label: flag(flags, "label", ""),
        driver: "exact-rnn-mutation-curve",
        seed: rngSeed,
        ticks,
        cadence: 0,
        params: {
          sourceRun,
          sigmas,
          samples,
          worldSeeds,
          jobs,
          requiredCompletionRate,
        },
        patches: [],
        summary: { curve, outcomes },
        wallMs: Date.now() - started,
      },
      [],
      []
    );
    console.log(`[run ${runId}] source=${sourceRun} ${JSON.stringify(curve)}`);
  }
}

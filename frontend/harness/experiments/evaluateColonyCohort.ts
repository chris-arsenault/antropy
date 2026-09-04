import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENOME_LENGTH } from "../../src/sim/controller/rnn";
import { type ColonyOutcomeVerdict } from "../lib/colonyOutcome";
import { flag, intFlag, seedsOf, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

const WORKER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "colonyOutcomeWorker.ts"
);

interface Candidate {
  readonly source: string;
  readonly vector: Float32Array;
}

interface EvaluatedCandidate {
  readonly source: string;
  readonly verdict: ColonyOutcomeVerdict;
}

function runIds(raw: string): number[] {
  return raw.split(",").filter(Boolean).map(Number);
}

function loadVector(runId: number): Float32Array {
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(runId) as
    { summary: string } | undefined;
  const vector = row ? (JSON.parse(row.summary) as { vector?: number[] }).vector : undefined;
  if (vector?.length !== GENOME_LENGTH) throw new Error(`run ${runId} has no controller vector`);
  return Float32Array.from(vector);
}

function candidates(flags: Flags): Candidate[] {
  return runIds(flag(flags, "controller-runs", "")).map((runId) => ({
    source: `run-${runId}`,
    vector: loadVector(runId),
  }));
}

function evaluate(
  candidate: Candidate,
  worldSeeds: number[],
  ticks: number
): Promise<EvaluatedCandidate> {
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
      if (code === 0) {
        resolve({ source: candidate.source, verdict: JSON.parse(output) as ColonyOutcomeVerdict });
      } else {
        reject(new Error(`colony outcome worker exited ${code}`));
      }
    });
    child.stdin.end(JSON.stringify({ vector: Array.from(candidate.vector), worldSeeds, ticks }));
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

function sum(results: EvaluatedCandidate[], key: keyof ColonyOutcomeVerdict): number {
  return results.reduce((total, result) => total + Number(result.verdict[key]), 0);
}

function cohortSummary(results: EvaluatedCandidate[], worldCount: number) {
  const requiredWorlds = Math.floor(worldCount / 2) + 1;
  return {
    controllerCount: results.length,
    completingControllers: results.filter(
      ({ verdict }) => verdict.completionCount >= requiredWorlds
    ).length,
    completionEpisodes: sum(results, "completionCount"),
    cacheEpisodes: sum(results, "cacheCount"),
    returnEpisodes: sum(results, "returnCount"),
    pickupEpisodes: sum(results, "pickupCount"),
    exitEpisodes: sum(results, "exitCount"),
    totalEpisodes: results.length * worldCount,
  };
}

/** Evaluate independently trained controllers without selecting or modifying them. */
export async function runEvaluateColonyCohort(flags: Flags): Promise<void> {
  const cohort = candidates(flags);
  if (cohort.length === 0) throw new Error("--controller-runs is required");
  const worldSeeds = seedsOf(flags, "19500,19501,19502,19503,19504");
  const ticks = intFlag(flags, "ticks", 2500);
  const jobs = intFlag(flags, "jobs", Math.min(8, Math.max(2, os.cpus().length - 2)));
  const started = Date.now();
  const results = await pooled(
    cohort.map((candidate) => () => evaluate(candidate, worldSeeds, ticks)),
    jobs
  );
  const summary = cohortSummary(results, worldSeeds.length);
  const runId = recordRun(
    openLedger(),
    {
      experiment: "evaluate-colony-cohort",
      label: flag(flags, "label", ""),
      driver: "fixed-trained-rnn-cohort",
      seed: 0,
      ticks,
      cadence: 0,
      params: { controllerSources: cohort.map(({ source }) => source), worldSeeds, jobs },
      patches: [],
      summary: { cohort: summary, controllers: results },
      wallMs: Date.now() - started,
    },
    [],
    []
  );
  console.log(
    `[run ${runId}] colony cohort: complete=${summary.completionEpisodes}/${summary.totalEpisodes} ` +
      `cache=${summary.cacheEpisodes} return=${summary.returnEpisodes} ` +
      `pickup=${summary.pickupEpisodes} exit=${summary.exitEpisodes}`
  );
}

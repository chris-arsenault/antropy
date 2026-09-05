import { spawn } from "node:child_process";
import { type DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyConfigOverrides, configPreset, type SimConfig } from "../../src/sim/config";
import { flag, intFlag, seedsOf, type Flags } from "../lib/flags";
import {
  type ResilienceEpisodeJob,
  type ResilienceEpisodeResult,
  type ResilienceShock,
} from "../lib/colonyResilience";
import {
  openLedger,
  recordDemographySeries,
  recordEvolutionSeries,
  recordRun,
} from "../lib/ledger";
import { type ResilienceWorkerResult } from "../colonyResilienceWorker";

const WORKER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "colonyResilienceWorker.ts"
);

interface ResilienceOutcome {
  readonly job: ResilienceEpisodeJob;
  readonly result: ResilienceEpisodeResult;
  readonly wallMs: number;
}

function numberList(raw: string): number[] {
  return raw.split(",").filter(Boolean).map(Number);
}

function shocks(flags: Flags): ResilienceShock[] {
  const parsed = flag(flags, "shocks", "workers,energy").split(",");
  for (const value of parsed) {
    if (value !== "workers" && value !== "energy") {
      throw new Error(`unknown resilience shock "${value}"`);
    }
  }
  return parsed as ResilienceShock[];
}

function jobs(flags: Flags): ResilienceEpisodeJob[][] {
  const config = applyConfigOverrides(
    configPreset(flag(flags, "config", "nest")),
    flags.values.get("flag") ?? []
  );
  const warmupTicks = intFlag(flags, "warmup", 1200);
  const recoveryTicks = intFlag(flags, "recovery", 1200);
  const cadence = intFlag(flags, "cadence", 100);
  const fractions = numberList(flag(flags, "fractions", "0.25,0.5,0.75"));
  return seedsOf(flags, "25000,25001,25002,25003").map((seed) => [
    { seed, warmupTicks, recoveryTicks, cadence, shock: "control", shockFraction: 0, config },
    ...shocks(flags).flatMap((shock) =>
      fractions.map((shockFraction) => ({
        seed,
        warmupTicks,
        recoveryTicks,
        cadence,
        shock,
        shockFraction,
        config,
      }))
    ),
  ]);
}

function execute(jobsForSeed: ResilienceEpisodeJob[]): Promise<ResilienceOutcome[]> {
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
        const worker = JSON.parse(output) as ResilienceWorkerResult;
        const sharedSetup = worker.setupWallMs / worker.treatments.length;
        resolve(
          worker.treatments.map(({ job, result, wallMs }) => ({
            job,
            result,
            wallMs: wallMs + sharedSetup,
          }))
        );
      } else {
        reject(new Error(`colony resilience worker exited ${code}`));
      }
    });
    child.stdin.end(JSON.stringify(jobsForSeed));
  });
}

async function pooled<T>(tasks: (() => Promise<T>)[], laneCount: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const lane = async (): Promise<void> => {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(laneCount, tasks.length) }, lane));
  return results;
}

function recordOutcome(db: DatabaseSync, outcome: ResilienceOutcome, label: string): number {
  const { job, result } = outcome;
  const runId = recordRun(
    db,
    {
      experiment: `colony-resilience/${job.shock}`,
      label,
      driver: "colony-rnn",
      seed: job.seed,
      ticks: job.warmupTicks + job.recoveryTicks,
      cadence: job.cadence,
      params: result.params,
      patches: [],
      summary: result.summary,
      wallMs: outcome.wallMs,
    },
    [],
    []
  );
  recordDemographySeries(db, runId, result.demography);
  recordEvolutionSeries(db, runId, result.evolution);
  return runId;
}

interface CurvePoint {
  shock: ResilienceShock;
  fraction: number;
  recovered: number;
  episodes: number;
  recoveryRate: number;
  medianRecoveryTicks: number | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
}

function curve(outcomes: ResilienceOutcome[]): CurvePoint[] {
  const groups = new Map<string, ResilienceOutcome[]>();
  for (const outcome of outcomes) {
    const key = `${outcome.job.shock}/${outcome.job.shockFraction}`;
    groups.set(key, [...(groups.get(key) ?? []), outcome]);
  }
  return [...groups.values()].map((group) => {
    const recoveredRuns = group.filter(({ result }) => result.summary.recovered === true);
    const recoveryTicks = recoveredRuns.map(({ result }) => Number(result.summary.recoveryTicks));
    return {
      shock: group[0].job.shock,
      fraction: group[0].job.shockFraction,
      recovered: recoveredRuns.length,
      episodes: group.length,
      recoveryRate: recoveredRuns.length / group.length,
      medianRecoveryTicks: median(recoveryTicks),
    };
  });
}

function profileName(config: SimConfig): string {
  if (!config.mortality && !config.workerReproduction && !config.larvalRearing) return "untreated";
  return "configured";
}

/** Run and persist the reusable colony resilience curve. */
export async function runColonyResilience(flags: Flags): Promise<void> {
  const plannedJobs = jobs(flags);
  const laneCount = intFlag(flags, "jobs", Math.min(4, Math.max(1, os.cpus().length - 1)));
  const label = flag(flags, "label", profileName(plannedJobs[0][0].config));
  const started = Date.now();
  const outcomes = (
    await pooled(
      plannedJobs.map((jobsForSeed) => () => execute(jobsForSeed)),
      laneCount
    )
  ).flat();
  const db = openLedger();
  const runIds = outcomes.map((outcome) => recordOutcome(db, outcome, label));
  const points = curve(outcomes);
  const cohortRunId = recordRun(
    db,
    {
      experiment: "colony-resilience/cohort",
      label,
      driver: "colony-rnn",
      seed: 0,
      ticks: plannedJobs[0][0].warmupTicks + plannedJobs[0][0].recoveryTicks,
      cadence: plannedJobs[0][0].cadence,
      params: {
        seeds: plannedJobs.map(([job]) => job.seed),
        config: plannedJobs[0][0].config,
        jobs: laneCount,
      },
      patches: [],
      summary: { curve: points, episodeRunIds: runIds },
      wallMs: Date.now() - started,
    },
    [],
    []
  );
  console.log(`[run ${cohortRunId}] ${label} colony resilience ${JSON.stringify(points)}`);
}

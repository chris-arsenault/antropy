import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENOME_LENGTH, WEIGHT_COUNT } from "../../src/sim/controller/rnn";
import { createRng, randNormal } from "../../src/sim/rng";
import { type ColonyEnergyVerdict } from "../colonyEnergyWorker";
import {
  profilePatches,
  summarizeControllerPopulation,
  type ControllerEnergyResult,
  type EconomyProfile,
} from "../lib/colonyEconomy";
import { flag, intFlag, seedsOf, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKER = path.join(ROOT, "colonyEnergyWorker.ts");

interface ControllerCandidate {
  source: string;
  vector: Float32Array;
}

interface WorkerJob {
  vector?: number[];
  worldSeeds: number[];
  ticks: number;
  patches: string[];
  policy: "programmed" | "rnn";
}

function numbers(raw: string): number[] {
  return raw.split(",").filter(Boolean).map(Number);
}

function parseProfiles(flags: Flags): EconomyProfile[] {
  const specs = flags.values.get("profile") ?? ["baseline:1:1:1"];
  return specs.map((spec) => {
    const [
      name,
      energyScale,
      workScale,
      signalScale,
      foodDensityScale = "1",
      foodScentScale = "1",
    ] = spec.split(":");
    const profile = {
      name,
      energyScale: Number(energyScale),
      workScale: Number(workScale),
      signalScale: Number(signalScale),
      foodDensityScale: Number(foodDensityScale),
      foodScentScale: Number(foodScentScale),
    };
    const scales = [
      profile.energyScale,
      profile.workScale,
      profile.signalScale,
      profile.foodDensityScale,
      profile.foodScentScale,
    ];
    if (!name || scales.some((value) => value <= 0)) {
      throw new Error(
        `profile must be name:energyScale:workScale:signalScale[:foodDensityScale:foodScentScale]: ${spec}`
      );
    }
    return profile;
  });
}

function loadRunVector(runId: number): Float32Array {
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(runId) as
    { summary: string } | undefined;
  const vector = row ? (JSON.parse(row.summary) as { vector?: number[] }).vector : undefined;
  if (vector?.length !== GENOME_LENGTH) throw new Error(`run ${runId} has no controller vector`);
  return Float32Array.from(vector);
}

function perturbations(flags: Flags): ControllerCandidate[] {
  const count = intFlag(flags, "perturb-count", 0);
  if (count === 0) return [];
  const runId = intFlag(flags, "perturb-run", 0);
  if (runId === 0) throw new Error("--perturb-run is required when --perturb-count is nonzero");
  const sigmas = numbers(flag(flags, "perturb-sigmas", "0.01,0.03,0.06"));
  const base = loadRunVector(runId);
  const rng = createRng(intFlag(flags, "perturb-seed", 10_100));
  return sigmas.flatMap((sigma) =>
    Array.from({ length: count }, (_, sample) => {
      const vector = Float32Array.from(base);
      for (let locus = 0; locus < WEIGHT_COUNT; locus++) {
        vector[locus] += randNormal(rng) * sigma;
      }
      return { source: `run-${runId}-sigma-${sigma}-sample-${sample}`, vector };
    })
  );
}

function controllerCandidates(flags: Flags): ControllerCandidate[] {
  const runIds = numbers(flag(flags, "controller-runs", "824,833,834,851,899,901,903,904,905"));
  return [
    ...runIds.map((runId) => ({ source: `run-${runId}`, vector: loadRunVector(runId) })),
    ...perturbations(flags),
  ];
}

function runWorker(job: WorkerJob): Promise<ColonyEnergyVerdict> {
  return new Promise((resolve, reject) => {
    // Harness-only process fan-out; no shell or production execution.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn("pnpm", ["exec", "tsx", WORKER], {
      cwd: ROOT,
      stdio: ["pipe", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (data: Buffer) => (output += data.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(JSON.parse(output) as ColonyEnergyVerdict);
      else reject(new Error(`colony energy worker exited ${code}`));
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

async function measureProfile(
  profile: EconomyProfile,
  controllers: ControllerCandidate[],
  worldSeeds: number[],
  ticks: number,
  jobs: number
): Promise<{ programmed: ColonyEnergyVerdict; controllers: ControllerEnergyResult[] }> {
  const patches = profilePatches(profile);
  const programmedTask = () => runWorker({ policy: "programmed", worldSeeds, ticks, patches });
  const tasks = controllers.map(
    ({ vector }) =>
      () =>
        runWorker({
          policy: "rnn",
          vector: Array.from(vector),
          worldSeeds,
          ticks,
          patches,
        })
  );
  const [programmed, ...verdicts] = await pooled([programmedTask, ...tasks], jobs);
  return {
    programmed,
    controllers: controllers.map(({ source }, index) => ({ source, verdict: verdicts[index] })),
  };
}

/** Map world-energy support across a fixed distribution of recurrent controllers. */
export async function runCalibrateColonyEconomy(flags: Flags): Promise<void> {
  const ticks = intFlag(flags, "ticks", 1200);
  const worldSeeds = seedsOf(flags, "9800,9801,9802");
  const jobs = intFlag(flags, "jobs", Math.min(8, Math.max(2, os.cpus().length - 2)));
  const profiles = parseProfiles(flags);
  const controllers = controllerCandidates(flags);
  const label = flag(flags, "label", "");
  const db = openLedger();
  for (const profile of profiles) {
    const started = Date.now();
    const measured = await measureProfile(profile, controllers, worldSeeds, ticks, jobs);
    const population = summarizeControllerPopulation(measured.controllers, worldSeeds.length);
    const wallMs = Date.now() - started;
    const patches = profilePatches(profile);
    const runId = recordRun(
      db,
      {
        experiment: "calibrate-colony-economy",
        label,
        driver: "fixed-rnn-distribution",
        seed: intFlag(flags, "perturb-seed", 10_100),
        ticks,
        cadence: 0,
        params: {
          profile,
          worldSeeds,
          controllerSources: controllers.map(({ source }) => source),
          jobs,
        },
        patches,
        summary: { programmed: measured.programmed, population, controllers: measured.controllers },
        wallMs,
      },
      [],
      []
    );
    console.log(
      `[run ${runId}] ${profile.name}: programmed=${measured.programmed.medianBalance.toFixed(3)}` +
        ` supported=${population.supportedCount}/${population.controllerCount}` +
        ` controller-median=${population.medianControllerBalance.toFixed(3)}` +
        ` correlation=${population.gatheringBalanceCorrelation.toFixed(3)}`
    );
  }
}

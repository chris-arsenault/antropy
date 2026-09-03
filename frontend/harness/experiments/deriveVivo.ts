import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backboneVector, GENOME_LENGTH, WEIGHT_COUNT } from "../../src/sim/controller/rnn";
import { createRng, randNormal, type Rng } from "../../src/sim/rng";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { bake } from "./derive";

/**
 * In-vivo seed derivation (the recorded fix for the probe-proxy gap,
 * ledger runs 23-34): candidate vectors are evaluated as the seed base of
 * REAL colony runs — seed() noise applies as in production, so the
 * objective is the shipped distribution's colony performance, not a probe
 * proxy. Evaluations fan out across worker processes.
 */
const WORKER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "vivoWorker.ts");

interface Verdict {
  fitness: number;
  workerDays: number;
  merit: number;
  stockpile: number;
}

function evalOnce(vector: Float32Array, worldSeed: number, ticks: number): Promise<Verdict> {
  return new Promise((resolve, reject) => {
    // Dev-tool process fan-out; the harness never runs in production.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn("pnpm", ["exec", "tsx", WORKER], {
      cwd: path.join(path.dirname(WORKER), ".."),
      stdio: ["pipe", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.on("data", (d: Buffer) => (out += d.toString()));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`worker exited ${code}`));
        return;
      }
      resolve(JSON.parse(out) as Verdict);
    });
    child.stdin.write(JSON.stringify({ vector: Array.from(vector), worldSeed, ticks }));
    child.stdin.end();
  });
}

/** Bounded-concurrency pool over evaluation thunks. */
async function pooled<T>(thunks: (() => Promise<T>)[], jobs: number): Promise<T[]> {
  const results: T[] = new Array(thunks.length);
  let next = 0;
  const lane = async () => {
    while (next < thunks.length) {
      const i = next++;
      results[i] = await thunks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(jobs, thunks.length) }, lane));
  return results;
}

function perturb(mean: Float32Array, sigma: number, rng: Rng): Float32Array {
  const candidate = Float32Array.from(mean);
  for (let i = 0; i < WEIGHT_COUNT; i++) {
    candidate[i] += randNormal(rng) * sigma;
  }
  return candidate;
}

export async function runDeriveVivo(flags: Flags): Promise<void> {
  const generations = intFlag(flags, "generations", 25);
  const lambda = intFlag(flags, "lambda", 12);
  const mu = intFlag(flags, "mu", 3);
  const ticks = intFlag(flags, "ticks", 2000);
  const jobs = intFlag(flags, "jobs", Math.max(2, os.cpus().length - 2));
  const worldSeeds = flag(flags, "world-seeds", "42,4200").split(",").map(Number);
  const rng = createRng(intFlag(flags, "seed", 555));
  let sigma = 0.2;

  const evaluate = async (vector: Float32Array): Promise<number> => {
    const verdicts = await Promise.all(worldSeeds.map((ws) => evalOnce(vector, ws, ticks)));
    return verdicts.reduce((a, v) => a + v.fitness, 0) / verdicts.length;
  };

  let mean = backboneVector();
  let bestMean = Float32Array.from(mean);
  let bestFitness = await evaluate(mean);
  const trajectory: number[] = [bestFitness];
  console.log(`gen 0 (backbone): fitness=${bestFitness.toFixed(2)} (jobs=${jobs})`);

  const start = Date.now();
  for (let gen = 1; gen <= generations; gen++) {
    const candidates = Array.from({ length: lambda }, () => perturb(mean, sigma, rng));
    const fitnesses = await pooled(
      candidates.map((c) => () => evaluate(c)),
      jobs
    );
    const ranked = candidates
      .map((candidate, i) => ({ candidate, fitness: fitnesses[i] }))
      .sort((a, b) => b.fitness - a.fitness);
    const next = new Float32Array(GENOME_LENGTH);
    for (const { candidate } of ranked.slice(0, mu)) {
      for (let i = 0; i < GENOME_LENGTH; i++) {
        next[i] += candidate[i] / mu;
      }
    }
    mean = next;
    const meanFitness = await evaluate(mean);
    trajectory.push(meanFitness);
    if (meanFitness > bestFitness) {
      bestFitness = meanFitness;
      bestMean = Float32Array.from(mean);
    }
    sigma *= 0.97;
    console.log(
      `gen ${gen}: mean=${meanFitness.toFixed(2)} best-mean=${bestFitness.toFixed(2)} top=${ranked[0].fitness.toFixed(2)} sigma=${sigma.toFixed(3)}`
    );
  }

  console.log(`baked ${bake(bestMean)}`);
  const runId = recordRun(
    openLedger(),
    {
      experiment: "derive-vivo",
      label: flag(flags, "label", ""),
      driver: "es-vivo",
      seed: intFlag(flags, "seed", 555),
      ticks,
      cadence: 0,
      params: { lambda, mu, generations, worldSeeds, jobs },
      patches: [],
      summary: { finalFitness: bestFitness, trajectory } as unknown as Record<string, unknown>,
      wallMs: Date.now() - start,
    },
    [],
    []
  );
  console.log(
    `[run ${runId}] derive-vivo: fitness ${trajectory[0].toFixed(2)} -> ${bestFitness.toFixed(2)}`
  );
}

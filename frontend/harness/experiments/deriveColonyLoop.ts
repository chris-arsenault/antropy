import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  colonySeedLocusGroups,
  colonySeedVector,
  GENOME_LENGTH,
} from "../../src/sim/controller/rnn";
import { createRng, randNormal, type Rng } from "../../src/sim/rng";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

const WORKER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "colonyLoopVivoWorker.ts"
);

interface Verdict {
  fitness: number;
  runs: Record<string, unknown>[];
}

interface Candidate {
  vector: Float32Array;
  verdict: Verdict;
}

function startingVector(flags: Flags): { vector: Float32Array; parentRun: number | null } {
  if (!flags.values.has("start-run")) {
    return { vector: colonySeedVector(), parentRun: null };
  }
  const parentRun = intFlag(flags, "start-run", 0);
  const row = openLedger().prepare("SELECT summary FROM runs WHERE id = ?").get(parentRun) as
    { summary: string } | undefined;
  if (!row) throw new Error(`unknown start run ${parentRun}`);
  const summary = JSON.parse(row.summary) as { vector?: number[] };
  if (summary.vector?.length !== GENOME_LENGTH) {
    throw new Error(`run ${parentRun} has no Seed E vector`);
  }
  return { vector: Float32Array.from(summary.vector), parentRun };
}

function evaluate(vector: Float32Array, worldSeeds: number[], ticks: number): Promise<Verdict> {
  return new Promise((resolve, reject) => {
    // Dev-tool process fan-out; the harness never runs in production.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn("pnpm", ["exec", "tsx", WORKER], {
      cwd: path.join(path.dirname(WORKER), ".."),
      stdio: ["pipe", "pipe", "inherit"],
    });
    let output = "";
    child.stdout.on("data", (data: Buffer) => (output += data.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(JSON.parse(output) as Verdict);
      else reject(new Error(`colony-loop worker exited ${code}`));
    });
    child.stdin.end(JSON.stringify({ vector: Array.from(vector), worldSeeds, ticks }));
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

function perturb(mean: Float32Array, groups: number[][], sigma: number, rng: Rng): Float32Array {
  const vector = Float32Array.from(mean);
  for (const group of groups) {
    const factor = Math.exp(randNormal(rng) * sigma);
    for (const locus of group) vector[locus] = mean[locus] * factor;
  }
  return vector;
}

function average(candidates: Candidate[], count: number): Float32Array {
  const vector = new Float32Array(GENOME_LENGTH);
  for (const candidate of candidates.slice(0, count)) {
    for (let locus = 0; locus < GENOME_LENGTH; locus++) {
      vector[locus] += candidate.vector[locus] / count;
    }
  }
  return vector;
}

function bake(vector: Float32Array, runId: number): string {
  const artifact = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "src",
    "sim",
    "controller",
    "seeds",
    "colony.ts"
  );
  const values = Array.from(vector)
    .map((value) => value.toFixed(6))
    .join(",\n  ");
  writeFileSync(
    artifact,
    "/**\n" +
      ` * GENERATED ARTIFACT: Appendix E colony-loop derivation, ledger run ${runId}.\n` +
      " * The harness preserves the hand-written Seed E topology and signs while\n" +
      " * deriving integration magnitudes across randomized authored nests.\n" +
      " * Do not edit by hand; regenerate with `pnpm harness derive-colony-loop`.\n" +
      " */\n" +
      "// prettier-ignore\n" +
      `export const COLONY_SEED: number[] = [\n  ${values},\n];\n`
  );
  return artifact;
}

export async function runDeriveColonyLoop(flags: Flags): Promise<void> {
  const generations = intFlag(flags, "generations", 10);
  const lambda = intFlag(flags, "lambda", 10);
  const mu = intFlag(flags, "mu", 3);
  const ticks = intFlag(flags, "ticks", 1000);
  const jobs = intFlag(flags, "jobs", Math.max(2, os.cpus().length - 2));
  const worldSeeds = flag(flags, "world-seeds", "9100,9101,9102,9103,9104").split(",").map(Number);
  const rngSeed = intFlag(flags, "seed", 9200);
  const rng = createRng(rngSeed);
  const groups = colonySeedLocusGroups();
  let sigma = Number(flag(flags, "sigma", "0.35"));
  const start = startingVector(flags);
  let mean = start.vector;
  let best = { vector: Float32Array.from(mean), verdict: await evaluate(mean, worldSeeds, ticks) };
  const trajectory = [best.verdict.fitness];
  const started = Date.now();
  console.log(`gen 0: fitness=${best.verdict.fitness.toFixed(2)} groups=${groups.length}`);

  for (let generation = 1; generation <= generations; generation++) {
    const vectors = Array.from({ length: lambda }, () => perturb(mean, groups, sigma, rng));
    const verdicts = await pooled(
      vectors.map((vector) => () => evaluate(vector, worldSeeds, ticks)),
      jobs
    );
    const ranked = vectors
      .map((vector, index) => ({ vector, verdict: verdicts[index] }))
      .sort((a, b) => b.verdict.fitness - a.verdict.fitness);
    const candidateMean = average(ranked, mu);
    const meanVerdict = await evaluate(candidateMean, worldSeeds, ticks);
    const generationBest =
      meanVerdict.fitness >= ranked[0].verdict.fitness
        ? { vector: candidateMean, verdict: meanVerdict }
        : ranked[0];
    if (generationBest.verdict.fitness > best.verdict.fitness) {
      best = { vector: Float32Array.from(generationBest.vector), verdict: generationBest.verdict };
    }
    mean = Float32Array.from(best.vector);
    trajectory.push(best.verdict.fitness);
    sigma *= 0.94;
    console.log(
      `gen ${generation}: best=${best.verdict.fitness.toFixed(2)} ` +
        `top=${ranked[0].verdict.fitness.toFixed(2)} sigma=${sigma.toFixed(3)}`
    );
  }

  const runId = recordRun(
    openLedger(),
    {
      experiment: "derive-colony-loop",
      label: flag(flags, "label", ""),
      driver: "es-seed-e",
      seed: rngSeed,
      ticks,
      cadence: 0,
      params: { generations, lambda, mu, worldSeeds, jobs, groups, parentRun: start.parentRun },
      patches: [],
      summary: {
        finalFitness: best.verdict.fitness,
        trajectory,
        runs: best.verdict.runs,
        vector: Array.from(best.vector),
      },
      wallMs: Date.now() - started,
    },
    [],
    []
  );
  console.log(
    `[run ${runId}] derive-colony-loop ${trajectory[0].toFixed(2)} -> ${best.verdict.fitness.toFixed(2)}`
  );
  if (flag(flags, "bake", "false") === "true") console.log(`baked ${bake(best.vector, runId)}`);
}

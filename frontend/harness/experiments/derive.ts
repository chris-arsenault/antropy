import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GENOME_LENGTH, WEIGHT_COUNT, backboneVector } from "../../src/sim/controller/rnn";
import { createRng, randNormal, type Rng } from "../../src/sim/rng";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";
import { fitness, probeVector } from "./probes";

/**
 * Seed derivation (ADR-0010, §B.9.3): an in-house diagonal ES optimizes
 * the behavioral weight loci (never the physical-trait loci, Rule 9)
 * against the probe suite; the best-scoring mean over the whole run is
 * baked into src/sim/controller/seeds/forager.ts, which seed() uses as
 * its mean. Evolution owns it from tick one.
 */
function perturb(mean: Float32Array, sigma: number, rng: Rng): Float32Array {
  const candidate = Float32Array.from(mean);
  for (let i = 0; i < WEIGHT_COUNT; i++) {
    candidate[i] += randNormal(rng) * sigma;
  }
  return candidate;
}

/** seed() ships mean + per-individual noise, so score candidates as the
 * average over themselves and noisy offspring at the real seed-noise
 * scale — optimizing the distribution seed() actually produces. */
const SEED_NOISE_SCALE = 0.15;

function robustFitness(candidate: Float32Array, rng: Rng, offspring: number): number {
  let total = fitness(probeVector(candidate));
  for (let k = 0; k < offspring; k++) {
    total += fitness(probeVector(perturb(candidate, SEED_NOISE_SCALE, rng)));
  }
  return total / (offspring + 1);
}

export function bake(mean: Float32Array): string {
  const artifact = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "src",
    "sim",
    "controller",
    "seeds",
    "forager.ts"
  );
  const body =
    "/**\n * GENERATED ARTIFACT (ADR-0010): baked founder weights derived by the\n" +
    " * harness ES pipeline (`pnpm harness derive`). Do not edit by hand.\n */\n" +
    `export const FORAGER_SEED: number[] | null = [\n  ${Array.from(mean)
      .map((v) => v.toFixed(6))
      .join(",\n  ")},\n];\n`;
  writeFileSync(artifact, body);
  return artifact;
}

export function runDerive(flags: Flags): void {
  const generations = intFlag(flags, "generations", 70);
  const lambda = intFlag(flags, "lambda", 24);
  const mu = intFlag(flags, "mu", 6);
  const offspring = intFlag(flags, "offspring", 2);
  const rng = createRng(intFlag(flags, "seed", 1234));
  let sigma = 0.25;
  let mean = backboneVector();
  let bestMean = Float32Array.from(mean);
  let bestFitness = robustFitness(mean, rng, offspring);
  const trajectory: number[] = [bestFitness];
  console.log(`gen 0 (backbone): fitness=${bestFitness.toFixed(3)}`);

  const start = Date.now();
  for (let gen = 1; gen <= generations; gen++) {
    const scored = Array.from({ length: lambda }, () => {
      const candidate = perturb(mean, sigma, rng);
      return { candidate, fitness: robustFitness(candidate, rng, offspring) };
    }).sort((a, b) => b.fitness - a.fitness);
    const next = new Float32Array(GENOME_LENGTH);
    for (const { candidate } of scored.slice(0, mu)) {
      for (let i = 0; i < GENOME_LENGTH; i++) {
        next[i] += candidate[i] / mu;
      }
    }
    mean = next;
    const meanFitness = robustFitness(mean, rng, offspring);
    trajectory.push(meanFitness);
    if (meanFitness > bestFitness) {
      bestFitness = meanFitness;
      bestMean = Float32Array.from(mean);
    }
    sigma *= 0.985;
    if (gen % 10 === 0) {
      console.log(
        `gen ${gen}: fitness=${meanFitness.toFixed(3)} best-mean=${bestFitness.toFixed(3)} sigma=${sigma.toFixed(3)}`
      );
    }
  }

  const scores = probeVector(bestMean);
  console.log(`baked ${bake(bestMean)}`);
  console.log(`final scores: ${JSON.stringify(scores)}`);

  const runId = recordRun(
    openLedger(),
    {
      experiment: "derive",
      label: flag(flags, "label", ""),
      driver: "es",
      seed: intFlag(flags, "seed", 1234),
      ticks: generations,
      cadence: 0,
      params: { lambda, mu },
      patches: [],
      summary: { finalFitness: bestFitness, scores, trajectory } as unknown as Record<
        string,
        unknown
      >,
      wallMs: Date.now() - start,
    },
    [],
    []
  );
  console.log(
    `[run ${runId}] derive: fitness ${trajectory[0].toFixed(3)} -> ${bestFitness.toFixed(3)}`
  );
}

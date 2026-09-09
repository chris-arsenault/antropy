import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { type DirectionalModel } from "../../src/sim/controller/directionalModel";
import { type RegisteredModel } from "../../src/sim/controller/registeredModel";
import { PROGRAMMED_LIFECYCLE_CONFIG } from "../../src/sim/config";
import { ColonyOutcomePool, type OutcomeResults } from "../lib/colonyOutcomePool";
import { compareOutcomes, outcomeFitness, outcomeMutation, outcomeSeed } from "../lib/colonySearch";
import { loadColonyModel, physicsDigest, digest } from "../lib/colonyArtifacts";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

function trainerDigest(): string {
  return digest(
    ["experiments/optimizeColony", "lib/colonySearch", "lib/colonyOutcome", "lib/colonyOutcomeRun"]
      .map((file) => readFileSync(`harness/${file}.ts`, "utf8"))
      .join("\n")
  );
}

function saveRun(
  directory: string,
  generation: number,
  model: DirectionalModel | RegisteredModel,
  results: OutcomeResults,
  population: OutcomeResults[],
  params: Record<string, unknown>,
  started: number
) {
  const output = path.join(directory, `generation-${generation}.json`);
  writeFileSync(output, JSON.stringify(model));
  const summary = { retained: results, population };
  writeFileSync(output + ".report.json", JSON.stringify({ params, summary }));
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "colony-outcome-optimization",
    label: output,
    driver: "recurrent-outcome-search",
    seed: (params.seeds as number[])[0],
    ticks: params.ticks as number,
    params: { ...params, generation, modelHash: digest(JSON.stringify(model)) },
    summary,
    wallMs: Date.now() - started,
  });
  database.close();
  console.log(
    JSON.stringify({
      id,
      generation,
      output,
      ...outcomeFitness(results),
      outcomes: results.map((r) => ({
        seed: r.seed,
        warmup: params.warmup,
        queen: r.final.queenAlive,
        gains: r.gains,
        workers: r.final.workers,
      })),
    })
  );
}

export async function runOptimizeColony(flags: Flags): Promise<void> {
  const source = flag(flags, "initial", ""),
    directory = flag(flags, "output", "");
  if (!source || !directory)
    throw new Error("colony-optimize needs --initial and --output directory");
  if (existsSync(path.join(directory, "generation-0.json")))
    throw new Error("output already contains a search; choose a new directory");
  const initial = loadColonyModel(source);
  if (initial.version === 1) throw new Error("use a directional recurrent initializer");
  const seeds = seedsFlag(flags, "1,2"),
    ticks = integerFlag(flags, "ticks", 20000);
  const generations = integerFlag(flags, "generations", 8),
    pairs = integerFlag(flags, "pairs", 6);
  const jobs = integerFlag(flags, "jobs", 3),
    rngSeed = integerFlag(flags, "rng-seed", 1701);
  const scale = Number(flag(flags, "scale", "1"));
  const warmup = integerFlag(flags, "warmup", 0);
  if (![ticks, pairs, jobs, scale].every((n) => Number.isFinite(n) && n > 0) || generations < 0)
    throw new Error("invalid outcome search settings");
  mkdirSync(directory, { recursive: true });
  const pool = new ColonyOutcomePool(jobs),
    started = Date.now();
  const params = {
    seeds,
    ticks,
    generations,
    pairs,
    jobs,
    rngSeed,
    scale,
    warmup,
    initialHash: digest(JSON.stringify(initial)),
    physics: physicsDigest(),
    config: PROGRAMMED_LIFECYCLE_CONFIG,
    objective: "colony-survival-v2",
    trainerHash: trainerDigest(),
  };
  let model = initialize(initial);
  try {
    let retained = (await pool.evaluate([model], seeds, ticks, warmup))[0];
    saveRun(directory, 0, model, retained, [retained], params, started);
    for (let generation = 1; generation <= generations; generation++) {
      const generationStarted = Date.now();
      const models = Array.from({ length: pairs * 2 }, (_, i) =>
        outcomeMutation(
          model,
          rngSeed + generation * 1000 + Math.floor(i / 2),
          i % 2 ? 1 : -1,
          scale
        )
      );
      const outcomes = await pool.evaluate(models, seeds, ticks, warmup);
      let best = -1;
      outcomes.forEach((candidate, index) => {
        if (compareOutcomes(candidate, best < 0 ? retained : outcomes[best]) > 0) best = index;
      });
      if (best >= 0) {
        model = models[best];
        retained = outcomes[best];
      }
      saveRun(directory, generation, model, retained, outcomes, params, generationStarted);
      if (outcomes.every((candidate) => compareOutcomes(candidate, retained) === 0)) {
        console.log("Stopped: every candidate tied the retained colony outcomes.");
        break;
      }
    }
  } finally {
    pool.close();
  }
}

function initialize(model: DirectionalModel | RegisteredModel) {
  return model.version === 5 ? model : outcomeSeed(model);
}

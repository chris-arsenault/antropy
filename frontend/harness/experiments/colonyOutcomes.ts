import { writeFileSync } from "node:fs";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { loadColonyModel, physicsDigest, digest } from "../lib/colonyArtifacts";
import { runColonyOutcome } from "../lib/colonyOutcomeRun";
import { openLedger, recordRun } from "../lib/ledger";
import { environmentFlags } from "../lib/environmentFlags";
import { perturbColonyModel } from "../lib/learnedColony";
import { createRandomState } from "../../src/sim/random";

export function runColonyOutcomes(flags: Flags): void {
  const path = flag(flags, "model", "");
  const config = environmentFlags(flags);
  const rms = Number(flag(flags, "rms", "0")),
    mutationSeed = integerFlag(flags, "mutation-seed", 1);
  const model = outcomeModel(path, rms, mutationSeed);
  const seeds = seedsFlag(flags, "4,5,6"),
    ticks = integerFlag(flags, "ticks", 48000);
  const deprivation = integerFlag(flags, "deprivation", 0),
    started = Date.now();
  const warmup = integerFlag(flags, "warmup", 0);
  const taskClamp = readClamp(flags);
  const physics = physicsDigest();
  const results = seeds.map((seed) => {
    const result = runColonyOutcome(model, seed, ticks, deprivation, warmup, taskClamp, config);
    console.log(
      JSON.stringify({
        seed,
        warmup,
        viable: result.viable,
        score: result.score,
        gains: result.gains,
        final: result.final,
      })
    );
    return result;
  });
  const params = {
    seeds,
    ticks,
    deprivation,
    warmup,
    taskClamp,
    rms,
    mutationSeed,
    modelHash: model ? digest(JSON.stringify(model)) : null,
    physics,
    config,
    objective: "colony-survival-v2",
  };
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "colony-survival-outcomes",
    label: flag(flags, "label", path || "programmed"),
    driver: model ? "recurrent-local" : "programmed",
    seed: seeds[0],
    ticks,
    params,
    summary: { results },
    wallMs: Date.now() - started,
  });
  database.close();
  const output = flag(flags, "output", "");
  if (output) writeFileSync(output, JSON.stringify({ id, params, results }));
  console.log(`Recorded colony outcome run ${id}`);
}

function outcomeModel(path: string, rms: number, mutationSeed: number) {
  if (!Number.isFinite(rms) || rms < 0) throw new Error("invalid perturbation size");
  const model = path ? loadColonyModel(path) : null;
  if (rms === 0) return model;
  if (!model) throw new Error("perturbation requires a learned model");
  return perturbColonyModel(model, createRandomState(mutationSeed), rms);
}

function readClamp(flags: Flags): number | null {
  const text = flag(flags, "task-clamp", "");
  return text === "" ? null : Number(text);
}

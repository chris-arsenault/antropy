import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { terrainConfig } from "../src/sim/config";
import { type EnvironmentConfig } from "../src/sim/environmentConfig";
import { validateWorldCases, type ColonyWorldCase } from "./lib/colonyWorlds";
import { digest, loadColonyModel, physicsDigest } from "./lib/colonyArtifacts";
import { runColonyOutcome } from "./lib/colonyOutcomeRun";
import { openLedger, recordRun } from "./lib/ledger";

type Shape = EnvironmentConfig["nestShape"];
type Definition = readonly [Shape, number, number];

/** Declared before fitting. Layout seeds never overlap across partitions. */
export const GEOMETRY_SPLITS: Record<string, readonly Definition[]> = {
  train: [
    ["reference", 0, 1],
    ["narrow", 12013, 2],
    ["compact", 0, 3],
    ["reference", 394729, 2],
    ["narrow", 840019, 3],
    ["compact", 712447, 1],
  ],
  validation: [
    ["reference", 509687, 41],
    ["narrow", 239119, 42],
    ["compact", 978151, 43],
  ],
  test: [
    ["reference", 620171, 101],
    ["reference", 183047, 102],
    ["narrow", 467879, 101],
    ["narrow", 905233, 102],
    ["compact", 327673, 101],
    ["compact", 759557, 102],
  ],
};

export function geometryCases(split: string): readonly ColonyWorldCase[] {
  const definitions = GEOMETRY_SPLITS[split];
  if (!definitions) throw new Error("unknown geometry split");
  const base = terrainConfig("baseline");
  return validateWorldCases(
    definitions.map(([nestShape, nestSeed, seed], index) => ({
      id: index + 1,
      label: `${split}-${nestShape}-${nestSeed}-food-${seed}`,
      seed,
      config: { ...base, nestSeed, environment: { ...base.environment, nestShape } },
    }))
  );
}

function initialize(root: string): void {
  if (existsSync(root)) throw new Error("study directory already exists");
  mkdirSync(root, { recursive: true });
  for (const split of Object.keys(GEOMETRY_SPLITS))
    writeFileSync(join(root, `${split}.json`), JSON.stringify(geometryCases(split), null, 2));
  writeFileSync(
    join(root, "protocol.json"),
    JSON.stringify(
      {
        version: 1,
        objective: "colony-survival-v2",
        physics: physicsDigest(),
        ticks: 48000,
        selection: "validation viable count, then minimum physical outcome score, then mean score",
        testRule: "freeze candidate before reading test outcomes; no test-driven refitting",
        splits: GEOMETRY_SPLITS,
      },
      null,
      2
    )
  );
}

function rotateFoodSeeds(input: string, output: string, seedsText: string): void {
  if (existsSync(output)) throw new Error("world case output already exists");
  const seeds = seedsText.split(",").map(Number);
  if (!seeds.length || seedsText.split(",").some((value) => !value.trim()))
    throw new Error("food seeds must be a nonempty comma-separated list");
  const worlds = validateWorldCases(JSON.parse(readFileSync(input, "utf8")));
  const rotated = validateWorldCases(
    worlds.map((entry, index) => {
      const seed = seeds[index % seeds.length];
      return { ...entry, seed, label: `${entry.label.replace(/-food-\d+$/, "")}-food-${seed}` };
    })
  );
  writeFileSync(output, JSON.stringify(rotated, null, 2));
}

function evaluate(worldsPath: string, modelPath: string, output: string): void {
  if (existsSync(output)) throw new Error("evaluation output already exists");
  const worlds = validateWorldCases(JSON.parse(readFileSync(worldsPath, "utf8")));
  const model = modelPath === "programmed" ? null : loadColonyModel(modelPath);
  const params = {
    worlds,
    modelPath,
    modelHash: model ? digest(JSON.stringify(model)) : null,
    physics: physicsDigest(),
    ticks: 48000,
    objective: "colony-survival-v2",
  };
  const results = [];
  for (const entry of worlds) {
    const started = Date.now();
    const outcome = runColonyOutcome(model, entry.seed, params.ticks, 0, 0, null, entry.config);
    const database = openLedger();
    const id = recordRun(database, {
      experiment: "nest-generalization",
      label: `${output}:${entry.label}`,
      driver: model ? "recurrent-local" : "programmed",
      seed: entry.seed,
      ticks: params.ticks,
      params: { ...params, worlds: [entry] },
      summary: outcome,
      wallMs: Date.now() - started,
    });
    database.close();
    results.push({ id, world: entry, ...outcome });
    writeFileSync(
      output,
      JSON.stringify({ params, complete: results.length === worlds.length, results })
    );
    console.log(
      JSON.stringify({
        id,
        label: entry.label,
        viable: outcome.viable,
        score: outcome.score,
        final: outcome.final,
        seconds: (Date.now() - started) / 1000,
      })
    );
  }
}

if (process.argv[1]?.endsWith("nestGeneralization.ts")) {
  const [command, first, second, third] = process.argv.slice(2);
  if (command === "init" && first) initialize(first);
  else if (command === "rotate-food" && first && second && third)
    rotateFoodSeeds(first, second, third);
  else if (command === "evaluate" && first && second && third) evaluate(first, second, third);
  else
    throw new Error(
      "usage: nestGeneralization.ts init DIR | rotate-food INPUT OUTPUT SEEDS | evaluate WORLDS MODEL_OR_programmed OUTPUT"
    );
}

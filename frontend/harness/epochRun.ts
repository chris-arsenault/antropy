import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { createWorld } from "../src/sim/world";
import { DEFAULT_CONFIG, type Config } from "../src/sim/config";
import { foodEpoch } from "../src/sim/foodEpochs";
import { checkpointToJson } from "../src/persist/checkpoint";
import { noteExecution } from "../src/persist/provenance";
import { populationPoint } from "../src/ui/populationHistory";
import { type World } from "../src/sim/types";
import { measure, sourceDigest } from "./lib/bacteriaRun";
import { openLedger, recordRun } from "./lib/ledger";
import { parseFlags, flag, integerFlag } from "./lib/flags";
import { controller } from "../src/sim/controller";

const PHASE = 50000,
  TICKS = PHASE * 3;
function identity() {
  return createHash("sha256")
    .update(sourceDigest())
    .update(readFileSync("harness/epochRun.ts"))
    .digest("hex");
}
function prepare() {
  const flags = parseFlags(process.argv.slice(2)),
    seed = integerFlag(flags, "seed", 101);
  const frozen = flag(flags, "frozen", "false") === "true",
    label = `${frozen ? "frozen" : "live"}-${seed}`;
  const directory = join(flag(flags, "output", "harness/artifacts/epochs-2026-09-11"), label);
  if (existsSync(directory))
    throw new Error("Run directory already exists; evidence is append-only");
  const config: Config = {
    ...DEFAULT_CONFIG,
    foodEpochs: { phaseTicks: PHASE, shares: [0.8, 0.2] },
    foodZones: undefined,
  };
  if (frozen) {
    config.mutationRate = 0;
    config.physicalMutationRate = 0;
    config.learningRetention = 0;
  }
  const world = createWorld(seed, config),
    digest = identity();
  mkdirSync(directory, { recursive: true });
  const manifest = {
    label,
    seed,
    frozen,
    ticks: TICKS,
    cadence: 1000,
    config,
    sourceDigest: digest,
    sourceDigestAfter: "",
    started: new Date().toISOString(),
    status: "running",
  };
  const save = (name: string, data: unknown) =>
    writeFileSync(join(directory, name), JSON.stringify(data));
  save("manifest.json", manifest);
  writeFileSync(join(directory, "initial.json"), checkpointToJson(world));
  noteExecution(world, `headless:${digest}`);
  return { world, directory, manifest, save };
}
function observation(world: World) {
  return {
    ...populationPoint(world),
    epoch: foodEpoch(world.config.foodEpochs!, world.tick),
    ledger: { ...world.ledger },
    cells: world.cells.map((c) => ({ id: c.id, born: c.born, generation: c.generation })),
    sources: world.sources.map((s) => ({ ...s })),
    environmentRng: world.environmentRng.value,
  };
}
function run() {
  const { world, directory, manifest, save } = prepare(),
    observations = [observation(world)];
  try {
    const result = measure(world, TICKS, 1000, {
      spatial: false,
      progress: true,
      onSample: (w) => {
        observations.push(observation(w));
        if (w.tick % PHASE === 0)
          writeFileSync(join(directory, `checkpoint-${w.tick}.json`), checkpointToJson(w));
        if (w.tick % 5000 === 0)
          save("progress.json", {
            tick: w.tick,
            population: w.cells.length,
            time: new Date().toISOString(),
          });
      },
    });
    manifest.sourceDigestAfter = identity();
    if (manifest.sourceDigest !== manifest.sourceDigestAfter)
      throw new Error("Source changed during run");
    const db = openLedger();
    const id = recordRun(db, {
      experiment: "food-epochs",
      label: manifest.label,
      driver: controller.id,
      seed: world.seed,
      ticks: world.tick,
      params: manifest,
      summary: result.final,
      wallMs: result.wallMs,
    });
    db.close();
    save("result.json", { ...result, observations, ledgerId: id });
    writeFileSync(join(directory, "checkpoint.json"), checkpointToJson(world));
    manifest.status = "complete";
    console.log(
      JSON.stringify({ run: manifest.label, tick: world.tick, population: world.cells.length, id })
    );
  } catch (error) {
    manifest.status = "failed";
    throw error;
  } finally {
    save("manifest.json", manifest);
  }
}
run();

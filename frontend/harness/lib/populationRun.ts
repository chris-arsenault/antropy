/** Current-default population comparison; no inherited winner selection or world tuning. */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG } from "../../src/sim/config";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { noteExecution } from "../../src/persist/provenance";
import { populationPoint } from "../../src/ui/populationHistory";
import { type World } from "../../src/sim/types";
import { measure, sourceDigest } from "./bacteriaRun";
import { openLedger, recordRun } from "./ledger";
import { parseFlags, flag, integerFlag } from "./flags";
import { controller } from "../../src/sim/controller";

function observation(world: World) {
  return {
    ...populationPoint(world),
    cells: world.cells.map((c) => ({
      id: c.id,
      genome: c.genome,
      lineage: c.lineage,
      generation: c.generation,
      born: c.born,
    })),
    ledger: { ...world.ledger },
  };
}

function configuration(frozen: boolean) {
  const config = { ...DEFAULT_CONFIG };
  if (frozen) {
    config.mutationRate = 0;
    config.physicalMutationRate = 0;
    config.learningRetention = 0;
  }
  return config;
}

function run() {
  const flags = parseFlags(process.argv.slice(2)),
    seed = integerFlag(flags, "seed", 101);
  const frozen = flag(flags, "frozen", "false") === "true";
  const label = `${frozen ? "frozen" : "live"}-${seed}`;
  const directory = join(
    flag(flags, "output", "harness/artifacts/population-50k-2026-09-11"),
    label
  );
  if (existsSync(directory)) throw new Error("Choose a new output; evidence is append-only");
  const config = configuration(frozen);
  const world = createWorld(seed, config),
    digest = sourceDigest();
  mkdirSync(directory, { recursive: true });
  const save = (name: string, value: unknown) =>
    writeFileSync(join(directory, name), JSON.stringify(value));
  const manifest = {
    label,
    seed,
    frozen,
    ticks: 50000,
    cadence: 500,
    sourceDigest: digest,
    config,
    started: new Date().toISOString(),
    status: "running",
    sourceDigestAfter: "",
  };
  save("manifest.json", manifest);
  writeFileSync(join(directory, "initial.json"), checkpointToJson(world));
  noteExecution(world, `headless:${digest}`);
  const observations = [observation(world)];
  try {
    const result = measure(world, 50000, 500, {
      spatial: false,
      progress: true,
      onSample: (w) => {
        observations.push(observation(w));
        if (w.tick === 25000) writeFileSync(join(directory, "midpoint.json"), checkpointToJson(w));
      },
    });
    manifest.sourceDigestAfter = sourceDigest();
    if (digest !== manifest.sourceDigestAfter) throw new Error("Source changed during run");
    const db = openLedger();
    const id = recordRun(db, {
      experiment: "population-50k",
      label,
      driver: controller.id,
      seed,
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
      JSON.stringify({
        label,
        id,
        tick: world.tick,
        population: world.cells.length,
        wallMs: result.wallMs,
      })
    );
  } catch (error) {
    manifest.status = "failed";
    throw error;
  } finally {
    save("manifest.json", manifest);
  }
}
run();

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEngine, captureEngine } from "../numerical/engine";
import { measureOperating, measureStorage } from "../numerical/performance";
import { checkpointSource } from "./checkpointSource";
import { flag, integerFlag, type Flags } from "./flags";
import { openLedger, recordRun } from "./ledger";

/** Profile the actual saved/default world; the separate capacity runner supplies varied synthetic populations. */
export async function runChemistryPerformance(flags: Flags): Promise<void> {
  if (flags.values.has("load-cells"))
    throw new Error(
      "Retired clone-based load. Use bacteria-capacity for the registered varied 2000-cell load."
    );
  const output = flag(flags, "output", "harness/artifacts/chemistry-performance"),
    path = flag(flags, "checkpoint", "");
  const ticks = integerFlag(flags, "ticks", path ? 30 : 100),
    wall = integerFlag(flags, "wall-seconds", 30);
  validateBudget(ticks, wall);
  mkdirSync(output);
  const engine = await loadEngine(),
    source = path ? await checkpointSource(engine, path) : null,
    world = source?.world ?? engine.create();
  const binaryDigest = captureEngine(output, engine);
  try {
    writeFileSync(join(output, "initial.bin"), world.snapshot());
    const timing = measureOperating(world, ticks, wall),
      storage = measureStorage(engine, world),
      { saved, ...storageMetrics } = storage;
    writeFileSync(join(output, "final.bin"), saved);
    const params = {
      schemaVersion: 3,
      sourceDigest: engine.sourceDigest,
      binaryDigest,
      source: source?.provenance ?? null,
      registration: "docs/design/chemistry/numerical-engine.md",
      ticks,
      wallSeconds: wall,
    };
    const summary = { ...timing, storage: storageMetrics },
      db = openLedger();
    try {
      const id = recordRun(db, {
        experiment: "chemistry-performance",
        label: "Bounded computation, census, inspection and packed render preparation",
        driver: "wasm",
        seed: world.command<{ seed: number }>("definition").seed,
        ticks: timing.steps,
        params,
        summary,
        wallMs: timing.wallMs,
      });
      writeFileSync(
        join(output, "report.json"),
        JSON.stringify({ id, ...params, ...summary }, null, 2)
      );
      console.log(JSON.stringify({ id, ...summary }));
    } finally {
      db.close();
    }
  } finally {
    world.dispose();
  }
}

function validateBudget(ticks: number, wall: number) {
  if (ticks < 1 || ticks > 300 || wall < 1 || wall > 60)
    throw new Error("Performance budget is 1–300 ticks and at most 60 seconds");
}

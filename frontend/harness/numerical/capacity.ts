import { mkdirSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating, measureStorage } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";
import { type Engine } from "../../src/engine/client";

const standardWorkloads = [
  [48, false],
  [2000, false],
  [2000, true],
] as const;

/** Fixed registered 48/2000/2000-growth workloads; no horizon expansion. */
export async function runCapacity(
  output: string,
  supplied?: Engine,
  workloads: readonly (readonly [number, boolean])[] = standardWorkloads
) {
  mkdirSync(output);
  const engine = supplied ?? (await loadEngine()),
    wasmDigest = captureEngine(output, engine),
    results: unknown[] = [],
    database = openLedger();
  try {
    for (const [population, growth] of workloads) {
      const world = engine.create(101, { founders: 0, sourceCount: 0, sourceSpecies: [] }),
        name = `${population}${growth ? "-growth" : ""}`;
      try {
        world.command("loadFixture", { population, growth });
        writeFileSync(`${output}/${name}-initial.antropy`, world.snapshot());
        world.step(10);
        const timing = measureOperating(world, 100, 60),
          storage = measureStorage(engine, world);
        writeFileSync(`${output}/${name}-final.antropy`, storage.saved);
        const storageMetrics = {
          saveMs: storage.saveMs,
          restoreMs: storage.restoreMs,
          checkpointBytes: storage.checkpointBytes,
          continuationMatches: storage.continuationMatches,
          memoryBytes: storage.memoryBytes,
        };
        const result = { wasmDigest, population, growth, ...timing, ...storageMetrics };
        const id = recordRun(database, {
          experiment: "numerical-engine-capacity",
          label:
            "256 channels, distinct genomes, learning, packed five-layer render preparation, census and inspection; constructed load",
          driver: "wasm",
          seed: 101,
          ticks: timing.steps,
          params: {
            population,
            growth,
            warmup: 10,
            horizon: 100,
            wallCapSeconds: 60,
            width: 320,
            height: 240,
            mesh: 2,
            dt: 0.2,
            physiologyInterval: 0.8,
          },
          summary: result,
          wallMs: timing.wallMs,
        });
        results.push({ id, ...result });
        writeFileSync(`${output}/${name}.json`, JSON.stringify({ id, ...result }, null, 2));
        console.log(
          JSON.stringify({
            id,
            population,
            growth,
            steps: timing.steps,
            ticksPerSecond: timing.ticksPerSecond,
            minimumWindow: Math.min(...timing.windows),
            ...storageMetrics,
          })
        );
      } finally {
        world.dispose();
      }
    }
  } finally {
    database.close();
    writeFileSync(`${output}/report.json`, JSON.stringify(results, null, 2));
  }
}
if (process.argv[1]?.endsWith("capacity.ts")) {
  const output = process.argv[2];
  if (!output) throw new Error("Provide a new output directory");
  if (process.argv[3])
    throw new Error("Only the complete production capacity workload is supported");
  await runCapacity(output);
}

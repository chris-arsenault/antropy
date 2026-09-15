import { mkdirSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating, measureStorage } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";
import { browserSourceDigest } from "../sourceIdentity";
import { resolve } from "node:path";

/** M1 canonical compiler/core gate; ordinary World/browser integration remains separate. */
export async function runCoreCapacity(output: string, baseline = false, mesh = 2) {
  mkdirSync(output);
  const engine = await loadEngine(),
    wasmDigest = captureEngine(output, engine),
    sourceDigest = browserSourceDigest(resolve(".")),
    database = openLedger();
  try {
    for (const population of [48, 2000]) {
      const world = engine.create(101, { founders: 0, sourceCount: 0, mesh });
      try {
        world.command("loadFixture", { population, growth: false });
        writeFileSync(`${output}/${population}-initial.antropy`, world.snapshot());
        const at = performance.now();
        const result = world.command<Record<string, unknown>>("composedCapacity", { baseline });
        const wallMs = performance.now() - at;
        writeFileSync(`${output}/${population}-final.antropy`, world.snapshot());
        const summary = {
          ...result,
          wasmDigest,
          sourceDigest,
          memoryBytes: engine.memoryBytes,
          nodeVersion: process.version,
          runtimeFlags: process.execArgv,
        };
        const id = recordRun(database, {
          experiment: baseline ? "m0-diffusion-baseline" : "m1-canonical-capacity",
          label: "256 channels; bounded arithmetic proof; scope and exclusions in summary",
          driver: "wasm",
          seed: 101,
          ticks: Number(result.measuredTicks),
          params: { population, warmup: 10, horizon: 100, wallCapSeconds: 60 },
          summary,
          wallMs,
        });
        writeFileSync(`${output}/${population}.json`, JSON.stringify({ id, ...summary }, null, 2));
        console.log(
          JSON.stringify({
            id,
            population,
            meanMs: result.meanMs,
            worstWindowMs: result.worstWindowMs,
            measuredTicks: result.measuredTicks,
            stoppingReason: result.stoppingReason,
            fitsAllocation: result.fitsAllocation,
          })
        );
      } finally {
        world.dispose();
      }
    }
  } finally {
    database.close();
  }
}

/** Fixed registered 48/2000/2000-growth workloads; no horizon expansion. */
export async function runCapacity(output: string) {
  mkdirSync(output);
  const engine = await loadEngine(),
    wasmDigest = captureEngine(output, engine),
    results: unknown[] = [],
    database = openLedger();
  try {
    for (const [population, growth] of [
      [48, false],
      [2000, false],
      [2000, true],
    ] as const) {
      const world = engine.create(101, { founders: 0, sourceCount: 0 }),
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
  if (process.argv[3] === "core" || process.argv[3] === "diffusion")
    await runCoreCapacity(output, process.argv[3] === "diffusion", Number(process.argv[4] ?? 2));
  else await runCapacity(output);
}

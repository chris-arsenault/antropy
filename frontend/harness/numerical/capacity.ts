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
type Workload = readonly [number, boolean, number?, boolean?, number?];
const organizationWorkloads: readonly Workload[] = [
  [2000, false, 8, false, 100],
  [96, false, 8, true, 50],
];
const CAPACITY_LABEL =
  "256 channels, distinct genomes, learning, packed five-layer render preparation, census and inspection; constructed load";
const GEOMETRY = { width: 320, height: 240, mesh: 2, dt: 0.2, physiologyInterval: 0.8 };

function storageSummary(storage: ReturnType<typeof measureStorage>) {
  return {
    saveMs: storage.saveMs,
    restoreMs: storage.restoreMs,
    checkpointBytes: storage.checkpointBytes,
    continuationMatches: storage.continuationMatches,
    memoryBytes: storage.memoryBytes,
  };
}

/** Fixed registered 48/2000/2000-growth workloads; no horizon expansion. */
export async function runCapacity(
  output: string,
  supplied?: Engine,
  workloads: readonly Workload[] = standardWorkloads
) {
  mkdirSync(output);
  const engine = supplied ?? (await loadEngine()),
    wasmDigest = captureEngine(output, engine),
    results: unknown[] = [],
    database = openLedger();
  try {
    for (const [population, growth, programs = 4, dense = false, horizon = 100] of workloads) {
      const world = engine.create(101, { founders: 0, sourceCount: 0, sourceSpecies: [] }),
        repertoire = programs === 4 ? "" : "-" + programs + "-programs",
        name = `${population}${growth ? "-growth" : ""}${repertoire}${dense ? "-dense" : ""}`;
      try {
        world.command("loadFixture", { population, growth, programs, dense });
        writeFileSync(`${output}/${name}-initial.antropy`, world.snapshot());
        world.step(10);
        const timing = measureOperating(world, horizon, 60),
          storage = measureStorage(engine, world);
        writeFileSync(`${output}/${name}-final.antropy`, storage.saved);
        const storageMetrics = storageSummary(storage);
        const result = {
          wasmDigest,
          population,
          growth,
          programs,
          dense,
          ...timing,
          ...storageMetrics,
        };
        const id = recordRun(database, {
          experiment: "numerical-engine-capacity",
          label: CAPACITY_LABEL,
          driver: "wasm",
          seed: 101,
          ticks: timing.steps,
          params: {
            population,
            growth,
            programs,
            dense,
            warmup: 10,
            horizon,
            wallCapSeconds: 60,
            ...GEOMETRY,
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
  if (process.argv[3] && process.argv[3] !== "organization")
    throw new Error("Expected the standard panel or registered organization panel");
  await runCapacity(output, undefined, process.argv[3] ? organizationWorkloads : standardWorkloads);
}

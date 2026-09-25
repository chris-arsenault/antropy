import { mkdirSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating, measureStorage } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";
import { type Engine } from "../../src/engine/client";
import { validateAccounts } from "../lib/studyBudget";

const standardWorkloads = [
  [48, false],
  [2000, false],
  [2000, true],
] as const;
type Workload = readonly [number, boolean, number?, boolean?, number?, boolean?, boolean?];
const organizationWorkloads: readonly Workload[] = [
  [2000, false, 8, false, 100],
  [96, false, 8, true, 50],
];
const CAPACITY_LABEL =
  "256 channels, distinct genomes, learning, packed five-layer render preparation, census and inspection; constructed load";
const GEOMETRY = { width: 720, height: 540, mesh: 2, dt: 0.2, physiologyInterval: 0.8 };

function storageSummary(storage: ReturnType<typeof measureStorage>) {
  return {
    saveMs: storage.saveMs,
    restoreMs: storage.restoreMs,
    checkpointBytes: storage.checkpointBytes,
    continuationMatches: storage.continuationMatches,
    continuation: storage.continuation,
    memoryBytes: storage.memoryBytes,
  };
}

function specification([
  population,
  growth,
  programs = 4,
  dense = false,
  horizon = 100,
  optical = false,
  startup = false,
]: Workload) {
  const repertoire = programs === 4 ? "" : "-" + programs + "-programs";
  const name = `${population}${growth ? "-growth" : ""}${repertoire}${dense ? "-dense" : ""}`;
  return { population, growth, programs, dense, horizon, optical, startup, name };
}

function measureCase(engine: Engine, output: string, spec: ReturnType<typeof specification>) {
  const world = engine.create(
    101,
    spec.startup ? GEOMETRY : { ...GEOMETRY, founders: 0, sourceCount: 0, sourceSpecies: [] }
  );
  try {
    if (!spec.startup) world.command("loadFixture", spec);
    writeFileSync(`${output}/${spec.name}-initial.antropy`, world.snapshot());
    world.step(10);
    const initialWork = world.command("fieldActivity", { execution: true });
    const timing = measureOperating(world, spec.horizon, 60);
    const finalWork = world.command("fieldActivity", { execution: true });
    validateAccounts(timing.initial);
    validateAccounts(timing.summary);
    const storage = measureStorage(engine, world);
    writeFileSync(`${output}/${spec.name}-final.antropy`, storage.saved);
    return { ...spec, initialWork, finalWork, ...timing, ...storageSummary(storage) };
  } finally {
    world.dispose();
  }
}

/** Registered operating workloads; no horizon expansion. */
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
    for (const workload of workloads) {
      const spec = specification(workload);
      const result = { wasmDigest, ...measureCase(engine, output, spec) };
      const id = recordRun(database, {
        experiment: "numerical-engine-capacity",
        label: CAPACITY_LABEL,
        driver: "wasm",
        seed: 101,
        ticks: result.steps,
        params: { ...spec, warmup: 10, wallCapSeconds: 60, ...GEOMETRY },
        summary: result,
        wallMs: result.wallMs,
      });
      results.push({ id, ...result });
      writeFileSync(`${output}/${spec.name}.json`, JSON.stringify({ id, ...result }, null, 2));
      console.log(
        JSON.stringify({
          id,
          name: spec.name,
          steps: result.steps,
          ticksPerSecond: result.ticksPerSecond,
          minimumWindow: Math.min(...result.windows),
          checkpointBytes: result.checkpointBytes,
          memoryBytes: result.memoryBytes,
          continuationMatches: result.continuationMatches,
        })
      );
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

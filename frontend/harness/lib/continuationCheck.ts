import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type Definition, type ObservationState, type Summary } from "../../src/engine/types";
import { encodePackage, decodePackage } from "../../src/engine/package";
import { emptySpatial, observe } from "../../src/engine/observation";
import { loadEngine, captureEngine } from "../numerical/engine";
import { openLedger, recordRun } from "./ledger";
import { flag, type Flags } from "./flags";

const elapsed = (start: number) => performance.now() - start;
function budget(start: number) {
  if (elapsed(start) > 60000) throw new Error("Registered 60-second storage case budget reached");
}
function makeWorld(engine: Engine, name: string) {
  if (name === "default") return engine.create();
  const history = name.startsWith("ancestry-");
  const world = engine.create(101, {
    width: history ? 24 : 64,
    height: history ? 24 : 64,
    founders: 1,
    sourceCount: 0,
  });
  try {
    if (history) world.command("historyFixture", { count: Number(name.slice(9)) });
    else world.command("fieldFixture", { kind: name });
    return world;
  } catch (error) {
    world.dispose();
    throw error;
  }
}
async function packageCheck(
  engine: Engine,
  world: EngineWorld,
  observation: ObservationState,
  path: string,
  started: number
) {
  const definition = world.command<Definition>("definition"),
    summary = world.command<Summary>("summary");
  const beforeSave = performance.now(),
    snapshot = world.snapshot(),
    serializeMs = elapsed(beforeSave);
  budget(started);
  const beforeCompression = performance.now();
  const blob = await encodePackage(snapshot, {
    seed: definition.seed,
    tick: summary.tick,
    observation,
  });
  const compressMs = elapsed(beforeCompression);
  writeFileSync(join(path, "checkpoint.antropy.gz"), new Uint8Array(await blob.arrayBuffer()));
  const beforeRestore = performance.now(),
    decoded = await decodePackage(blob),
    restored = engine.restore(decoded.snapshot);
  const restoreMs = elapsed(beforeRestore);
  try {
    if (Buffer.compare(snapshot, restored.snapshot()) !== 0)
      throw new Error("Physical restore mismatch");
    if (JSON.stringify(observation) !== JSON.stringify(decoded.metadata.observation))
      throw new Error("Retained observation mismatch");
    budget(started);
    const beforeContinuation = performance.now();
    for (let i = 0; i < 3; i++) {
      world.step();
      restored.step();
    }
    const continuationMs = elapsed(beforeContinuation);
    if (Buffer.compare(world.snapshot(), restored.snapshot()) !== 0)
      throw new Error("Physical continuation mismatch");
    budget(started);
    return {
      bytes: snapshot.length,
      compressed: blob.size,
      serializeMs,
      compressMs,
      restoreMs,
      continuationMs,
      exactContinuation: true,
    };
  } finally {
    restored.dispose();
  }
}
async function storageCase(engine: Engine, name: string, root: string) {
  const path = join(root, name);
  mkdirSync(path);
  const started = performance.now(),
    world = makeWorld(engine, name),
    insertedMs = elapsed(started);
  try {
    const initial = world.command<Summary>("summary"),
      censusStart = performance.now();
    const spatial = emptySpatial();
    observe(world, spatial);
    const censusMs = elapsed(censusStart);
    const observation: ObservationState = {
      runId: `synthetic-${name}`,
      spatial,
      history: [],
      recent: [],
      executions: [{ digest: engine.sourceDigest, tick: initial.tick }],
    };
    const inspectStart = performance.now();
    world.command("inspect", { cell: name.startsWith("ancestry-") ? Number(name.slice(9)) : 1 });
    const inspectionMs = elapsed(inspectStart);
    const renderStart = performance.now(),
      frame = world.render(5, 0, 6, true);
    const renderBytes = frame.cells.byteLength + frame.field.byteLength + frame.markers.byteLength;
    const renderMs = elapsed(renderStart),
      stepMs: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      world.step();
      stepMs.push(elapsed(start));
      budget(started);
    }
    const storage = await packageCheck(engine, world, observation, path, started);
    const result = {
      name,
      insertedMs,
      censusMs,
      inspectionMs,
      renderMs,
      renderBytes,
      stepMs,
      storage,
      initial,
      final: world.command<Summary>("summary"),
      memoryBytes: engine.memoryBytes,
      wallMs: elapsed(started),
    };
    writeFileSync(join(path, "result.json"), JSON.stringify(result, null, 2));
    console.log(
      JSON.stringify({
        name,
        wallMs: result.wallMs,
        censusMs,
        inspectionMs,
        ...storage,
        memoryBytes: result.memoryBytes,
      })
    );
    return result;
  } finally {
    world.dispose();
  }
}
export async function runContinuationCheck(flags: Flags): Promise<void> {
  const output = flag(flags, "output", "harness/artifacts/continuation-check");
  mkdirSync(output);
  const started = performance.now(),
    engine = await loadEngine(),
    binaryDigest = captureEngine(output, engine);
  const chemicalOnly = flag(flags, "chemical-only", "false") === "true";
  const storageOnly = flag(flags, "storage-only", "false") === "true";
  const cases = [
    ...(chemicalOnly ? [] : ["ancestry-100000", "ancestry-2000000"]),
    "empty",
    "patchy",
    "widespread",
    "dense",
    ...(chemicalOnly || storageOnly ? [] : ["default"]),
  ];
  const results = [];
  const params = {
    schemaVersion: 3,
    sourceDigest: engine.sourceDigest,
    binaryDigest,
    registration: "docs/design/chemistry/rebuild-results.md",
    wallSecondsPerCase: 60,
    interpretation:
      "Synthetic storage and bounded continuation; no evolutionary or endurance claim",
  };
  let failure: string | null = null;
  try {
    for (const name of cases) results.push(await storageCase(engine, name, output));
  } catch (error) {
    failure = String(error);
  }
  const summary = { results, failure },
    db = openLedger();
  try {
    const id = recordRun(db, {
      experiment: "continuation-check",
      label: "Numerical chemistry storage",
      driver: "wasm",
      seed: 101,
      ticks: results.length * 8,
      params,
      summary,
      wallMs: elapsed(started),
    });
    writeFileSync(
      join(output, "report.json"),
      JSON.stringify({ id, ...params, ...summary }, null, 2)
    );
    console.log(JSON.stringify({ id, cases: results.length, failure }));
  } finally {
    db.close();
  }
  if (failure) throw new Error(failure);
}

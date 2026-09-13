import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { createWorld, stepWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG } from "../../src/sim/config";
import { AncestryStore } from "../../src/sim/ancestryStore";
import { checkpointToJson, restoreWorld } from "../../src/persist/checkpoint";
import { saveObservation } from "../../src/persist/observation";
import { observeSpatial } from "../../src/observe/spatialHistory";
import { balance, materialBalance } from "../../src/sim/accounting";
import { sourceDigest } from "./bacteriaRun";
import { openLedger, recordRun } from "./ledger";
import { flag, type Flags } from "./flags";

function elapsed(start: number): number {
  return performance.now() - start;
}
function budget(start: number): void {
  if (elapsed(start) > 60000) throw new Error("Registered 60-second operational budget reached");
}
function fillAncestry(store: AncestryStore, count: number, started: number): void {
  for (let id = 1; id <= count; id++) {
    store.set(id, {
      id,
      parent: id === 1 ? null : id - 1,
      lineage: 1,
      genome: 1,
      born: id - 1,
      ended: id === count ? null : id,
      cause: id === count ? "alive" : "division",
    });
    if (id % 4096 === 0) {
      store.compact();
      budget(started);
    }
  }
  store.compact();
}
function ancestry(count: number) {
  const started = performance.now();
  const world = createWorld(101, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 1,
    sourceCount: 0,
  });
  const store = world.ancestry as AncestryStore;
  fillAncestry(store, count, started);
  Object.assign(world.cells[0], {
    id: count,
    parent: count - 1,
    born: count - 1,
    generation: count - 1,
  });
  world.nextCell = count + 1;
  world.tick = count;
  const insertedMs = elapsed(started),
    beforeSave = performance.now();
  // Synthetic history deliberately omits ecological observation claims.
  const text = checkpointToJson(world);
  const serializeMs = elapsed(beforeSave),
    compressed = gzipSync(text).byteLength;
  const beforeRepeat = performance.now();
  const repeated = checkpointToJson(world);
  const repeatSerializeMs = elapsed(beforeRepeat);
  if (repeated !== text) throw new Error("Cached ancestry changed serialization");
  budget(started);
  const beforeRestore = performance.now(),
    restored = restoreWorld(text);
  const restoreMs = elapsed(beforeRestore);
  for (const id of [1, Math.floor(count / 2), count])
    if (JSON.stringify(restored.ancestry.get(id)) !== JSON.stringify(store.get(id)))
      throw new Error("Accumulated ancestry mismatch");
  budget(started);
  return {
    count,
    insertedMs,
    serializeMs,
    repeatSerializeMs,
    restoreMs,
    bytes: Buffer.byteLength(text),
    compressed,
    activeRecords: store.packed().active.length,
    memory: process.memoryUsage(),
    wallMs: elapsed(started),
  };
}
function startup() {
  const world = createWorld(),
    started = performance.now();
  observeSpatial(world);
  while (world.tick < 500 && !world.stopReason && elapsed(started) < 60000) {
    stepWorld(world);
    observeSpatial(world);
  }
  const runtimeMs = elapsed(started),
    beforeSave = performance.now();
  const text = checkpointToJson(world, sourceDigest(), saveObservation(world));
  const serializeMs = elapsed(beforeSave),
    beforeRestore = performance.now();
  const restored = restoreWorld(text),
    restoreMs = elapsed(beforeRestore);
  const result = {
    ticks: world.tick,
    runtimeMs,
    living: world.cells.length,
    births: world.ledger.births,
    stop: world.stopReason,
    energyResidual: balance(world),
    materialResidual: materialBalance(world),
    regions: observeSpatial(world).regions.length,
    serializeMs,
    restoreMs,
    bytes: Buffer.byteLength(text),
  };
  for (let i = 0; i < 5; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  if (checkpointToJson(world) !== checkpointToJson(restored))
    throw new Error("Startup continuation mismatch");
  return result;
}
export function runContinuationCheck(flags: Flags): void {
  const output = flag(flags, "output", "harness/artifacts/continuation-check");
  mkdirSync(output, { recursive: false });
  const digest = sourceDigest(),
    started = performance.now();
  const summary = {
    startup: flag(flags, "storage-only", "false") === "true" ? null : startup(),
    ancestry: [ancestry(100000), ancestry(2000000)],
  };
  const params = {
    sourceDigest: digest,
    sourceDigestAfter: sourceDigest(),
    registration: "docs/continuing-observation.md",
  };
  const db = openLedger();
  const id = recordRun(db, {
    experiment: "continuation-check",
    label: "Synthetic storage and 500-tick startup; not evolution evidence",
    driver: "bacteria-xy",
    seed: 101,
    ticks: summary.startup ? summary.startup.ticks + 5 : 0,
    params,
    summary,
    wallMs: elapsed(started),
  });
  db.close();
  writeFileSync(
    join(output, "report.json"),
    JSON.stringify({ id, ...params, ...summary }, null, 2)
  );
  console.log(JSON.stringify({ id, ...summary }));
}

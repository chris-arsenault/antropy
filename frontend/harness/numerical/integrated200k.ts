/** One registered default trajectory; see docs/integrated-200k-review.md. */
import { closeSync, mkdirSync, openSync, statfsSync, writeSync } from "node:fs";
import { join } from "node:path";
import { type EngineWorld } from "../../src/engine/client";
import { type Summary } from "../../src/engine/types";
import { runRecorded } from "../lib/longRun";
import { directoryBytes, validateAccounts } from "../lib/studyBudget";
import { loadEngine } from "./engine";

interface Web {
  pairs: number;
  rows: { input: number; output: number; amount: number }[];
  window: { start: number; end: number };
}
const directory = process.argv[2];
if (!directory) throw new Error("Expected a new output directory");
mkdirSync(directory);
const engine = await loadEngine(),
  world = engine.create(27, {}),
  flowFile = openSync(join(directory, "flows.jsonl"), "wx"),
  started = performance.now();
let lastAt = started,
  nextResourceCheck = 0,
  resourceFailure: string | null = null;
world.command("phenotype", {
  action: "configure",
  enabled: true,
  highlight: false,
  selection: { kind: "all" },
});
function flows(w: EngineWorld) {
  const first = w.command<Web>("chemicalWeb", { mode: "measured", focus: null, offset: 0 });
  const rows = [...first.rows];
  for (let offset = 64; offset < first.pairs; offset += 64)
    rows.push(...w.command<Web>("chemicalWeb", { mode: "measured", focus: null, offset }).rows);
  writeSync(flowFile, JSON.stringify({ ...first, rows }) + "\n");
}
const observed = new Proxy(world, {
  get(target, key) {
    if (key !== "step") return Reflect.get(target, key);
    return () => {
      const state = target.step();
      if (state.tick % 250 === 0) flows(target);
      return state;
    };
  },
});
try {
  runRecorded(engine, observed, {
    directory: join(directory, "trajectory"),
    experiment: "integrated-200k-review",
    label: "v31 seed27; binding, composed illumination, photoreception; default evolution",
    ticks: 200000,
    cadence: 1000,
    checkpointEvery: 10000,
    wallSeconds: 4 * 3600,
    provenance: { registration: "docs/integrated-200k-review.md", flowWindowTicks: 250 },
    observation(w) {
      const summary = w.command<Summary>("summary");
      validateAccounts(summary);
      const now = performance.now(),
        resources = { rss: process.memoryUsage().rss, wasm: engine.memoryBytes };
      const timing = { elapsedMs: now - started, intervalMs: now - lastAt, ...resources };
      lastAt = now;
      if (summary.tick === 1000)
        console.log(
          JSON.stringify({ pilot: summary.tick, ...timing, projectionSeconds: (now - started) / 5 })
        );
      return { timing, phenotypes: w.command("phenotype", { action: "report" }) };
    },
    stop() {
      if (performance.now() < nextResourceCheck) return resourceFailure;
      nextResourceCheck = performance.now() + 10000;
      const disk = statfsSync(directory);
      if (process.memoryUsage().rss >= 4 * 1024 ** 3) resourceFailure = "resource limit: RSS";
      if (engine.memoryBytes >= 2 * 1024 ** 3) resourceFailure = "resource limit: WASM";
      if (directoryBytes(directory) >= 48 * 1024 ** 3) resourceFailure = "resource limit: output";
      if (disk.bavail * disk.bsize < 20 * 1024 ** 3) resourceFailure = "resource limit: free disk";
      return resourceFailure;
    },
  });
} finally {
  closeSync(flowFile);
  world.dispose();
}

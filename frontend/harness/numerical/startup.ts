import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { loadEngine, captureEngine } from "./engine";
import { openLedger, recordRun } from "../lib/ledger";

const output = process.argv[2];
if (!output) throw new Error("Provide a new output directory");
mkdirSync(output);
const wasmDigest = captureEngine(output);
const engine = await loadEngine(),
  world = engine.create(),
  db = openLedger();
try {
  const definition = world.command("definition"),
    initial = world.command("frame");
  writeFileSync(`${output}/initial.antropy`, world.snapshot());
  const traces: unknown[] = [];
  const start = performance.now();
  let steps = 0,
    stop = "horizon";
  while (steps < 600) {
    if (performance.now() - start >= 30000) {
      stop = "wall-cap";
      break;
    }
    const status = world.step();
    steps++;
    if (steps % 20 === 0) traces.push(world.command("frame"));
    if (status.stopReason) {
      stop = status.stopReason;
      break;
    }
  }
  const wallMs = performance.now() - start,
    summary = world.command<Record<string, unknown>>("summary");
  const id = recordRun(db, {
    experiment: "numerical-production-startup",
    label: "Ordinary 48-founder startup; bounded integration check",
    driver: "wasm",
    seed: 101,
    ticks: steps,
    params: {
      wasmDigest,
      horizon: 600,
      wallCapSeconds: 30,
      registration: "docs/design/chemistry/numerical-engine.md",
    },
    summary: { ...summary, stop },
    wallMs,
  });
  writeFileSync(`${output}/final.antropy`, world.snapshot());
  writeFileSync(
    `${output}/result.json`,
    JSON.stringify({ id, wasmDigest, definition, initial, summary, stop, wallMs }, null, 2)
  );
  writeFileSync(`${output}/traces.json`, JSON.stringify(traces));
  console.log(JSON.stringify({ id, steps, stop, wallMs, summary }));
} finally {
  world.dispose();
  db.close();
}

import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { openLedger, recordRun } from "../lib/ledger";
import { type ChemicalWeb, type WebMode } from "../../src/engine/chemicalWeb";

const output = process.argv[2];
if (!output) throw new Error("Provide a new output directory");
mkdirSync(output);
const started = performance.now();
const engine = await loadEngine();
const wasmDigest = captureEngine(output, engine);
const results = [];
for (const population of [48, 2000]) {
  const world = engine.create(101);
  try {
    if (population === 2000) world.command("loadFixture", { population, growth: false });
    const initial = world.snapshot();
    world.render(5, 0, 3, true);
    const queries = [],
      colors = [];
    for (let i = 0; i < 20; i++) {
      assert.ok(performance.now() - started < 60000, "Registered wall budget exceeded");
      const mode: WebMode = (["primary", "supported", "environment"] as const)[i % 3];
      let start = performance.now();
      const web = world.command<ChemicalWeb>("chemicalWeb", { mode, focus: null, offset: 0 });
      const ms = performance.now() - start;
      const bytes = Buffer.byteLength(JSON.stringify(web));
      assert.ok(bytes <= 16384);
      queries.push({ mode, ms, bytes, pairs: web.pairs });
      const color = [3, 14, 15][i % 3];
      start = performance.now();
      world.render(5, 0, color, false);
      colors.push({ color, ms: performance.now() - start });
    }
    assert.equal(Buffer.compare(initial, world.snapshot()), 0);
    results.push({ population, queries, colors, equalPhysics: true });
  } finally {
    world.dispose();
  }
}
const wallMs = performance.now() - started;
const db = openLedger();
try {
  const id = recordRun(db, {
    experiment: "chemical-web-cost",
    driver: "wasm",
    seed: 101,
    ticks: 0,
    label:
      "Read-only installed enzyme routes and borrowed map colors; startup and varied capacity fixture",
    params: { registration: "CHEMICAL-WEB-PLAN.md", repetitions: 20, wallCapSeconds: 60 },
    summary: { wasmDigest, results },
    wallMs,
  });
  writeFileSync(
    `${output}/report.json`,
    JSON.stringify({ id, wasmDigest, wallMs, results }, null, 2)
  );
  console.log(JSON.stringify({ id, wallMs, output }));
} finally {
  db.close();
}

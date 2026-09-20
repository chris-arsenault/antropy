/** Registered final-state operating costs, separate from the 200k ecological trajectory. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { type EngineWorld } from "../../src/engine/client";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";

const [checkpoint, output] = process.argv.slice(2);
if (!checkpoint || !output) throw new Error("Expected checkpoint and new output directory");
mkdirSync(output);
const engine = await loadEngine(),
  binaryDigest = captureEngine(output, engine),
  bytes = new Uint8Array(readFileSync(checkpoint)),
  db = openLedger(),
  results = [];
function observed(world: EngineWorld) {
  return new Proxy(world, {
    get(target, key) {
      if (key !== "step") return Reflect.get(target, key);
      return () => {
        const state = target.step();
        if (state.tick % 25 === 0) {
          target.command("chemicalWeb", { mode: "measured", focus: null, offset: 0 });
          target.command("phenotype", { action: "report" });
        }
        return state;
      };
    },
  });
}
try {
  for (const active of [false, true]) {
    const world = engine.restore(bytes);
    try {
      if (active)
        world.command("phenotype", {
          action: "configure",
          enabled: true,
          highlight: false,
          selection: { kind: "all" },
        });
      world.step(10);
      const measured = measureOperating(active ? observed(world) : world, 100, 30);
      const id = recordRun(db, {
        experiment: "integrated-200k-cost",
        label: active ? "active panels" : "closed panels",
        driver: "wasm",
        seed: 27,
        ticks: measured.steps,
        params: {
          checkpoint,
          binaryDigest,
          active,
          registration: "docs/integrated-200k-review.md",
        },
        summary: measured,
        wallMs: measured.wallMs,
      });
      results.push({ id, active, ...measured });
      console.log(JSON.stringify({ id, active, ticksPerSecond: measured.ticksPerSecond }));
    } finally {
      world.dispose();
    }
  }
} finally {
  db.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(results, null, 2));
}

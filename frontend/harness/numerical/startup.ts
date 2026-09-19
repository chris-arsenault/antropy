import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { loadEngine, captureEngine } from "./engine";
import { openLedger, recordRun } from "../lib/ledger";

const output = process.argv[2];
if (!output) throw new Error("Provide a new output directory");
const horizon = Number(process.argv[3] ?? 600);
const weathering = process.argv[4] ?? "on";
const registration = process.argv[5] ?? "ENVIRONMENTAL-ECOLOGY-PLAN.md#weathering-redesign";
const seed = Number(process.argv[6] ?? 27);
if (!Number.isSafeInteger(seed) || seed < 0) throw new Error("Expected a nonnegative integer seed");
if (![600, 3000].includes(horizon) || !["on", "off"].includes(weathering))
  throw new Error("Expected horizon 600|3000 and weathering on|off");
mkdirSync(output);
const wasmDigest = captureEngine(output);
const engine = await loadEngine(),
  world = engine.create(seed, weathering === "off" ? { weatheringRate: 0 } : {}),
  db = openLedger();
try {
  const definition = world.command<{ seed: number }>("definition"),
    initial = world.command("frame");
  writeFileSync(`${output}/initial.antropy`, world.snapshot());
  const traces: unknown[] = [];
  const intervals: unknown[] = [];
  const start = performance.now();
  let previous = start;
  let steps = 0,
    stop = "horizon";
  while (steps < horizon) {
    if (performance.now() - start >= 120000) {
      stop = "wall-cap";
      break;
    }
    const status = world.step();
    steps++;
    if (steps % 20 === 0) traces.push(world.command("frame"));
    if (steps % 100 === 0) {
      const now = performance.now();
      intervals.push({
        tick: steps,
        wallMs: now - previous,
        activity: world.command("fieldActivity"),
        summary: world.command("summary"),
      });
      previous = performance.now();
    }
    if (status.stopReason) {
      stop = status.stopReason;
      break;
    }
  }
  const wallMs = performance.now() - start,
    summary = world.command<Record<string, unknown>>("summary");
  const id = recordRun(db, {
    experiment: "numerical-production-startup",
    label: `Ordinary seed${seed}; local weathering ${weathering}; ${horizon} ticks`,
    driver: "wasm",
    seed: definition.seed,
    ticks: steps,
    params: {
      wasmDigest,
      horizon,
      weathering,
      wallCapSeconds: 120,
      registration,
    },
    summary: { ...summary, stop },
    wallMs,
  });
  writeFileSync(`${output}/final.antropy`, world.snapshot());
  writeFileSync(
    `${output}/result.json`,
    JSON.stringify(
      { id, wasmDigest, definition, initial, summary, stop, wallMs, intervals },
      null,
      2
    )
  );
  writeFileSync(`${output}/traces.json`, JSON.stringify(traces));
  console.log(JSON.stringify({ id, steps, stop, wallMs, summary }));
} finally {
  world.dispose();
  db.close();
}

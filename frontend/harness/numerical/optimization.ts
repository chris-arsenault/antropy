/** Matched input workloads; throughput, accounts, ordinary observations and sampled CPU cost. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Session } from "node:inspector/promises";
import { join } from "node:path";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";

const stages = [
  "traceStart",
  "fieldAndFootprintsAndSources",
  "sensingController",
  "movement",
  "exchange",
  "physiology",
  "maintenanceAndLifecycle",
  "traceFinish",
  "exchangePreparationSubset",
];
const fixtures = {
  "48": "candidate/48-initial.antropy",
  "2000": "candidate/2000-initial.antropy",
  "2000-growth": "candidate/2000-growth-initial.antropy",
  "default-5000": "default/mixed-27-chem101-rate0.2/checkpoint-5000.bin",
};
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const [output, reference, selection, horizonArgument] = process.argv.slice(2);
const horizon = Number(horizonArgument ?? 100);
if (![100, 1000].includes(horizon)) throw new Error("Use a registered 100 or 1000 tick horizon");
if (!output) throw new Error("Provide a new output directory, optional baseline and case");
if (selection && !(selection in fixtures)) throw new Error("Unknown fixed workload");
mkdirSync(output, { recursive: false });
const db = openLedger();
try {
  for (const [name, path] of Object.entries(fixtures)) {
    if (selection && name !== selection) continue;
    const engine = await loadEngine(
        process.env.OPTIMIZATION_ENGINE
          ? new URL(process.env.OPTIMIZATION_ENGINE, `file://${process.cwd()}/`)
          : undefined
      ),
      input = readFileSync(join("harness/artifacts/regenerative-20260918", path)),
      world = engine.restore(input);
    const wasmDigest = captureEngine(output, engine);
    try {
      world.step(10);
      const samples: { summary: unknown; chemistry: unknown }[] = [];
      const activityBefore = world.command("fieldActivity"),
        timing = measureOperating(world, horizon, horizon === 100 ? 60 : 90, () => {
          samples.push({
            summary: world.command("summary"),
            chemistry: world.command("chemicalOverview"),
          });
        }),
        saved = world.snapshot();
      const baseline = reference
        ? JSON.parse(readFileSync(join(reference, `${name}.json`), "utf8"))
        : null;
      const result = {
        name,
        sourceDigest: engine.sourceDigest,
        wasmDigest,
        inputDigest: hash(input),
        finalDigest: hash(saved),
        speedup: baseline ? timing.ticksPerSecond / baseline.ticksPerSecond : null,
        activityBefore,
        activityAfter: world.command("fieldActivity"),
        samples,
        ...timing,
        checkpointBytes: saved.length,
        memoryBytes: engine.memoryBytes,
        rss: process.memoryUsage().rss,
      };
      const id = recordRun(db, {
        experiment: "field-work-scaling",
        label: name,
        driver: "wasm",
        seed: name === "default-5000" ? 27 : 101,
        ticks: timing.steps,
        params: {
          registration: "SCALING-PLAN.md",
          sourceDigest: engine.sourceDigest,
          wasmDigest,
          inputDigest: result.inputDigest,
          warmup: 10,
          horizon,
          wallCapSeconds: horizon === 100 ? 60 : 90,
        },
        summary: result,
        wallMs: timing.wallMs,
      });
      writeFileSync(join(output, `${name}.json`), JSON.stringify({ id, ...result }, null, 2));
      writeFileSync(join(output, `${name}-final.antropy`), saved);
      console.log(
        JSON.stringify({
          id,
          name,
          ticksPerSecond: timing.ticksPerSecond,
          speedup: result.speedup,
          memoryBytes: engine.memoryBytes,
        })
      );
      if (
        timing.steps !== horizon ||
        !Number.isFinite(timing.summary.materialResidual) ||
        !Number.isFinite(timing.summary.energyResidual) ||
        Math.abs(timing.summary.materialResidual) > 0.001 ||
        Math.abs(timing.summary.energyResidual) > 0.001
      )
        throw new Error(`${name}: incomplete run or failed resource accounts`);
      if (result.rss > 3 * 1024 ** 3 || engine.memoryBytes > 1.5 * 1024 ** 3)
        throw new Error("Registered memory limit reached");
    } finally {
      world.dispose();
    }
    const replay = engine.restore(input),
      inspector = new Session(),
      totals = Array<number>(9).fill(0);
    inspector.connect();
    try {
      await inspector.post("Profiler.enable");
      await inspector.post("Profiler.start");
      for (let i = 0; i < 40; i++)
        replay.command<number[]>("profile").forEach((value, j) => {
          totals[j] += value / 40;
        });
      const { profile } = await inspector.post("Profiler.stop");
      writeFileSync(join(output, `${name}.cpuprofile`), JSON.stringify(profile));
      const means = Object.fromEntries(stages.map((key, i) => [key, totals[i]]));
      writeFileSync(join(output, `${name}-stages.json`), JSON.stringify(means, null, 2));
      console.log(JSON.stringify({ name, stages: means }));
    } finally {
      inspector.disconnect();
      replay.dispose();
    }
  }
} finally {
  db.close();
}

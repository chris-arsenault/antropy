/** Registered final-state operating costs, separate from the 200k ecological trajectory. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { Session } from "node:inspector/promises";
import { type EngineWorld } from "../../src/engine/client";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";
import { validateAccounts } from "../lib/studyBudget";

const [checkpoint, output, registration, binary] = process.argv.slice(2);
if (!checkpoint || !output || !registration)
  throw new Error("Expected checkpoint, new output directory, registration and optional kernel");
mkdirSync(output);
const engine = await loadEngine(pathToFileURL(binary ?? join(dirname(checkpoint), "engine.wasm"))),
  binaryDigest = captureEngine(output, engine),
  bytes = new Uint8Array(readFileSync(checkpoint)),
  provenance = {
    checkpointSha256: createHash("sha256").update(bytes).digest("hex"),
    sourceDigest: engine.sourceDigest,
    nodeVersion: process.version,
  },
  db = openLedger(),
  results = [],
  profiler = process.env.ANTROPY_PROFILE ? new Session() : null;
const stageNames = [
  "sources",
  "fieldAndFootprints",
  "sensingAndContacts",
  "localCellExecution",
  "exchange",
  "physiology",
  "upkeepAndLifecycle",
  "trace",
  "exchangePreparationSubset",
];
function observed(
  world: EngineWorld,
  active: boolean,
  profile: { count: number; totals: number[] }
) {
  let steps = 0;
  return new Proxy(world, {
    get(target, key) {
      if (key !== "step") return Reflect.get(target, key);
      return () => {
        const detailed = ++steps % 5 === 0;
        if (detailed) {
          target.command<number[]>("profile").forEach((value, index) => {
            profile.totals[index] += value;
          });
          profile.count++;
        }
        const state = target.step(detailed ? 0 : 1);
        if (active && state.tick % 25 === 0) {
          target.command("chemicalWeb", { mode: "measured", focus: null, offset: 0 });
          target.command("phenotype", { action: "report" });
        }
        return state;
      };
    },
  });
}
try {
  if (profiler) {
    profiler.connect();
    await profiler.post("Profiler.enable");
  }
  for (const active of [false, true]) {
    const world = engine.restore(bytes);
    try {
      world.command("phenotype", {
        action: "configure",
        enabled: active,
        highlight: false,
        selection: { kind: "all" },
      });
      world.step(10);
      const initialWork = world.command("fieldActivity", { execution: true });
      const profile = { count: 0, totals: Array<number>(9).fill(0) };
      if (profiler) await profiler.post("Profiler.start");
      const measured = {
        ...measureOperating(observed(world, active, profile), 100, 30),
        profiledSteps: profile.count,
        profileMsPerTick: Object.fromEntries(
          stageNames.map((name, i) => [
            name,
            profile.count ? profile.totals[i] / profile.count : null,
          ])
        ),
      };
      if (profiler) {
        const sampled = await profiler.post("Profiler.stop");
        writeFileSync(
          join(output, active ? "active.cpuprofile" : "closed.cpuprofile"),
          JSON.stringify(sampled.profile)
        );
      }
      validateAccounts(measured.initial);
      const finalWork = world.command("fieldActivity", { execution: true });
      validateAccounts(measured.summary);
      const memoryBytes = engine.memoryBytes;
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
          cpuProfile: profiler !== null,
          registration,
          ...provenance,
          memoryBytes,
        },
        summary: measured,
        wallMs: measured.wallMs,
      });
      results.push({ id, active, initialWork, finalWork, ...provenance, memoryBytes, ...measured });
      console.log(JSON.stringify({ id, active, ticksPerSecond: measured.ticksPerSecond }));
    } finally {
      world.dispose();
    }
  }
} finally {
  profiler?.disconnect();
  db.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(results, null, 2));
}

/** Registered chemistry-flow readout using original kernels and the existing lineage trace. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { decodePackage } from "../../src/engine/package";
import { type Definition, type Summary } from "../../src/engine/types";
import { type EngineWorld } from "../../src/engine/client";
import { openLedger, recordRun } from "../lib/ledger";
import { validateAccounts, resourceSample, resourceStop } from "../lib/studyBudget";
import { loadEngine, captureEngine } from "./engine";

interface Group {
  chemical: Record<string, number[]>;
  reactions: { species: number; product: number; amount: number }[];
}
function sample(world: EngineWorld) {
  const summary = world.command<Summary>("summary");
  validateAccounts(summary);
  const groups = world.command<Group[]>("trace"),
    chemical: Record<string, number[]> = {},
    reactions: Record<string, number> = {};
  for (const group of groups) {
    for (const [key, values] of Object.entries(group.chemical)) {
      chemical[key] ??= Array<number>(256).fill(0);
      values.forEach((q, s) => (chemical[key][s] += q));
    }
    for (const edge of group.reactions) {
      const key = `${edge.species}>${edge.product}`;
      reactions[key] = (reactions[key] ?? 0) + edge.amount;
    }
  }
  return {
    tick: summary.tick,
    summary,
    environment: world.command("environment"),
    chemical,
    reactions,
  };
}

const [mode, binary, input, output] = process.argv.slice(2);
if (!output || !["mature", "pilot", "common", "resume", "branch-pilot"].includes(mode))
  throw new Error("Expected mature|pilot|common|resume|branch-pilot, WASM, input, new output");
const engine = await loadEngine(pathToFileURL(resolve(binary)));
const packaged = mode === "mature" ? await decodePackage(new Blob([readFileSync(input)])) : null;
if (packaged && packaged.metadata.observation.executions.at(-1)?.digest !== engine.sourceDigest)
  throw new Error("Save execution kernel mismatch");
const snapshot =
  packaged?.snapshot ??
  (["resume", "branch-pilot"].includes(mode) ? new Uint8Array(readFileSync(input)) : null);
const world = snapshot ? engine.restore(snapshot) : engine.create(Number(input));
mkdirSync(output);
const db = openLedger(),
  digest = captureEngine(output, engine),
  definition = world.command<Definition>("definition"),
  ticks = { mature: 300, pilot: 3000, common: 20000, resume: 17000, "branch-pilot": 500 }[mode]!,
  wallSeconds = { mature: 120, pilot: 120, common: 600, resume: 480, "branch-pilot": 120 }[mode]!;
try {
  const initial = world.command<Summary>("summary");
  writeFileSync(`${output}/definition.json`, JSON.stringify(definition));
  writeFileSync(`${output}/initial.bin`, world.snapshot());
  if (mode === "mature")
    writeFileSync(`${output}/initial-cells.json`, JSON.stringify(world.command("assayFrame")));
  world.command("traceStart");
  const samples = [sample(world)],
    start = performance.now();
  let stop = "horizon";
  while (world.command<Summary>("summary").tick - initial.tick < ticks) {
    const limit = resourceStop(resourceSample(engine, output, output));
    if (limit || performance.now() - start > wallSeconds * 1000) {
      stop = limit ?? "wall-cap";
      break;
    }
    const remaining = ticks - (world.command<Summary>("summary").tick - initial.tick);
    const state = world.step(Math.min(mode === "mature" ? 50 : 250, remaining));
    samples.push(sample(world));
    if (state.stopReason) {
      stop = state.stopReason;
      break;
    }
  }
  const wallMs = performance.now() - start,
    final = samples.at(-1)!;
  const params = {
    registration: output.includes("186-causal")
      ? "docs/186-symmetry-causality.md"
      : "docs/186-symmetry-investigation.md",
    mode,
    input,
    digest,
    sourceDigest: engine.sourceDigest,
    initialTick: initial.tick,
    ticks,
    wallSeconds,
  };
  const id = recordRun(db, {
    experiment: "186-symmetry-investigation",
    label: mode,
    driver: "wasm",
    seed: definition.seed,
    ticks: final.tick - initial.tick,
    params,
    summary: { ...final.summary, stop },
    wallMs,
  });
  writeFileSync(`${output}/checkpoint.bin`, world.snapshot());
  writeFileSync(`${output}/result.json`, JSON.stringify({ id, ...params, wallMs, stop, samples }));
  console.log(
    JSON.stringify({
      id,
      mode,
      tick: final.tick,
      population: final.summary.population,
      wallMs,
      stop,
    })
  );
} finally {
  world.dispose();
  db.close();
}

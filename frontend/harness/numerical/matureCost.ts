/** Bounded continuation of an uploaded package under its original execution kernel. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { decodePackage } from "../../src/engine/package";
import { type Definition, type Summary } from "../../src/engine/types";
import { openLedger, recordRun } from "../lib/ledger";
import { validateAccounts } from "../lib/studyBudget";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating } from "./performance";
import { fieldCosts } from "./matureField";

const [input, binary, output] = process.argv.slice(2);
if (!input || !binary || !output || process.argv.length !== 5)
  throw new Error("Expected package.gz, original kernel.wasm and new output directory");
const started = performance.now(),
  bytes = readFileSync(input),
  decoded = await decodePackage(new Blob([bytes])),
  engine = await loadEngine(pathToFileURL(resolve(binary)));
const executions = decoded.metadata.observation.executions;
if (executions.at(-1)?.digest !== engine.sourceDigest)
  throw new Error("Original execution kernel digest does not match the save");
mkdirSync(output);
const digest = captureEngine(output, engine),
  world = engine.restore(decoded.snapshot),
  db = openLedger();
try {
  const initial = world.command<Summary>("summary"),
    definition = world.command<Definition>("definition"),
    initialActivity = world.command("fieldActivity"),
    canonical = world.snapshot();
  validateAccounts(initial);
  const field = fieldCosts(world, definition.chemistry.properties, definition.config.mesh ** 2);
  if (Buffer.compare(canonical, world.snapshot())) throw new Error("Field readout changed state");
  writeFileSync(`${output}/initial.antropy`, canonical);
  writeFileSync(`${output}/field.json`, JSON.stringify(field));
  writeFileSync(`${output}/definition.json`, JSON.stringify(definition));
  if (performance.now() - started > 60000) throw new Error("Readout exceeded 60-second cap");
  world.step(10);
  const timing = measureOperating(world, 100, 45);
  const stages = Array<number>(9).fill(0);
  let profiled = 0;
  while (profiled < 20 && performance.now() - started < 120000 && !timing.summary.stopReason) {
    world.command<number[]>("profile").forEach((value, i) => (stages[i] += value));
    profiled++;
    if (world.command<Summary>("summary").stopReason) break;
  }
  const summary = world.command<Summary>("summary");
  validateAccounts(summary);
  const stageNames = [
    "sources",
    "fieldAndFootprints",
    "sensingController",
    "movement",
    "exchange",
    "physiology",
    "maintenanceAndLifecycle",
    "trace",
    "exchangePreparationSubset",
  ];
  const result = {
    input: resolve(input),
    inputDigest: createHash("sha256").update(bytes).digest("hex"),
    binaryDigest: digest,
    sourceDigest: engine.sourceDigest,
    metadataTick: decoded.metadata.tick,
    initial,
    initialActivity,
    timing,
    profiled,
    profileMsPerTick: Object.fromEntries(stageNames.map((name, i) => [name, stages[i] / profiled])),
    finalActivity: world.command("fieldActivity"),
    summary,
    memoryBytes: engine.memoryBytes,
    readoutUnchanged: true,
    wallMs: performance.now() - started,
  };
  const id = recordRun(db, {
    experiment: "mature-checkpoint-cost",
    label: `Unmodified v${definition.version} save at tick ${initial.tick}`,
    driver: "wasm",
    seed: definition.seed,
    ticks: summary.tick - initial.tick,
    params: { registration: "docs/mature-checkpoint-cost.md", input: result.input, digest },
    summary: result,
    wallMs: result.wallMs,
  });
  writeFileSync(`${output}/final.antropy`, world.snapshot());
  writeFileSync(`${output}/result.json`, JSON.stringify({ id, ...result }, null, 2));
  console.log(
    JSON.stringify({
      id,
      tick: initial.tick,
      population: initial.population,
      ticksPerSecond: timing.ticksPerSecond,
      stages: result.profileMsPerTick,
      activity: initialActivity,
      memoryBytes: engine.memoryBytes,
      wallMs: result.wallMs,
    })
  );
} finally {
  world.dispose();
  db.close();
}

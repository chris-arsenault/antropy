import { mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type Definition, type Summary, type EngineConfig } from "../../src/engine/types";
import { openLedger, recordRun } from "./ledger";
import { captureEngine } from "../numerical/engine";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.name !== "artifacts")
    .flatMap((entry) =>
      entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : [join(directory, entry.name)]
    );
}
/** Harness source provenance is separate from the exact archived WASM executable. */
export function sourceDigest(): string {
  const hash = createHash("sha256");
  for (const file of [...sourceFiles("src"), ...sourceFiles("harness"), "harness/cli.ts"].sort()) {
    if (file.includes("/artifacts/") || (!file.endsWith(".ts") && !file.endsWith(".tsx"))) continue;
    hash.update(file);
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}
export function warnIfSourceChanged(before: string, after: string): void {
  if (before !== after)
    console.error(
      `warning: source changed during run (${before.slice(0, 12)} -> ${after.slice(0, 12)})`
    );
}
interface MeasurementOptions {
  wallSeconds?: number;
  spatial?: boolean;
  progress?: boolean;
  onSample?: (world: EngineWorld) => void;
  stop?: () => string | null;
}
export function measure(
  world: EngineWorld,
  ticks: number,
  cadence: number,
  options: MeasurementOptions = {}
) {
  const initial = world.command<Summary>("summary"),
    series = [initial],
    frames: unknown[] = [];
  const started = performance.now(),
    wallMs = (options.wallSeconds ?? 120) * 1000;
  validateBudget(ticks, cadence, wallMs, initial.tick);
  let current = { tick: initial.tick, stopReason: initial.stopReason },
    failure: string | null = null,
    externalStop: string | null = null;
  const sample = () => {
    const point = world.command<Summary>("summary");
    series.push(point);
    if (options.spatial !== false) frames.push(world.command("frame"));
    options.onSample?.(world);
    if (options.progress && point.tick % 5000 === 0)
      console.log(JSON.stringify({ progress: point.tick, population: point.population }));
  };
  const withinBudget = () =>
    current.tick < ticks && !current.stopReason && performance.now() - started < wallMs;
  try {
    while (withinBudget()) {
      externalStop = options.stop?.() ?? null;
      if (externalStop) break;
      current = world.step();
      if (current.tick % cadence === 0) sample();
    }
    if (series.at(-1)!.tick !== current.tick) sample();
  } catch (error) {
    failure = String(error);
  }
  return {
    stop: measurementStop(failure, current, ticks, externalStop),
    failure,
    completed: current.tick >= ticks,
    wallMs: performance.now() - started,
    series,
    frames,
    maxResidual: Math.max(...series.map((p) => Math.abs(p.energyResidual))),
    maxMaterialResidual: Math.max(...series.map((p) => Math.abs(p.materialResidual))),
    final: series.at(-1)!,
  };
}
export function recordMeasurement(
  engine: Engine,
  world: EngineWorld,
  ticks: number,
  output: string,
  label: string,
  experiment = "bacteria-evolution",
  wallSeconds = 120,
  justification = ""
) {
  const definition = world.command<Definition>("definition"),
    digest = sourceDigest(),
    initial = world.snapshot();
  const conditions = world.command("assayFrame");
  const result = measure(world, ticks, 100, { progress: true, wallSeconds });
  const provenance = {
    justification,
    schemaVersion: 3,
    checkpointVersion: definition.version,
    config: definition.config,
    stop: result.stop,
    completed: result.completed,
    sourceDigest: engine.sourceDigest,
    harnessDigest: digest,
    harnessDigestAfter: sourceDigest(),
    initialConditions: conditions,
  };
  warnIfSourceChanged(digest, provenance.harnessDigestAfter);
  const db = openLedger();
  try {
    const id = recordRun(db, {
      experiment,
      label,
      driver: "wasm",
      seed: definition.seed,
      ticks: result.final.tick,
      params: provenance,
      summary: {
        ...result.final,
        maxResidual: result.maxResidual,
        maxMaterialResidual: result.maxMaterialResidual,
        failure: result.failure,
      },
      wallMs: result.wallMs,
    });
    mkdirSync(output, { recursive: true });
    const directory = join(output, `run-${id}`);
    mkdirSync(directory);
    captureEngine(directory, engine);
    writeFileSync(join(directory, "initial.bin"), initial);
    writeFileSync(join(directory, "checkpoint.bin"), world.snapshot());
    writeFileSync(
      join(directory, "result.json"),
      JSON.stringify({ ...result, ...provenance, ledgerId: id }, null, 2)
    );
    console.log(
      JSON.stringify({
        id,
        output: directory,
        tick: result.final.tick,
        population: result.final.population,
        stop: result.stop,
        wallMs: result.wallMs,
      })
    );
    if (result.failure) throw new Error(result.failure);
    return id;
  } finally {
    db.close();
  }
}
export function runBacteria(
  engine: Engine,
  seed: number,
  ticks: number,
  mutation: boolean,
  output: string,
  config: EngineConfig,
  wallSeconds = 120,
  justification = ""
) {
  const world = engine.create(seed, {
    ...config,
    ...(mutation ? {} : { mutationRate: 0, physicalMutationRate: 0 }),
  });
  try {
    return recordMeasurement(
      engine,
      world,
      ticks,
      output,
      `ordinary founders; mutation ${mutation}`,
      "bacteria-evolution",
      wallSeconds,
      justification
    );
  } finally {
    world.dispose();
  }
}

function validateBudget(ticks: number, cadence: number, wallMs: number, startTick: number) {
  if (
    !Number.isFinite(wallMs) ||
    wallMs <= 0 ||
    !Number.isSafeInteger(ticks) ||
    ticks < startTick ||
    !Number.isSafeInteger(cadence) ||
    cadence < 1
  )
    throw new Error("Invalid measurement horizon, cadence or wall budget");
}
function measurementStop(
  failure: string | null,
  current: { tick: number; stopReason: string | null },
  ticks: number,
  externalStop: string | null
) {
  if (failure) return "failure";
  return externalStop ?? current.stopReason ?? (current.tick < ticks ? "wall cap" : "horizon");
}

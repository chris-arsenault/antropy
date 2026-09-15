import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type EngineWorld } from "../../src/engine/client";
import { type Definition, type Summary } from "../../src/engine/types";
import { loadEngine, captureEngine } from "../numerical/engine";
import { QuickObserver } from "./quickObserver";
import { type QuickScenario, percent } from "./quickScenario";
import { openLedger, recordRun, type RunRecord } from "./ledger";

export interface QuickOptions {
  seed: number;
  ticks: number;
  swap: boolean;
  probe?: "fast" | "slow";
  wallSeconds: number;
  output: string;
}
export function validateQuickOptions(o: QuickOptions): void {
  validateBoundedOptions(o, 3000);
}
function validateBoundedOptions(o: QuickOptions, maxTicks: number): void {
  validateSeed(o.seed);
  if (!Number.isInteger(o.ticks) || o.ticks < 1 || o.ticks > maxTicks)
    throw new Error(`Experiment requires 1–${maxTicks} ticks; register long runs separately`);
  const maxWall = maxTicks > 3000 ? 900 : 120;
  if (!Number.isFinite(o.wallSeconds) || o.wallSeconds <= 0 || o.wallSeconds > maxWall)
    throw new Error(`Bounded experiments require a wall cap of 1–${maxWall} seconds per case`);
}
export function runQuick(scenario: QuickScenario, options: QuickOptions) {
  validateQuickOptions(options);
  return runBounded(scenario, options, "quick-mechanism", null);
}
export function runSelectionPilot(
  scenario: QuickScenario,
  options: QuickOptions,
  justification: string,
  experiment = "capability-selection-pilot"
) {
  validateBoundedOptions(options, 20000);
  if (!justification.trim()) throw new Error("Selection pilot requires a justification");
  return runBounded(scenario, options, experiment, justification);
}
export const frameCadence = (ticks: number): number => (ticks > 3000 ? 100 : 10);

function advance(
  world: EngineWorld,
  observer: QuickObserver,
  options: QuickOptions,
  scenario: QuickScenario
) {
  const started = performance.now(),
    frames = [observer.frame()],
    cadence = frameCadence(options.ticks);
  let summary = world.command<Summary>("summary"),
    error: string | null = null;
  let maxEnergyResidual = Math.abs(summary.energyResidual),
    maxMaterialResidual = Math.abs(summary.materialResidual);
  try {
    while (
      summary.tick < options.ticks &&
      !summary.stopReason &&
      performance.now() - started < options.wallSeconds * 1000
    ) {
      scenario.beforeStep?.(world, summary.tick);
      world.step();
      summary = world.command<Summary>("summary");
      maxEnergyResidual = Math.max(maxEnergyResidual, Math.abs(summary.energyResidual));
      maxMaterialResidual = Math.max(maxMaterialResidual, Math.abs(summary.materialResidual));
      if (summary.tick % cadence === 0) frames.push(observer.frame());
    }
    if (frames.at(-1)!.tick !== summary.tick) frames.push(observer.frame());
  } catch (failure) {
    error = String(failure);
  }
  return {
    summary,
    frames,
    error,
    maxEnergyResidual,
    maxMaterialResidual,
    wallMs: performance.now() - started,
  };
}
function record(record: RunRecord, output: string) {
  const db = openLedger();
  try {
    const id = recordRun(db, record);
    console.log(
      JSON.stringify({
        id,
        output,
        ticks: record.ticks,
        wallMs: record.wallMs,
        stop: record.summary.stop,
      })
    );
  } finally {
    db.close();
  }
}
function manifest(
  scenario: QuickScenario,
  options: QuickOptions,
  definition: Definition,
  sourceDigest: string,
  binaryDigest: string,
  experiment: string,
  justification: string | null
) {
  return {
    schemaVersion: 3,
    checkpointVersion: definition.version,
    experiment,
    justification,
    scenario: scenario.name,
    hypothesis: scenario.hypothesis,
    specification: scenario.specification,
    target: scenario.target,
    chemistry: definition.chemistry,
    config: definition.config,
    options,
    sourceDigest,
    binaryDigest,
    frameCadence: frameCadence(options.ticks),
    checkpointFormat: "Versioned Rust binary; use the archived engine.wasm for exact continuation",
    flowUnits: {
      imported: "material",
      exported: "material",
      reaction: "material transformed from species to product",
      motors: "usable energy",
      constructed: "built material",
      construction: "dissipated energy",
    },
    traceContract:
      "Positions at frame tick; inputs/actions from preceding inference. localInputsNow probes a copy at the current position. Cumulative uptake may include recycling. Descendants remain in their initial founder-genotype group; no parental selection uses these observations.",
  };
}
async function runBounded(
  scenario: QuickScenario,
  options: QuickOptions,
  experiment: string,
  justification: string | null
) {
  mkdirSync(options.output); // Existing evidence, including failed runs, is never overwritten.
  const engine = await loadEngine(),
    world = scenario.create(engine, options.seed, options.swap, options.probe);
  const save = (name: string, value: unknown) =>
    writeFileSync(join(options.output, name), JSON.stringify(value));
  let observer: QuickObserver | null = null;
  try {
    const definition = world.command<Definition>("definition");
    const params = manifest(
      scenario,
      options,
      definition,
      engine.sourceDigest,
      captureEngine(options.output, engine),
      experiment,
      justification
    );
    save("manifest.json", params);
    save("initial-environment.json", world.command("environment"));
    save("initial-field.json", world.command("field", { kind: "material" }));
    writeFileSync(join(options.output, "initial.bin"), world.snapshot());
    observer = new QuickObserver(world, scenario);
    const measured = advance(world, observer, options, scenario),
      s = measured.summary;
    const result = {
      ticks: s.tick,
      completed: s.tick === options.ticks && !measured.error,
      stop: measured.error ?? s.stopReason ?? (s.tick < options.ticks ? "wall cap" : "horizon"),
      wallMs: measured.wallMs,
      groups: observer.result(),
      final: s,
      environment: world.command("environment"),
      washedOutMaterial: s.ledger.washedOut,
      maxEnergyResidualPercent: percent(
        measured.maxEnergyResidual,
        s.ledger.initialEnergy + s.ledger.suppliedEnergy
      ),
      maxMaterialResidualPercent: percent(
        measured.maxMaterialResidual,
        s.ledger.initialMaterial + s.ledger.supplied
      ),
      sourceDigestAfter: engine.sourceDigest,
    };
    save("result.json", result);
    save("traces.json", measured.frames);
    writeFileSync(join(options.output, "final.bin"), world.snapshot());
    record(
      {
        experiment,
        label: scenario.name,
        driver: "chemical-rnn-wasm",
        seed: definition.seed,
        ticks: s.tick,
        params,
        summary: result,
        wallMs: result.wallMs,
      },
      options.output
    );
    if (measured.error) throw new Error(measured.error);
    return result;
  } finally {
    observer?.close();
    world.dispose();
  }
}

function validateSeed(seed: number) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295) throw new Error("Invalid seed");
}

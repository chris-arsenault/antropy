import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stepWorld } from "../../src/sim/world";
import { type World } from "../../src/sim/types";
import { balance, materialBalance, total } from "../../src/sim/accounting";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { FLOW_UNITS } from "../../src/sim/observation";
import { controller } from "../../src/sim/controller";
import { sourceDigest } from "./bacteriaRun";
import { QuickObserver } from "./quickObserver";
import { type QuickScenario, percent } from "./quickScenario";
import { openLedger, recordRun, type RunRecord } from "./ledger";

function saveQuickLedger(record: RunRecord, output: string): void {
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
  if (!Number.isInteger(o.ticks) || o.ticks < 1 || o.ticks > maxTicks)
    throw new Error(`Experiment requires 1–${maxTicks} ticks; register long runs separately`);
  if (!Number.isFinite(o.wallSeconds) || o.wallSeconds <= 0 || o.wallSeconds > 120)
    throw new Error("Quick experiments require a wall cap of 1–120 seconds per case");
}

/** New scenarios reuse this runner without another observer, ledger or simulation loop. */
export function runQuick(scenario: QuickScenario, options: QuickOptions) {
  validateQuickOptions(options);
  return runBounded(scenario, options, "quick-mechanism", null);
}

/** Separate entry point requires a registered reason for a multigeneration pilot. */
export function runSelectionPilot(
  scenario: QuickScenario,
  options: QuickOptions,
  justification: string
) {
  validateBoundedOptions(options, 20000);
  if (!justification.trim()) throw new Error("Selection pilot requires a justification");
  return runBounded(scenario, options, "capability-selection-pilot", justification);
}

function advanceBounded(
  world: World,
  observer: QuickObserver,
  options: QuickOptions,
  started: number
) {
  const frames = [observer.frame()];
  let maxEnergyResidual = 0,
    maxMaterialResidual = 0;
  while (world.tick < options.ticks && !world.stopReason) {
    if (performance.now() - started >= options.wallSeconds * 1000) break;
    observer.beforeStep();
    stepWorld(world);
    observer.afterStep();
    maxEnergyResidual = Math.max(maxEnergyResidual, Math.abs(balance(world)));
    maxMaterialResidual = Math.max(maxMaterialResidual, Math.abs(materialBalance(world)));
    if (world.tick % 10 === 0) frames.push(observer.frame());
  }
  if (frames.at(-1)!.tick !== world.tick) frames.push(observer.frame());
  return { frames, maxEnergyResidual, maxMaterialResidual };
}

function runBounded(
  scenario: QuickScenario,
  options: QuickOptions,
  experiment: string,
  justification: string | null
) {
  const world = scenario.create(options.seed, options.swap, options.probe);
  mkdirSync(options.output); // Refuse to overwrite any existing evidence, including failed runs.
  const digest = sourceDigest(),
    started = performance.now();
  const save = (name: string, value: unknown) =>
    writeFileSync(join(options.output, name), JSON.stringify(value));
  const params = {
    schemaVersion: 1,
    experiment,
    justification,
    scenario: scenario.name,
    hypothesis: scenario.hypothesis,
    specification: scenario.specification,
    target: scenario.target,
    offeredFoodA: scenario.offeredFoodA,
    offeredFoodB: scenario.offeredFoodB ?? 0,
    options,
    config: world.config,
    sourceDigest: digest,
    flowUnits: FLOW_UNITS,
    traceContract:
      "Positions at frame tick; inputs/actions from preceding inference. localInputsNow is a nonmutating current-position probe. Arrival means entering target radius, not first uptake. Food A is initial offer; B includes recycling.",
  };
  save("manifest.json", params);
  writeFileSync(join(options.output, "initial.json"), checkpointToJson(world));
  const observer = new QuickObserver(world, scenario);
  try {
    const { frames, maxEnergyResidual, maxMaterialResidual } = advanceBounded(
      world,
      observer,
      options,
      started
    );
    const result = {
      ticks: world.tick,
      completed: world.tick === options.ticks,
      stop: world.stopReason ?? (world.tick < options.ticks ? "wall cap" : "horizon"),
      wallMs: performance.now() - started,
      groups: observer.result(),
      foodARemainingPercent: percent(total(world.nutrient), scenario.offeredFoodA),
      nutrientDecayPercentOfferedA: percent(world.ledger.nutrientLoss, scenario.offeredFoodA),
      maxEnergyResidualPercent: percent(maxEnergyResidual, world.ledger.initial),
      maxMaterialResidualPercent: percent(maxMaterialResidual, world.ledger.initialMaterial),
      sourceDigestAfter: sourceDigest(),
    };
    save("result.json", result);
    save("traces.json", frames);
    writeFileSync(join(options.output, "final.json"), checkpointToJson(world));
    saveQuickLedger(
      {
        experiment,
        label: scenario.name,
        driver: controller.id,
        seed: world.seed,
        ticks: world.tick,
        params,
        summary: result,
        wallMs: result.wallMs,
      },
      options.output
    );
    if (result.sourceDigestAfter !== digest)
      throw new Error("Source changed during quick experiment");
    return result;
  } finally {
    observer.close();
  }
}

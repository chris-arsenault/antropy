import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type RecognitionProfile } from "../../src/engine/bindingTypes";
import { type Summary } from "../../src/engine/types";
import { bindingScenario, LABELS } from "../lib/ruggedBindingFixture";
import { measuredCase, reciprocalSquare, type BindingCase } from "../lib/ruggedBindingReport";
import { runQuick } from "../lib/quickRun";
import { type QuickScenario } from "../lib/quickScenario";
import { captureEngine, loadEngine } from "./engine";

const REGISTRATION = "docs/key-binding-correction.md";
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const condition = (lambda: number, variant: number) => `${lambda}-${LABELS[variant]}`;

function scenario(lambda: number, variant: number): QuickScenario {
  const base = bindingScenario(lambda, false, variant);
  return {
    ...base,
    name: `key-competition-${condition(lambda, variant)}`,
    specification: { ...base.specification, registration: REGISTRATION },
  };
}

function registered(engine: Engine, root: string, lambda: number, variant: number) {
  const world = scenario(lambda, variant).create(engine, 27, false);
  try {
    const state = world.snapshot();
    const summary = world.command<Summary>("summary");
    const recognition = world.command<{ recognition: RecognitionProfile }>("inspect", {
      cell: 1,
    }).recognition;
    if (summary.tick !== 0) throw new Error("Budget advanced physical time");
    for (const site of recognition.sites) {
      const total = site.affinities.reduce((sum, [, value]) => sum + value, 0);
      if (total > 1 + 1e-12) throw new Error("Compiled recognition exceeds site capacity");
    }
    const name = condition(lambda, variant);
    writeFileSync(join(root, `initial-${name}.bin`), state);
    return {
      lambda,
      variant,
      label: LABELS[variant],
      checkpointDigest: digest(state),
      summary,
      recognition,
      budget: world.command("bindingBudget", { cell: 1 }),
    };
  } finally {
    world.dispose();
  }
}

function matchedScenario(lambda: number, variant: number, expected: string): QuickScenario {
  const base = scenario(lambda, variant);
  return {
    ...base,
    create(...args) {
      const world: EngineWorld = base.create(...args);
      if (digest(world.snapshot()) !== expected) {
        world.dispose();
        throw new Error("Probe differs from its zero-tick initial state");
      }
      return world;
    },
  };
}

function bytes(path: string): number {
  return readdirSync(path).reduce((total, name) => {
    const child = join(path, name);
    const stat = statSync(child);
    return total + (stat.isDirectory() ? bytes(child) : stat.size);
  }, 0);
}

async function main(root: string) {
  mkdirSync(root);
  const engine = await loadEngine();
  const binaryDigest = captureEngine(root, engine);
  const budgets = [6, 0.25].flatMap((lambda) =>
    LABELS.map((_, variant) => registered(engine, root, lambda, variant))
  );
  writeFileSync(
    join(root, "budget.json"),
    JSON.stringify({ registration: REGISTRATION, ticksAdvanced: 0, binaryDigest, budgets })
  );
  const cases: BindingCase[] = [];
  for (const budget of budgets) {
    const output = join(root, condition(budget.lambda, budget.variant));
    const result = await runQuick(
      matchedScenario(budget.lambda, budget.variant, budget.checkpointDigest),
      { seed: 27, ticks: 300, swap: false, wallSeconds: 30, output }
    );
    const frames = JSON.parse(readFileSync(join(output, "traces.json"), "utf8"));
    cases.push({ label: budget.label, lambda: budget.lambda, empty: false, result, frames });
    if (bytes(root) > 256 * 1024 ** 2) throw new Error("Registered artifact cap reached");
  }
  const measured = cases.map(measuredCase);
  const report = {
    registration: REGISTRATION,
    binaryDigest,
    sourceDigest: engine.sourceDigest,
    high: reciprocalSquare(measured.filter((c) => c.lambda === 6)),
    low: reciprocalSquare(measured.filter((c) => c.lambda === 0.25)),
    cases: measured,
  };
  writeFileSync(join(root, "report.json"), JSON.stringify(report));
  console.log(
    JSON.stringify({
      high: report.high,
      low: report.low,
      cases: measured.map((c) => ({
        lambda: c.lambda,
        label: c.label,
        return: c.return,
        imported: c.flows.imported,
        captured: c.flows.captured,
        living: c.living,
        accounted: c.accounted,
      })),
    })
  );
}

async function startup(root: string) {
  mkdirSync(root);
  const engine = await loadEngine();
  const binaryDigest = captureEngine(root, engine);
  const world = engine.create(27, { preset: "ecology" });
  let initialDigest: string;
  try {
    initialDigest = digest(world.snapshot());
    const budgets = [1, 2, 3, 4].map((cell) => world.command("bindingBudget", { cell }));
    const summary = world.command<Summary>("summary");
    if (summary.tick !== 0) throw new Error("Startup budgets advanced time");
    writeFileSync(
      join(root, "budget.json"),
      JSON.stringify({ registration: REGISTRATION, summary, budgets, ticksAdvanced: 0 })
    );
  } finally {
    world.dispose();
  }
  const ordinary: QuickScenario = {
    name: "key-competition-ordinary-startup",
    hypothesis: "Corrected keys remain active in ordinary mutable startup with funded chemistry.",
    specification: { registration: REGISTRATION, preset: "ecology", initialDigest },
    target: { x: 0, y: 0, radius: 6 },
    stopOnExtinction: true,
    create(build, seed) {
      const candidate = build.create(seed, { preset: "ecology" });
      if (digest(candidate.snapshot()) !== initialDigest) {
        candidate.dispose();
        throw new Error("Ordinary startup differs from its budget state");
      }
      return candidate;
    },
  };
  const result = await runQuick(ordinary, {
    seed: 27,
    ticks: 400,
    swap: false,
    wallSeconds: 30,
    output: join(root, "run"),
  });
  const report = {
    registration: REGISTRATION,
    binaryDigest,
    sourceDigest: engine.sourceDigest,
    result,
  };
  writeFileSync(join(root, "report.json"), JSON.stringify(report));
  if (bytes(root) > 256 * 1024 ** 2) throw new Error("Registered startup artifact cap reached");
  console.log(
    JSON.stringify({
      ticks: result.ticks,
      population: result.final.population,
      imported: result.final.ledger.flows.imported,
      reacted: result.final.ledger.flows.reacted,
      captured: result.final.ledger.flows.captured,
      materialResidual: result.maxMaterialResidualPercent,
      energyResidual: result.maxEnergyResidualPercent,
      stop: result.stop,
    })
  );
}

const root = process.argv[2];
const mode = process.argv[3] ?? "probes";
if (!root || process.argv.length > 4 || !["probes", "startup"].includes(mode)) {
  throw new Error("Usage: keyBindingCorrection.ts NEW_OUTPUT_DIRECTORY [probes|startup]");
}
if (mode === "startup") await startup(root);
else await main(root);

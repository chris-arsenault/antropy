import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { type Definition, type Genotype, type Summary } from "../../src/engine/types";
import { bindingScenario, LABELS, BINDING_REGISTRATION } from "../lib/ruggedBindingFixture";
import { captureEngine, loadEngine } from "./engine";
import { runQuick } from "../lib/quickRun";
import { panelReport, type BindingCase } from "../lib/ruggedBindingReport";
import { sharedGenotypes, sharedReport } from "../lib/ruggedBindingShared";

export interface BindingBudget {
  tick: number;
  ticksAdvanced: number;
  body: number[];
  energy: number;
  local: number[];
  budget: {
    maintenance: number;
    transport: number;
    processingWork: number;
    processingSurplus: number;
    growthCeiling: number;
    imports: number[];
  };
  support: { receptors: number[]; transporters: number[]; enzymes: number[]; membrane: number };
  action: unknown;
  routes: unknown[];
  initialContextImportWorkCeiling: number;
}

async function budget(root: string) {
  const engine = await loadEngine();
  const binaryDigest = captureEngine(root, engine);
  const reports = [];
  for (const [lambda, empty] of [
    [3, false],
    [0.25, false],
    [3, true],
  ] as const) {
    for (let variant = 0; variant < 4; variant++) {
      const scenario = bindingScenario(lambda, empty, variant);
      const started = performance.now();
      const w = scenario.create(engine, 27, false);
      try {
        const setupMs = performance.now() - started;
        const definition = w.command<Definition>("definition");
        const report = w.command<BindingBudget>("bindingBudget", { cell: 1 });
        if (w.command<Summary>("summary").tick !== 0)
          throw new Error("Budget advanced physical time");
        const row = {
          label: LABELS[variant],
          lambda,
          empty,
          setupMs,
          definition,
          report,
          genotype: w.command<Genotype>("genotype", {
            id: w.command<{ cells: { genome: number }[] }>("frame").cells[0].genome,
          }),
          initialCheckpointDigest: digest(w.snapshot()),
        };
        reports.push(row);
        console.log(
          JSON.stringify({
            label: row.label,
            lambda,
            empty,
            maintenance: report.budget.maintenance,
            processingWork: report.budget.processingWork,
            surplus: report.budget.processingSurplus,
            growthCeiling: report.budget.growthCeiling,
            initialContextImportWorkCeiling: report.initialContextImportWorkCeiling,
            importedPerSecond: report.budget.imports.reduce((a, b) => a + b, 0),
            support: report.support,
          })
        );
      } finally {
        w.dispose();
      }
    }
  }
  writeFileSync(
    join(root, "budget.json"),
    JSON.stringify({
      registration: BINDING_REGISTRATION,
      ticksAdvanced: 0,
      sourceDigest: engine.sourceDigest,
      binaryDigest,
      reports,
    })
  );
}

function digest(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}
type BudgetArchive = {
  sourceDigest: string;
  binaryDigest: string;
  reports: { label: string; lambda: number; empty: boolean; initialCheckpointDigest: string }[];
};
function registeredScenario(lambda: number, empty: boolean, variant: number, expected: string) {
  const scenario = bindingScenario(lambda, empty, variant);
  const create = scenario.create;
  scenario.create = (...args) => {
    const world = create(...args);
    if (digest(world.snapshot()) !== expected) {
      world.dispose();
      throw new Error("Initial state differs from zero-tick registration");
    }
    return world;
  };
  return scenario;
}
async function probes(root: string, archive: string) {
  const engine = await loadEngine();
  const registered = JSON.parse(
    readFileSync(join(archive, "budget.json"), "utf8")
  ) as BudgetArchive;
  if (
    registered.sourceDigest !== engine.sourceDigest ||
    registered.binaryDigest !== captureEngine(root, engine)
  )
    throw new Error("Budget and probe engines differ; derive budgets with this exact build first");
  const cases: BindingCase[] = [];
  for (const [lambda, empty] of [
    [3, false],
    [0.25, false],
    [3, true],
  ] as const) {
    for (let variant = 0; variant < 4; variant++) {
      cases.push(await probeCase(root, registered, lambda, empty, variant));
    }
  }
  const report = panelReport(cases);
  writeFileSync(
    join(root, "panel.json"),
    JSON.stringify({
      registration: BINDING_REGISTRATION,
      sourceDigest: engine.sourceDigest,
      binaryDigest: registered.binaryDigest,
      ...report,
    })
  );
  console.log(
    JSON.stringify({
      high: report.high,
      low: report.low,
      sharedEligible: report.sharedEligible,
      returns: report.cases.map((c) => ({
        label: c.label,
        lambda: c.lambda,
        empty: c.empty,
        return: c.return,
      })),
    })
  );
}

async function probeCase(
  root: string,
  registered: BudgetArchive,
  lambda: number,
  empty: boolean,
  variant: number
): Promise<BindingCase> {
  const label = LABELS[variant];
  const expected = registered.reports.find(
    (r) => r.label === label && r.lambda === lambda && r.empty === empty
  );
  if (!expected) throw new Error("Missing registered initial condition");
  const scenario = registeredScenario(lambda, empty, variant, expected.initialCheckpointDigest);
  const condition = lambda === 3 ? "high" : "low";
  const output = join(root, `${empty ? "empty" : condition}-${label}`);
  const result = await runQuick(scenario, {
    seed: 27,
    ticks: 300,
    swap: false,
    wallSeconds: 30,
    output,
  });
  const frames = JSON.parse(
    readFileSync(join(output, "traces.json"), "utf8")
  ) as BindingCase["frames"];
  return { label, lambda, empty, result, frames };
}

async function shared(root: string, panel: string) {
  const gate = JSON.parse(readFileSync(join(panel, "panel.json"), "utf8")) as ReturnType<
    typeof panelReport
  > &
    BudgetArchive;
  const engine = await loadEngine();
  const binaryDigest = captureEngine(root, engine);
  if (gate.sourceDigest !== engine.sourceDigest || gate.binaryDigest !== binaryDigest)
    throw new Error("Shared fixture engine differs from the measured panel");
  if (!gate.sharedEligible) {
    writeFileSync(
      join(root, "shared.json"),
      JSON.stringify({
        executed: false,
        ticks: 0,
        reason: "Registered single-founder reciprocal-square and paid-access gate did not pass",
        high: gate.high,
      })
    );
    console.log("Shared panel skipped: registered single-founder gate did not pass");
    return;
  }
  const runs = [];
  for (const swap of [false, true]) runs.push(await sharedCase(root, swap));
  writeFileSync(
    join(root, "shared.json"),
    JSON.stringify({ executed: true, sourceDigest: engine.sourceDigest, binaryDigest, runs })
  );
  console.log(
    JSON.stringify(
      runs.map((r) => ({
        swap: r.swap,
        square: r.report.square,
        groups: r.report.groups.map((g) => ({
          label: g.label,
          return: g.return,
          biomassShare: g.biomassShare,
          living: g.living,
        })),
      }))
    )
  );
}

async function sharedCase(root: string, swap: boolean) {
  const scenario = bindingScenario(3, false, null);
  const create = scenario.create;
  const genotypes: ReturnType<typeof sharedGenotypes> = [];
  scenario.create = (...args) => {
    const world = create(...args);
    genotypes.push(...sharedGenotypes(world));
    return world;
  };
  const output = join(root, swap ? "swapped" : "original");
  const result = await runQuick(scenario, { seed: 27, ticks: 1000, swap, wallSeconds: 30, output });
  const frames = JSON.parse(
    readFileSync(join(output, "traces.json"), "utf8")
  ) as BindingCase["frames"];
  const report = sharedReport(result, frames, genotypes);
  writeFileSync(join(output, "genotypes.json"), JSON.stringify(genotypes));
  return { swap, result, report };
}

const [stage, root, evidence] = process.argv.slice(2);
if (!root || !["budget", "probes", "shared"].includes(stage) || (stage !== "budget" && !evidence))
  throw new Error(
    "Expected budget NEW_DIRECTORY | probes NEW_DIRECTORY BUDGET_DIRECTORY | shared NEW_DIRECTORY PANEL_DIRECTORY"
  );
mkdirSync(root);
if (stage === "budget") await budget(root);
else if (stage === "probes") await probes(root, evidence!);
else await shared(root, evidence!);

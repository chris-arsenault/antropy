import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Genotype } from "../../src/engine/types";
import { loadEngine, captureEngine } from "./engine";
import { runQuick } from "../lib/quickRun";
import {
  COMMUNITY_REGISTRATION,
  SINGLE_CASES,
  SHARED_CASES,
  ITERATION2_CASES,
  HARM_CASES,
  communityScenario,
  type CommunityCase,
} from "../lib/ruggedCommunityFixture";

const save = (root: string, name: string, value: unknown) =>
  writeFileSync(join(root, name), JSON.stringify(value));
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
type Result = Awaited<ReturnType<typeof runQuick>>;
type Group = Result["groups"][number];
export const netFundedWork = (g: Group) => g.livingEnergy + g.flows.growth - 0.5 * g.initialCells;
interface Registration {
  sourceDigest: string;
  binaryDigest: string;
  rows: { name: string; initialDigest: string; genotypes: Genotype[] }[];
}

async function budgets(root: string) {
  const engine = await loadEngine();
  const binaryDigest = captureEngine(root, engine);
  const rows = [];
  const cases = [
    ...SINGLE_CASES.map((condition) => ({ condition, shared: false })),
    ...SHARED_CASES.map((condition) => ({ condition, shared: true })),
    ...ITERATION2_CASES.map((condition) => ({ condition, shared: true })),
    ...HARM_CASES.map((condition) => ({ condition, shared: false })),
  ];
  for (const { condition, shared } of cases) {
    const scenario = communityScenario(condition, shared);
    const world = scenario.create(engine, 27, false);
    try {
      const cells = world.command<{ cells: { id: number; genome: number }[] }>("frame").cells;
      const reports = cells.map((c) => world.command("bindingBudget", { cell: c.id }));
      rows.push({
        name: scenario.name,
        initialDigest: digest(world.snapshot()),
        reports,
        definition: world.command("definition"),
        genotypes: cells.map((c) => world.command<Genotype>("genotype", { id: c.genome })),
      });
    } finally {
      world.dispose();
    }
  }
  const ordinary = engine.create(27, {
    preset: "ecology",
    width: 24,
    height: 24,
    founders: 4,
    sourceCount: 0,
  });
  try {
    save(
      root,
      "single-locus.json",
      [1, 2, 3, 4].map((cell) =>
        ordinary.command("recognitionProbe", {
          cell,
          count: 128,
          seed: 101,
          singleLocus: true,
        })
      )
    );
  } finally {
    ordinary.dispose();
  }
  save(root, "budget.json", {
    registration: COMMUNITY_REGISTRATION,
    sourceDigest: engine.sourceDigest,
    binaryDigest,
    rows,
  });
  console.log(JSON.stringify({ stage: "budget", worlds: rows.length, ticks: 0, root }));
}

function summary(condition: string, result: Result) {
  return {
    condition,
    ticks: result.ticks,
    stop: result.stop,
    energyResidual: result.final.energyResidual,
    materialResidual: result.final.materialResidual,
    groups: result.groups.map((g) => ({
      genome: g.genome,
      living: g.living,
      biomass: g.livingBiomass,
      energy: g.livingEnergy,
      netFundedWork: netFundedWork(g),
      births: g.births,
      reaction: g.speciesFlows
        .filter((f) => f.channel === "reaction")
        .reduce((sum, f) => sum + f.amount, 0),
      captured: g.flows.captured,
      externalWork: g.flows.externalWork,
      imported: g.flows.imported,
      exported: g.flows.exported,
      repair: g.flows.repair,
      transport: g.flows.transport,
      maintenance: g.flows.maintenance,
      grown: g.flows.grown,
      meanDamagePercent: g.meanDamagePercent,
      relevantFlows: g.speciesFlows.filter(
        (f) => [0, 128, 136].includes(f.species) && f.amount > 1e-6
      ),
    })),
  };
}

const panels: Record<
  string,
  { shared: boolean; cases: readonly CommunityCase[]; ticks: number; wallSeconds: number }
> = {
  single: { shared: false, cases: SINGLE_CASES, ticks: 200, wallSeconds: 5 },
  shared: { shared: true, cases: SHARED_CASES, ticks: 1000, wallSeconds: 10 },
  iteration2: { shared: true, cases: ITERATION2_CASES, ticks: 800, wallSeconds: 10 },
  harm: { shared: false, cases: HARM_CASES, ticks: 300, wallSeconds: 5 },
};

async function panel(root: string, evidence: string, stage: string) {
  const settings = panels[stage];
  const archive = JSON.parse(readFileSync(join(evidence, "budget.json"), "utf8")) as Registration;
  const engine = await loadEngine();
  if (
    engine.sourceDigest !== archive.sourceDigest ||
    captureEngine(root, engine) !== archive.binaryDigest
  )
    throw new Error("Kernel differs from registered budgets");
  const runs = [];
  for (const condition of settings.cases) {
    const scenario = communityScenario(condition, settings.shared);
    const registered = archive.rows.find((r) => r.name === scenario.name)!;
    const create = scenario.create;
    scenario.create = (...args) => {
      const world = create(...args);
      if (digest(world.snapshot()) !== registered.initialDigest) {
        world.dispose();
        throw new Error("Initial checkpoint differs from registration");
      }
      return world;
    };
    const output = join(root, condition);
    const result = await runQuick(scenario, {
      seed: 27,
      swap: false,
      ticks: settings.ticks,
      wallSeconds: settings.wallSeconds,
      output,
    });
    save(output, "genotypes.json", registered.genotypes);
    runs.push({ condition, result });
    console.log(JSON.stringify(summary(condition, result)));
  }
  save(root, "panel.json", runs);
}

const [stage, root, evidence] = process.argv.slice(2);
if (
  !root ||
  !["budget", "single", "shared", "iteration2", "harm"].includes(stage) ||
  (stage !== "budget" && !evidence)
)
  throw new Error("Expected budget NEW_DIRECTORY | single/shared NEW_DIRECTORY BUDGET_DIRECTORY");
mkdirSync(root);
if (stage === "budget") await budgets(root);
else await panel(root, evidence!, stage);

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Definition, type Summary } from "../../src/engine/types";
import { loadEngine, captureEngine } from "./engine";
import {
  consequenceCases,
  consequenceName,
  consequenceScenario,
  consequenceGenomes,
  CONSEQUENCE_REGISTRATION,
  type ConsequenceCase,
} from "../lib/chemicalConsequenceFixture";
import { runQuick } from "../lib/quickRun";
import { consequenceReport } from "../lib/chemicalConsequenceReport";

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const read = (root: string, name: string) => JSON.parse(readFileSync(join(root, name), "utf8"));
const save = (root: string, name: string, value: unknown) =>
  writeFileSync(join(root, name), JSON.stringify(value));

interface Route {
  slot: number;
  species: number;
  products: [number, number][];
  yield: [number, number, number];
  binding: number;
  catalytic: number;
}
interface BudgetReport {
  energy: number;
  body: number[];
  routes: Route[];
  action: unknown;
  local: number[];
  budget: { maintenance: number; transport: number; processingSurplus: number; imports: number[] };
  support: unknown;
}
interface Archive {
  sourceDigest: string;
  binaryDigest: string;
  rows: {
    name: string;
    initialDigest: string;
    case: ConsequenceCase;
    shared: boolean;
    swap: boolean;
  }[];
}

async function budget(root: string) {
  const engine = await loadEngine();
  const binaryDigest = captureEngine(root, engine);
  const rows = [];
  const conditions = consequenceCases.map((c) => ({ c, shared: false, swap: false }));
  for (const swap of [false, true])
    conditions.push({
      c: { variant: 3, supplied: true, lambda: 6, enzymeActive: true },
      shared: true,
      swap,
    });
  for (const { c, shared, swap } of conditions) {
    const scenario = consequenceScenario(c, shared);
    const world = scenario.create(engine, 27, swap);
    try {
      const name = shared ? `shared-${swap}` : consequenceName(c);
      const definition = world.command<Definition>("definition");
      const reports = Array.from({ length: shared ? 4 : 1 }, (_, i) => {
        const report = world.command<BudgetReport>("bindingBudget", { cell: i + 1 });
        const frame = world.command<{
          cells: { cell: { id: number }; stressLoad: number; localInputsNow: number[] }[];
        }>("assayFrame");
        const probe = frame.cells.find((entry) => entry.cell.id === i + 1)!;
        return { cell: i + 1, report, stressLoad: probe.stressLoad, inputs: probe.localInputsNow };
      });
      if (world.command<Summary>("summary").tick !== 0)
        throw new Error("Budget advanced physical time");
      const row = {
        name,
        case: c,
        shared,
        swap,
        initialDigest: hash(world.snapshot()),
        definition,
        genotypes: consequenceGenomes(world),
        reports,
      };
      rows.push(row);
      console.log(
        JSON.stringify({
          name,
          reports: reports.map(({ report, stressLoad }) => ({
            maintenance: report.budget.maintenance,
            import: report.budget.imports[136],
            closureSurplus: report.budget.processingSurplus,
            stressLoad,
            route: report.routes.find(
              (r) => r.species === 136 && r.products.some(([s]) => s === 8)
            ),
          })),
        })
      );
    } finally {
      world.dispose();
    }
  }
  save(root, "budget.json", {
    registration: CONSEQUENCE_REGISTRATION,
    sourceDigest: engine.sourceDigest,
    binaryDigest,
    ticks: 0,
    rows,
  });
}

async function panel(root: string, evidence: string) {
  const archive = read(evidence, "budget.json") as Archive;
  const engine = await loadEngine();
  const binaryDigest = captureEngine(root, engine);
  if (engine.sourceDigest !== archive.sourceDigest || binaryDigest !== archive.binaryDigest)
    throw new Error("Panel must use the registered kernel");
  const runs = [];
  for (const c of consequenceCases) runs.push(await runCase(root, archive, c, false, false));
  save(root, "panel.json", {
    registration: CONSEQUENCE_REGISTRATION,
    sourceDigest: engine.sourceDigest,
    binaryDigest,
    runs,
  });
  const report = consequenceReport(runs);
  save(root, "report.json", report);
  console.log(JSON.stringify({ ...report, rows: undefined }));
  if (report.sharedAuthorized) {
    const sharedRuns = [];
    for (const swap of [false, true])
      sharedRuns.push(
        await runCase(
          root,
          archive,
          { variant: 3, supplied: true, lambda: 6, enzymeActive: true },
          true,
          swap
        )
      );
    save(root, "shared.json", sharedRuns);
  }
}

async function runCase(
  root: string,
  archive: Archive,
  c: ConsequenceCase,
  shared: boolean,
  swap: boolean
) {
  const name = shared ? `shared-${swap}` : consequenceName(c);
  const row = archive.rows.find((r) => r.name === name);
  if (!row) throw new Error("Missing registered initial checkpoint");
  const scenario = consequenceScenario(c, shared);
  const create = scenario.create;
  const genotypes: ReturnType<typeof consequenceGenomes> = [];
  scenario.create = (...args) => {
    const world = create(...args);
    if (hash(world.snapshot()) !== row.initialDigest) {
      world.dispose();
      throw new Error("Initial conditions differ from registration");
    }
    genotypes.push(...consequenceGenomes(world));
    return world;
  };
  const output = join(root, name);
  const result = await runQuick(scenario, { seed: 27, ticks: 200, swap, wallSeconds: 10, output });
  save(output, "genotypes.json", genotypes);
  return { case: c, shared, swap, name, result };
}

const [stage, root, evidence] = process.argv.slice(2);
if (!root || !["budget", "panel"].includes(stage) || (stage === "panel" && !evidence))
  throw new Error("Expected budget NEW_DIRECTORY | panel NEW_DIRECTORY BUDGET_DIRECTORY");
mkdirSync(root);
if (stage === "budget") await budget(root);
else await panel(root, evidence!);

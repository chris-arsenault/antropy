/** Registered in docs/cluster-placement-study.md; uses the ordinary quick runner. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type CellState, type Definition, type Genotype } from "../../src/engine/types";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { loadEngine } from "./engine";
import { checkpointSource } from "../lib/checkpointSource";
import { frozen, install, pulse, type Variant } from "../lib/engineFixtures";
import { type QuickScenario } from "../lib/quickScenario";
import { runQuick } from "../lib/quickRun";

interface Source {
  definition: Definition;
  variants: Variant[];
  provenance: Record<string, unknown>;
}
const root = process.argv[2];
const stage = process.argv[3];
if (!root || !["prepare", "budget", "probe", "contest", "unbound"].includes(stage))
  throw new Error(
    "Expected output root and prepare|budget|probe|contest|unbound; prepare needs checkpoint"
  );

async function prepare() {
  const path = process.argv[4];
  if (!path) throw new Error("Expected registered checkpoint path");
  mkdirSync(root);
  const engine = await loadEngine();
  const { world, provenance } = await checkpointSource(engine, path);
  try {
    if (provenance.sha256 !== "1e24fc5acb7d10ec0748b7a9263aed14dde59f5fe48ed2d4c256f62b1694c171")
      throw new Error("Checkpoint differs from the registered source");
    const source: Source = {
      definition: world.command("definition"),
      variants: [421465, 438982].map((id, i) => ({
        label: i === 0 ? "large-clump descendant" : "mobile-group descendant",
        genotype: world.command<Genotype>("genotype", { id }),
      })),
      provenance: {
        ...provenance,
        sourceTick: 134921,
        sourceCells: [421509, 439026],
        selection: "Median inherited motor/core ratio in proximity groups ranked first and third",
      },
    };
    writeFileSync(join(root, "source.json"), JSON.stringify(source), { flag: "wx" });
  } finally {
    world.dispose();
  }
}

function create(
  engine: Engine,
  source: Source,
  clustered: boolean,
  swap: boolean,
  probe: number | null
): EngineWorld {
  const config = {
    ...source.definition.config,
    ...frozen,
    width: 32,
    height: 32,
    founders: probe === null ? 16 : 1,
    sourceCount: 0,
    sourceEpochs: null,
    sourceZones: null,
    illuminationContrast: 0,
    shadeStrength: 0,
  };
  const world = engine.create(27, config);
  try {
    pulse(world, [
      [0, 51.2],
      [136, 51.2],
    ]);
    const spacing = clustered ? 0.45 : 6;
    const variants = probe === null ? source.variants : [source.variants[probe]];
    install(
      world,
      variants,
      Array.from({ length: config.founders }, (_, i) => ({
        cell: i + 1,
        variant: probe === null ? (Math.floor(i / 4) + Number(swap)) % 2 : 0,
        x: probe === null ? 16 + ((i % 4) - 1.5) * spacing : 16,
        y: probe === null ? 16 + (Math.floor(i / 4) - 1.5) * spacing : 16,
        heading: (Math.PI / 2) * (i % 4),
      })),
      true
    );
    return world;
  } catch (error) {
    world.dispose();
    throw error;
  }
}

function budget(world: EngineWorld) {
  const config = world.command<Definition>("definition").config;
  const cells = world.command<{ cells: { cell: CellState }[] }>("assayFrame").cells;
  return cells.map(({ cell }) => {
    const body = cell.body;
    const maintenance =
      (1 + cell.damage) *
      (body.reduce((a, b) => a + b, 0) * Number(config.maintenance) +
        Number(config.controllerCost));
    const motorPower = body[1] * Number(config.motorPowerDensity) * (1 - cell.damage);
    const energyCapacity = body[0] * Number(config.energyCapacity);
    return {
      cell: cell.id,
      genome: cell.genome,
      body,
      energy: cell.energy,
      energyCapacity,
      maintenancePerSecond: maintenance,
      maxTranslationAndTurningWorkPerSecond: 1.25 * motorPower,
      reserveSecondsWithoutIncomeOrOtherExpenses: cell.energy / maintenance,
      capacityLimitedReserveSeconds: Math.min(cell.energy, energyCapacity) / maintenance,
      allSlotImportTurnoverCeiling:
        body.slice(7, 11).reduce((a, b) => a + b, 0) * Number(config.transporterTurnover),
    };
  });
}

function runInputs() {
  const source: Source = JSON.parse(readFileSync(join(root, "source.json"), "utf8"));
  if (stage === "unbound") source.definition.config.adhesion = 0;
  const cases: Record<string, string[]> = {
    probe: ["single-resident", "single-mobile"],
    contest: ["clustered", "spread"],
    unbound: ["clustered"],
  };
  return { source, cases: cases[stage], suffix: stage === "unbound" ? "-unbound" : "" };
}

async function run() {
  const { source, cases, suffix } = runInputs();
  const swaps = stage === "probe" ? [false] : [false, true];
  const ticks = stage === "probe" ? 300 : 1500;
  const engine = await loadEngine();
  for (const [index, name] of cases.entries()) {
    const probe = stage === "probe" ? index : null;
    const clustered = name === "clustered";
    for (const swap of swaps) {
      const output = join(root, `${name}${suffix}-${Number(swap)}`);
      const initial = create(engine, source, clustered, swap, probe);
      const costs = budget(initial);
      initial.dispose();
      const scenario: QuickScenario = {
        name: `cluster-placement-${name}${suffix}`,
        hypothesis:
          "Starting together improves collective chemical conditions, but spreading out can improve individual access and movement.",
        specification: {
          registration: "docs/cluster-placement-study.md",
          provenance: source.provenance,
          variants: source.variants.map((v) => v.label),
          clustered,
          adhesion: source.definition.config.adhesion,
          swap,
          budget: costs,
          provisioning:
            "Common founder packets; inherited target bodies assembled with accounted material and work; fresh private state",
          supply: "Finite uniform 102.4 material split equally between 0 and 136; no refill",
        },
        target: { x: 16, y: 16, radius: 0 },
        create: (kernel) => create(kernel, source, clustered, swap, probe),
      };
      await runQuick(scenario, {
        seed: 27,
        ticks,
        swap,
        wallSeconds: 120,
        output,
      });
    }
  }
}

async function prepareBudgets() {
  const source: Source = JSON.parse(readFileSync(join(root, "source.json"), "utf8"));
  const engine = await loadEngine();
  const budgets = [];
  for (const probe of [0, 1, null]) {
    const world = create(engine, source, false, false, probe);
    try {
      budgets.push({ probe, cells: budget(world), initialSummary: world.command("summary") });
    } finally {
      world.dispose();
    }
  }
  writeFileSync(join(root, "budgets.json"), JSON.stringify(budgets), { flag: "wx" });
  console.log(JSON.stringify(budgets));
}

if (stage === "prepare") await prepare();
else if (stage === "budget") await prepareBudgets();
else await run();

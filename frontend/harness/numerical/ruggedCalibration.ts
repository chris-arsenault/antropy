import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  type CellState,
  type Definition,
  type Genotype,
  type Summary,
} from "../../src/engine/types";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { loadEngine, captureEngine } from "./engine";
import { runRecorded, readFrame, type ObservedFrame } from "../lib/longRun";
import { localPairs, type LocalCell } from "../lib/ruggedWorldReport";
import { runQuick } from "../lib/quickRun";
import {
  circuit,
  largestBiasChange,
  attributionScenario,
  type Candidate,
} from "../lib/ruggedDescendantFixture";

const registration = {
  document: "docs/plans/RUGGED-ORDINARY-CALIBRATION.md",
  seed: 27,
  lambdas: [3, 1],
  ticks: 4000,
  cadence: 400,
  wallSeconds: 120,
  maxRSS: 2 * 1024 ** 3,
  maxWasm: 1024 ** 3,
  maxDisk: 256 * 1024 ** 2,
};
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const save = (root: string, name: string, value: unknown) =>
  writeFileSync(join(root, name), JSON.stringify(value));
const diskBytes = (directory: string): number =>
  readdirSync(directory).reduce((sum, file) => {
    const path = join(directory, file),
      stat = statSync(path);
    return sum + (stat.isDirectory() ? diskBytes(path) : stat.size);
  }, 0);

interface BudgetRow {
  lambda: number;
  initialDigest: string;
  frame: ObservedFrame;
  budgets: unknown[];
  profiles: unknown[];
  definition: Definition;
  execution: unknown;
}

async function budget(root: string) {
  const engine = await loadEngine();
  const binaryDigest = captureEngine(root, engine);
  const rows: BudgetRow[] = [];
  for (const lambda of registration.lambdas) {
    const world = engine.create(27, { preset: "ecology", bindingLambda: lambda });
    try {
      const initial = world.snapshot(),
        frame = readFrame(world);
      const founders = [...new Map(frame.cells.map((c) => [c.genome, c])).values()];
      const budgets = founders.map((c) => world.command("bindingBudget", { cell: c.id }));
      const profiles = founders.map((c) => world.command("genotypeFacts", { id: c.genome }));
      if (hash(initial) !== hash(world.snapshot())) throw new Error("Budget changed World");
      writeFileSync(join(root, `lambda${lambda}.bin`), initial);
      rows.push({
        lambda,
        initialDigest: hash(initial),
        frame,
        budgets,
        profiles,
        definition: world.command<Definition>("definition"),
        execution: world.command("executionBudget"),
      });
    } finally {
      world.dispose();
    }
  }
  const physical = (frame: ObservedFrame) =>
    frame.cells.map((cell) => ({ ...cell, phenotype: undefined }));
  if (
    JSON.stringify(physical(rows[0].frame)) !== JSON.stringify(physical(rows[1].frame)) ||
    JSON.stringify(rows[0].definition.sources) !== JSON.stringify(rows[1].definition.sources)
  )
    throw new Error("Initial physical conditions differ");
  save(root, "budget.json", {
    registration,
    sourceDigest: engine.sourceDigest,
    binaryDigest,
    rows,
  });
  console.log(JSON.stringify({ stage: "budget", root, ticks: 0 }));
}

function difference(amounts: number[], before: number[] | undefined) {
  return amounts.flatMap((amount, species) => {
    const delta = amount - (before?.[species] ?? 0);
    return delta > 0 ? [[species, delta]] : [];
  });
}

function observations(definition: Definition) {
  const previous = new Map<number, CellState["chemicalFlows"]>();
  return (world: EngineWorld) => {
    const { cells } = world.command<{ cells: LocalCell[] }>("assayFrame");
    const recent = cells.map(({ cell, local, stressLoad }) => {
      const before = previous.get(cell.id);
      const channels = Object.fromEntries(
        (["imported", "exported", "consumed", "produced"] as const).map((key) => [
          key,
          difference(cell.chemicalFlows[key], before?.[key]),
        ])
      );
      previous.set(cell.id, structuredClone(cell.chemicalFlows));
      return {
        id: cell.id,
        genome: cell.genome,
        parent: cell.parent,
        body: cell.body,
        action: cell.action,
        stressLoad,
        local: local.flatMap((q, s) => (q ? [[s, q]] : [])),
        channels,
      };
    });
    const living = new Set(cells.map((c) => c.cell.id));
    for (const id of previous.keys()) if (!living.has(id)) previous.delete(id);
    return {
      trace: world.command("trace"),
      recent,
      pairs: localPairs(cells, definition.config.width, definition.config.height),
      limits:
        "Recent chemistry includes sampled survivors and newborns; native trace includes ended-cell accounts. Nearest pairs use lifetime flows, not demonstrated strategies.",
    };
  };
}

function resourceStop(world: EngineWorld, wasm: number, directory: string) {
  if (world.command<Summary>("summary").population === 0) return "extinction";
  if (process.memoryUsage().rss > registration.maxRSS) return "RSS cap";
  if (wasm > registration.maxWasm) return "WASM cap";
  if (diskBytes(directory) > registration.maxDisk) return "Disk cap";
  return null;
}

async function panel(root: string, evidence: string) {
  const archive = JSON.parse(readFileSync(join(evidence, "budget.json"), "utf8"));
  const engine = await loadEngine(pathToFileURL(join(evidence, "engine.wasm")));
  if (captureEngine(root, engine) !== archive.binaryDigest)
    throw new Error("Archived kernel mismatch");
  const results = [];
  for (const lambda of registration.lambdas) {
    const world = engine.restore(readFileSync(join(evidence, `lambda${lambda}.bin`)));
    try {
      const definition = world.command<Definition>("definition"),
        directory = join(root, `lambda${lambda}`);
      const row = archive.rows.find((r: { lambda: number }) => r.lambda === lambda);
      if (hash(world.snapshot()) !== row.initialDigest)
        throw new Error("Initial checkpoint mismatch");
      world.command("traceStart");
      const result = runRecorded(engine, world, {
        directory,
        experiment: "rugged-ordinary-calibration",
        label: `lambda${lambda}`,
        ticks: registration.ticks,
        cadence: registration.cadence,
        checkpointEvery: registration.ticks,
        wallSeconds: registration.wallSeconds,
        provenance: { registration, initialDigest: row.initialDigest },
        observation: observations(definition),
        stop: () => resourceStop(world, engine.memoryBytes, directory),
      });
      results.push({ lambda, ...result, trace: world.command("trace") });
      console.log(
        JSON.stringify({
          lambda,
          tick: result.final.tick,
          stop: result.stop,
          population: result.final.population,
          ledger: result.final.ledger,
        })
      );
    } finally {
      world.dispose();
    }
  }
  save(root, "comparison.json", { registration, sourceDigest: engine.sourceDigest, results });
}

interface AttributionArchive {
  sourceDigest: string;
  binaryDigest: string;
  candidates: Candidate[];
  rows: { name: string; initialDigest: string }[];
}

function selectCandidate(engine: Engine, evidence: string, lambda: number): Candidate {
  const samples = readFileSync(join(evidence, `lambda${lambda}`, "samples.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const final = samples.at(-1) as {
    cells: { id: number; born: number }[];
    recent: { id: number; channels: { consumed: [number, number][] } }[];
  };
  const born = new Map(final.cells.map((cell) => [cell.id, cell.born]));
  const ranked = final.recent
    .filter((cell) => born.get(cell.id)! > 0)
    .map((cell) => {
      const total = cell.channels.consumed.reduce((sum, f) => sum + f[1], 0);
      const off = cell.channels.consumed
        .filter(([s]) => !circuit.has(s))
        .reduce((sum, f) => sum + f[1], 0);
      return { id: cell.id, total, fraction: total > 0 ? off / total : 0 };
    })
    .filter((cell) => cell.total > 0)
    .sort((a, b) => b.fraction - a.fraction);
  const selected = ranked[0];
  if (!selected) throw new Error("No converted-material candidate");
  const world = engine.restore(readFileSync(join(evidence, `lambda${lambda}`, "checkpoint.bin")));
  try {
    const { cells } = world.command<{ cells: LocalCell[] }>("assayFrame");
    const observed = cells.find(({ cell }) => cell.id === selected.id)!;
    const descendant = world.command<Genotype>("genotype", { id: observed.cell.genome });
    if (descendant.parent === null) throw new Error("Candidate is not an inherited change");
    const parent = world.command<Genotype>("genotype", { id: descendant.parent });
    return {
      lambda,
      cell: observed.cell,
      descendant,
      parent,
      local: observed.local,
      selectedFraction: selected.fraction,
      locus: largestBiasChange(descendant, parent),
    };
  } finally {
    world.dispose();
  }
}

function attributionCases(candidates: Candidate[]) {
  return candidates.flatMap((candidate) =>
    (["descendant", "parent", "bias-restored"] as const).flatMap((variant) =>
      (["local", "circuit"] as const).map((mixture) => ({
        candidate,
        variant,
        mixture,
        scenario: attributionScenario(candidate, variant, mixture, registration),
      }))
    )
  );
}

async function attributionBudget(root: string, evidence: string) {
  const engine = await loadEngine(),
    binaryDigest = captureEngine(root, engine);
  const candidates = registration.lambdas.map((lambda) =>
    selectCandidate(engine, evidence, lambda)
  );
  const rows = attributionCases(candidates).map(({ scenario }) => {
    const world = scenario.create(engine, 27, false);
    try {
      const initial = world.snapshot();
      const report = world.command("bindingBudget", { cell: 1 });
      const cell = world.command<{ cell: CellState }>("inspect", { cell: 1 }).cell;
      const profile = world.command("genotypeFacts", { id: cell.genome });
      if (hash(initial) !== hash(world.snapshot())) throw new Error("Budget changed World");
      return { name: scenario.name, initialDigest: hash(initial), report, profile, cell };
    } finally {
      world.dispose();
    }
  });
  save(root, "budget.json", { sourceDigest: engine.sourceDigest, binaryDigest, candidates, rows });
  console.log(
    JSON.stringify({
      stage: "attribution-budget",
      candidates: candidates.map((c) => ({
        lambda: c.lambda,
        cell: c.cell.id,
        descendant: c.descendant.id,
        parent: c.parent.id,
        fraction: c.selectedFraction,
        locus: c.locus,
      })),
      ticks: 0,
    })
  );
}

async function attribution(root: string, evidence: string) {
  const archive = JSON.parse(
    readFileSync(join(evidence, "budget.json"), "utf8")
  ) as AttributionArchive;
  const engine = await loadEngine();
  if (
    engine.sourceDigest !== archive.sourceDigest ||
    captureEngine(root, engine) !== archive.binaryDigest
  )
    throw new Error("Kernel differs from registered budgets");
  const results = [];
  for (const { candidate, variant, mixture, scenario } of attributionCases(archive.candidates)) {
    const registered = archive.rows.find((row) => row.name === scenario.name)!;
    const create = scenario.create;
    scenario.create = (...args) => {
      const world = create(...args);
      if (hash(world.snapshot()) !== registered.initialDigest) {
        world.dispose();
        throw new Error("Initial checkpoint differs from budget");
      }
      return world;
    };
    const output = join(root, scenario.name);
    const result = await runQuick(scenario, {
      seed: 27,
      swap: false,
      ticks: 400,
      wallSeconds: 5,
      output,
    });
    if (diskBytes(output) > registration.maxDisk) throw new Error("Disk cap");
    results.push({ lambda: candidate.lambda, variant, mixture, result });
    const group = result.groups[0];
    console.log(
      JSON.stringify({
        lambda: candidate.lambda,
        variant,
        mixture,
        tick: result.ticks,
        stop: result.stop,
        W: group.livingEnergy + group.flows.growth - 0.5,
        biomass: group.livingBiomass,
        flows: group.flows,
        births: group.births,
        offCircuitReaction: group.speciesFlows
          .filter((f) => f.channel === "reaction" && !circuit.has(f.species))
          .reduce((sum, f) => sum + f.amount, 0),
      })
    );
  }
  save(root, "attribution.json", results);
}

const [stage, root, evidence] = process.argv.slice(2);
if (
  !root ||
  !["budget", "panel", "attribution-budget", "attribution"].includes(stage) ||
  (stage !== "budget" && !evidence)
)
  throw new Error(
    "Expected budget NEW_DIRECTORY | panel/attribution-budget/attribution NEW_DIRECTORY EVIDENCE_DIRECTORY"
  );
mkdirSync(root);
if (stage === "budget") await budget(root);
else if (stage === "panel") await panel(root, evidence!);
else if (stage === "attribution-budget") await attributionBudget(root, evidence!);
else await attribution(root, evidence!);

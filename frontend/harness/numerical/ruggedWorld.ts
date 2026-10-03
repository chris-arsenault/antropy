import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { type Definition } from "../../src/engine/types";
import { type EngineWorld } from "../../src/engine/client";
import { loadEngine, captureEngine } from "./engine";
import { readFrame, runRecorded } from "../lib/longRun";
import {
  neighborhoodReport,
  localPairs,
  type Neighborhood,
  type LocalCell,
} from "../lib/ruggedWorldReport";

const save = (root: string, name: string, value: unknown) =>
  writeFileSync(join(root, name), JSON.stringify(value));
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const bytes = (directory: string): number =>
  readdirSync(directory).reduce((sum, file) => {
    const path = join(directory, file),
      stat = statSync(path);
    return sum + (stat.isDirectory() ? bytes(path) : stat.size);
  }, 0);
const arms = ["keyed", "radial"] as const;
const registration = {
  document: "docs/plans/RUGGED-INTERACTION-PLAN.md#M2-expansion-and-experiment-registration",
  seed: 27,
  ticks: 2000,
  cadence: 200,
  wallSeconds: 120,
  probeSeed: 101,
  childrenPerType: 32,
  maxRSS: 2 * 1024 ** 3,
  maxWasm: 1024 ** 3,
  maxDisk: 256 * 1024 ** 2,
};

async function budget(root: string) {
  const engine = await loadEngine(),
    binaryDigest = captureEngine(root, engine),
    rows = [];
  for (const arm of arms) {
    const w = engine.create(27, { preset: "ecology", radialFounders: arm === "radial" });
    try {
      const initial = w.snapshot(),
        frame = readFrame(w),
        definition = w.command<Definition>("definition");
      const cells = [...new Map(frame.cells.map((c) => [c.genome, c])).values()];
      const budgets = cells.map((c) => w.command("bindingBudget", { cell: c.id }));
      const probes = cells.map((c) =>
        w.command<Neighborhood>("recognitionProbe", {
          cell: c.id,
          count: 32,
          seed: 101,
        })
      );
      if (hash(w.snapshot()) !== hash(initial)) throw new Error("Read-only budget altered world");
      writeFileSync(join(root, `${arm}.bin`), initial);
      rows.push({
        arm,
        initialDigest: hash(initial),
        definition,
        frame,
        budgets,
        probes,
        execution: w.command("executionBudget"),
        effects: neighborhoodReport(probes),
      });
      console.log(
        JSON.stringify({
          arm,
          founderTypes: cells.length,
          bytes: initial.length,
          mutationEffects: rows.at(-1)!.effects.distributions,
        })
      );
    } finally {
      w.dispose();
    }
  }
  const a = rows[0],
    b = rows[1];
  const physical = (cells: typeof a.frame.cells) =>
    cells.map((c) => ({ ...c, phenotype: undefined }));
  if (
    JSON.stringify(physical(a.frame.cells)) !== JSON.stringify(physical(b.frame.cells)) ||
    JSON.stringify(a.definition.sources) !== JSON.stringify(b.definition.sources)
  )
    throw new Error("Initial physical conditions differ");
  save(root, "budget.json", {
    registration,
    sourceDigest: engine.sourceDigest,
    binaryDigest,
    rows,
  });
}

function observation(w: EngineWorld, definition: Definition) {
  const { cells } = w.command<{ cells: LocalCell[] }>("assayFrame");
  return {
    trace: w.command("trace"),
    pairs: localPairs(cells, definition.config.width, definition.config.height),
    physical: cells.map(({ cell: c, local, stressLoad }) => ({
      id: c.id,
      genome: c.genome,
      body: c.body,
      stressLoad,
      local: local.flatMap((v, s) => (v ? [[s, v]] : [])),
      action: c.action,
      flows: c.flows,
      chemicalFlows: c.chemicalFlows,
    })),
  };
}

async function panel(root: string, evidence: string) {
  const archive = JSON.parse(readFileSync(join(evidence, "budget.json"), "utf8"));
  const engine = await loadEngine(
    new URL(`file://${join(process.cwd(), evidence, "engine.wasm")}`)
  );
  if (captureEngine(root, engine) !== archive.binaryDigest)
    throw new Error("Archived kernel mismatch");
  const results = [];
  for (const arm of arms) {
    const directory = join(root, arm);
    if (existsSync(join(directory, "result.json"))) {
      const manifest = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8"));
      if (
        manifest.binaryDigest !== archive.binaryDigest ||
        manifest.stop !== "horizon" ||
        manifest.label !== arm ||
        manifest.ticks !== registration.ticks ||
        manifest.initialDigest !==
          archive.rows.find((r: { arm: string }) => r.arm === arm).initialDigest
      )
        throw new Error("Cannot reuse an unmatched or incomplete recorded arm");
      const result = JSON.parse(readFileSync(join(directory, "result.json"), "utf8"));
      const last = JSON.parse(
        readFileSync(join(directory, "samples.jsonl"), "utf8").trim().split("\n").at(-1)!
      );
      results.push({ arm, ...result, trace: last.trace });
      continue;
    }
    const w = engine.restore(new Uint8Array(readFileSync(join(evidence, `${arm}.bin`))));
    try {
      const definition = w.command<Definition>("definition");
      w.command("traceStart");
      const result = runRecorded(engine, w, {
        directory,
        experiment: "rugged-ordinary-world-v52",
        label: arm,
        ticks: 2000,
        cadence: 200,
        checkpointEvery: 2000,
        wallSeconds: 120,
        provenance: {
          registration,
          initialDigest: archive.rows.find((r: { arm: string }) => r.arm === arm).initialDigest,
        },
        observation: (world) => observation(world, definition),
        stop: () => resourceStop(engine.memoryBytes, directory),
      });
      results.push({
        arm,
        ...result,
        trace: w.command("trace"),
      });
    } finally {
      w.dispose();
    }
  }
  save(root, "comparison.json", { registration, sourceDigest: engine.sourceDigest, results });
  console.log(
    JSON.stringify(
      results.map(({ arm, final, stop }) => ({
        arm,
        stop,
        tick: final.tick,
        population: final.population,
        biomass: final.biomass,
        ledger: final.ledger,
        materialResidual: final.materialResidual,
        energyResidual: final.energyResidual,
      }))
    )
  );
}
function resourceStop(wasm: number, directory: string) {
  if (process.memoryUsage().rss > registration.maxRSS) return "RSS cap";
  if (wasm > registration.maxWasm) return "WASM cap";
  if (bytes(directory) > registration.maxDisk) return "Disk cap";
  return null;
}

const [stage, root, evidence] = process.argv.slice(2);
if (!root || !["budget", "panel", "resume"].includes(stage) || (stage !== "budget" && !evidence))
  throw new Error(
    "Expected budget NEW_DIRECTORY | panel NEW_DIRECTORY BUDGET_DIRECTORY | resume PANEL_DIRECTORY BUDGET_DIRECTORY"
  );
if (stage !== "resume") mkdirSync(root);
if (stage === "budget") await budget(root);
else await panel(root, evidence!);

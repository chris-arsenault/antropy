import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { loadEngine, captureEngine } from "./engine";
import { openLedger, recordRun } from "../lib/ledger";

const names = [
  "crossfeeding",
  "crossfeeding-export-off",
  "crossfeeding-processing-off",
  "emission",
  "emission-off",
  "exposure-external-compatible",
  "exposure-external-distant",
  "exposure-internal-compatible",
  "exposure-internal-distant",
  "detoxification",
  "detoxification-off",
  "corpse-capture",
  "corpse-capture-off",
  "barrier",
  "degradation",
  "degradation-off",
  ...[4, 2].flatMap((mesh) => ["left", "right", "off"].map((side) => `sensing-${side}-h${mesh}`)),
];
function horizonFor(name: string) {
  if (name.startsWith("emission")) return 100;
  if (name.startsWith("sensing")) return 120;
  return 300;
}
interface Cell {
  id: number;
  x: number;
  y: number;
  heading: number;
  inputs: number[];
  action: { transport: number[]; swim: number; turn: number };
  chemicalFlows: Record<string, number[]>;
  flows: Record<string, number>;
}
interface Inspection {
  cell: Cell | null;
  exposure: number | null;
}
interface Summary {
  tick: number;
  population: number;
  ledger: { flows: Record<string, number> };
  [key: string]: unknown;
}
const output = process.argv[2];
if (!output) throw new Error("Provide a new output directory");
const selected = process.argv.slice(3);
if (!selected.length || selected.some((name) => !names.includes(name)))
  throw new Error("Name the registered cases explicitly");
mkdirSync(output);
const wasmDigest = captureEngine(output);
const engine = await loadEngine(),
  db = openLedger();
try {
  for (const name of selected) {
    const path = `${output}/${name}`;
    mkdirSync(path);
    const world = engine.diagnostic(name),
      horizon = horizonFor(name);
    writeFileSync(`${path}/initial.antropy`, world.snapshot());
    const initial = world.command<{ cells: { id: number }[] }>("frame");
    writeFileSync(`${path}/definition.json`, JSON.stringify(world.command("definition")));
    writeFileSync(
      `${path}/initial-cells.json`,
      JSON.stringify(initial.cells.map((c) => world.command("inspect", { cell: c.id })))
    );
    const last: Record<number, Inspection> = {},
      traces: unknown[] = [];
    const started = performance.now();
    let stop = "horizon",
      steps = 0;
    while (steps < horizon) {
      if (performance.now() - started > 30000) {
        stop = "wall-cap";
        break;
      }
      const status = world.step();
      steps++;
      for (const c of initial.cells) {
        const sample = world.command<Inspection>("inspect", { cell: c.id });
        if (sample.cell) last[c.id] = sample;
      }
      if (steps % 4 === 0) traces.push({ tick: status.tick, cells: { ...last } });
      if (status.stopReason) {
        stop = status.stopReason;
        break;
      }
      if (!world.command<Summary>("summary").population) {
        stop = "extinction";
        break;
      }
    }
    const wallMs = performance.now() - started,
      summary = world.command<Summary>("summary");
    const id = recordRun(db, {
      experiment: "numerical-chemical-opportunity",
      label: name,
      driver: "wasm",
      seed: 101,
      ticks: summary.tick,
      params: {
        wasmDigest,
        horizon,
        wallCapSeconds: 30,
        registration: "docs/design/chemistry/rebuild-results.md",
      },
      summary: { ...summary, stop, lastLiving: last },
      wallMs,
    });
    writeFileSync(`${path}/final.antropy`, world.snapshot());
    writeFileSync(`${path}/traces.json`, JSON.stringify(traces));
    writeFileSync(
      `${path}/result.json`,
      JSON.stringify({ id, wasmDigest, summary, lastLiving: last, stop, wallMs }, null, 2)
    );
    const cells = Object.fromEntries(
      Object.entries(last).map(([key, value]) => [
        key,
        {
          inputs: value.cell?.inputs.slice(0, 4),
          action: value.cell?.action.transport,
          exposure: value.exposure,
          flows: value.cell?.chemicalFlows,
        },
      ])
    );
    console.log(
      JSON.stringify({
        id,
        name,
        tick: summary.tick,
        population: summary.population,
        constructed: summary.ledger.flows.constructed,
        stop,
      })
    );
    writeFileSync(`${path}/chemical-flows.json`, JSON.stringify(cells, null, 2));
    world.dispose();
  }
} finally {
  db.close();
}

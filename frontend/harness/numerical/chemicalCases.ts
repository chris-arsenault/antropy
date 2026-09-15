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
];
interface Cell {
  id: number;
  x: number;
  y: number;
  inputs: number[];
  action: { transport: number[] };
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
mkdirSync(output);
const wasmDigest = captureEngine(output);
const engine = await loadEngine(),
  db = openLedger();
try {
  for (const name of names) {
    const path = `${output}/${name}`;
    mkdirSync(path);
    const world = engine.diagnostic(name),
      horizon = name.startsWith("emission") ? 100 : 300;
    writeFileSync(`${path}/initial.antropy`, world.snapshot());
    const initial = world.command<{ cells: { id: number }[] }>("frame");
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
        registration: "docs/design/chemistry/numerical-engine.md",
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

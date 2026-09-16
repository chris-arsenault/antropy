import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { loadEngine, captureEngine } from "./engine";
import { openLedger, recordRun } from "../lib/ledger";
import { browserSourceDigest } from "../sourceIdentity";

interface Summary {
  tick: number;
  population: number;
  stopReason: string | null;
  ledger: { divisions: number; flows: Record<string, number> };
  [key: string]: unknown;
}
interface Case {
  interval: number;
  mesh: number;
  supply: boolean;
  moving: boolean;
  horizon: number;
}
// Rebuild registration: one supplied/empty pair at each mesh, fixed 600-tick ceiling.
const cases: Case[] = [4, 2].flatMap((mesh) =>
  [false, true].map((supply) => ({ interval: 0.8, mesh, supply, moving: false, horizon: 600 }))
);
const output = process.argv[2];
if (!output) throw new Error("Provide a new output directory");
mkdirSync(output);
const wasmDigest = captureEngine(output);
const engine = await loadEngine(),
  db = openLedger();
const sourceDigest = browserSourceDigest(process.cwd());
try {
  for (const condition of cases) {
    const name = `nutrition-${condition.supply ? "supply" : "empty"}-${condition.interval}-${condition.mesh}-${condition.moving ? "moving" : "stationary"}-${condition.horizon}`;
    const path = `${output}/${name}`;
    mkdirSync(path);
    const world = engine.diagnostic("nutrition", { ...condition });
    writeFileSync(`${path}/initial.antropy`, world.snapshot());
    writeFileSync(`${path}/definition.json`, JSON.stringify(world.command("definition")));
    const traces: unknown[] = [];
    const initial = world.command<Summary>("summary");
    const started = performance.now();
    let stopping = "horizon";
    while (world.command<Summary>("summary").tick < condition.horizon) {
      if (performance.now() - started > 30000) {
        stopping = "wall-cap";
        break;
      }
      const status = world.step(4);
      const frame = world.command<{ cells: { id: number }[] }>("frame");
      traces.push({
        tick: status.tick,
        cells: frame.cells.map((c) => world.command("inspect", { cell: c.id })),
      });
      if (status.stopReason) {
        stopping = status.stopReason;
        break;
      }
      if (!frame.cells.length) {
        stopping = "extinction";
        break;
      }
    }
    const wallMs = performance.now() - started,
      summary = world.command<Summary>("summary");
    const id = recordRun(db, {
      experiment: "numerical-chemistry-nutrition",
      label: name,
      driver: "wasm",
      seed: 101,
      ticks: summary.tick,
      params: {
        ...condition,
        sourceDigest,
        registration: "docs/design/chemistry/numerical-engine.md",
        wallCapSeconds: 30,
      },
      summary: { ...summary, stopping },
      wallMs,
    });
    writeFileSync(`${path}/final.antropy`, world.snapshot());
    writeFileSync(`${path}/traces.json`, JSON.stringify(traces));
    writeFileSync(
      `${path}/result.json`,
      JSON.stringify(
        { id, condition, sourceDigest, wasmDigest, initial, summary, wallMs, stopping },
        null,
        2
      )
    );
    console.log(
      JSON.stringify({
        id,
        name,
        tick: summary.tick,
        population: summary.population,
        constructed: summary.ledger.flows.constructed,
        imported: summary.ledger.flows.imported,
        divisions: summary.ledger.divisions,
        stopping,
      })
    );
    world.dispose();
  }
} finally {
  db.close();
}

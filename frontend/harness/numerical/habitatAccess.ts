/** Six registered ordinary-controller probes of the actual startup sources. */
import { mkdirSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { type Summary, type Inspection } from "../../src/engine/types";
import { openLedger, recordRun } from "../lib/ledger";
const output = process.argv[2];
if (!output) throw new Error("Provide a new output directory");
mkdirSync(output);
const engine = await loadEngine(),
  binaryDigest = captureEngine(output, engine),
  db = openLedger();
const cases = [false, true].flatMap((second) =>
  ["resident", "near-gap", "empty"].map((position) => ({ second, position }))
);
try {
  for (const { second, position } of cases) {
    const w = engine.diagnostic("isolated-source", { seed: 101, second, founders: 1 });
    if (position === "near-gap") w.command("intervene", { cell: 1, x: 23 });
    if (position === "empty") w.command("intervene", { clearField: true, clearSources: true });
    const name = `${second ? "second" : "first"}-${position}`,
      path = `${output}/${name}`;
    mkdirSync(path);
    writeFileSync(`${path}/initial.antropy`, w.snapshot());
    const initial = w.command<Summary>("summary"),
      samples: Inspection[] = [],
      start = performance.now();
    let stop = "horizon";
    while (w.command<Summary>("summary").tick < 600) {
      if (performance.now() - start > 30000) {
        stop = "wall-cap";
        break;
      }
      samples.push(w.command<Inspection>("inspect", { cell: 1 }));
      const s = w.step(4);
      if (s.stopReason) {
        stop = s.stopReason;
        break;
      }
    }
    const final = w.command<Summary>("summary"),
      wallMs = performance.now() - start;
    const params = {
      second,
      position,
      binaryDigest,
      sourceDigest: engine.sourceDigest,
      horizon: 600,
      wallCapSeconds: 30,
      registration: "docs/design/chemistry/reliability-experiments.md",
    };
    const id = recordRun(db, {
      experiment: "chemistry-habitat-access",
      label: name,
      driver: "wasm-v11",
      seed: 101,
      ticks: final.tick,
      params,
      summary: { ...final, stop },
      wallMs,
    });
    writeFileSync(`${path}/traces.json`, JSON.stringify(samples));
    writeFileSync(`${path}/definition.json`, JSON.stringify(w.command("definition")));
    writeFileSync(`${path}/final.antropy`, w.snapshot());
    writeFileSync(
      `${path}/result.json`,
      JSON.stringify({ id, params, initial, final, stop, wallMs }, null, 2)
    );
    console.log(
      JSON.stringify({
        id,
        name,
        stop,
        tick: final.tick,
        population: final.population,
        divisions: final.ledger.divisions,
        imported: final.ledger.flows.imported,
        constructed: final.ledger.flows.constructed,
        distance: final.ledger.flows.distance,
      })
    );
    w.dispose();
  }
} finally {
  db.close();
}

/** Registered six paired 600-tick daughter probes; no maturation grants or horizon expansion. */
import { mkdirSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { type EngineWorld } from "../../src/engine/client";
import { type Genotype, type Inspection, type Summary } from "../../src/engine/types";
import { openLedger, recordRun } from "../lib/ledger";

const output = process.argv[2];
if (!output) throw new Error("Provide a new output directory");
mkdirSync(output);
const engine = await loadEngine(),
  binaryDigest = captureEngine(output, engine),
  db = openLedger();
const parent = engine.diagnostic("nutrition", { supply: true, moving: false });
const start = performance.now();
while (parent.command<Summary>("summary").ledger.divisions === 0) {
  const status = parent.step();
  if (status.tick >= 600 || status.stopReason || performance.now() - start > 30000)
    throw new Error("Common parent did not reach funded division within registration");
}
const snapshot = parent.snapshot();
writeFileSync(`${output}/funded-daughters.antropy`, snapshot);
const initialTick = parent.command<Summary>("summary").tick;
parent.dispose();
const changes = ["receptor", "importer", "enzyme-target", "enzyme-center", "investment", "empty"];
const requested = process.argv[3];
if (requested && !changes.includes(requested)) throw new Error("Unknown registered comparison");
function mutate(g: Genotype, name: string) {
  for (const c of g.chromosomes) mutateChromosome(c, name);
}
function mutateChromosome(c: Genotype["chromosomes"][number], name: string) {
  if (name === "receptor") c.chemistry.receptors[0].x += 0.12;
  if (name === "importer") c.chemistry.transporters[0].x += 0.12;
  if (name === "enzyme-target") c.chemistry.enzymes[0].x += 0.12;
  if (name === "enzyme-center") c.chemistry.enzymes[0].centerX += 1;
  if (name === "investment") c.physical[7] += 0.12;
}
function sample(w: EngineWorld) {
  const frame = w.command<{ cells: { id: number }[] }>("frame");
  return {
    summary: w.command<Summary>("summary"),
    cells: frame.cells.map((c) => w.command<Inspection>("inspect", { cell: c.id })),
  };
}
const pairs = (requested ? [requested] : changes).flatMap((name) =>
  [false, true].map((changed) => ({ name, changed }))
);
try {
  for (const { name, changed } of pairs) {
    const w = engine.restore(snapshot),
      before = sample(w);
    const g = w.command<Genotype>("genotype", { id: before.cells[0].cell!.genome });
    if (changed) mutate(g, name);
    w.command("replaceLineage", {
      replacement: { lineage: 1, genotypes: changed ? { [g.id]: g } : {} },
    });
    if (name === "empty" && changed)
      w.command("intervene", { clearField: true, clearSources: true });
    const path = `${output}/${name}-${changed ? "changed" : "control"}`;
    mkdirSync(path);
    writeFileSync(`${path}/initial.antropy`, w.snapshot());
    const samples = [sample(w)],
      began = performance.now();
    let stop = "horizon";
    while (w.command<Summary>("summary").tick < initialTick + 600) {
      if (performance.now() - began > 30000) {
        stop = "wall-cap";
        break;
      }
      const status = w.step(4);
      samples.push(sample(w));
      const s = samples[samples.length - 1].summary;
      if (s.ledger.divisions > before.summary.ledger.divisions) {
        stop = "next-division";
        break;
      }
      if (s.ledger.deaths > before.summary.ledger.deaths || status.stopReason) {
        stop = status.stopReason ?? "first-death";
        break;
      }
    }
    const final = samples[samples.length - 1],
      wallMs = performance.now() - began;
    const params = {
      name,
      changed,
      initialTick,
      horizon: 600,
      wallCapSeconds: 30,
      binaryDigest,
      sourceDigest: engine.sourceDigest,
      registration: "docs/design/chemistry/reliability-experiments.md",
    };
    const id = recordRun(db, {
      experiment: "chemistry-inherited-change",
      label: `${name}-${changed}`,
      driver: "wasm",
      seed: 101,
      ticks: final.summary.tick - initialTick,
      params,
      summary: { ...final.summary, stop },
      wallMs,
    });
    writeFileSync(`${path}/final.antropy`, w.snapshot());
    writeFileSync(`${path}/traces.json`, JSON.stringify(samples));
    writeFileSync(
      `${path}/result.json`,
      JSON.stringify({ id, params, before, initial: samples[0], final, stop, wallMs }, null, 2)
    );
    console.log(
      JSON.stringify({
        id,
        name,
        changed,
        stop,
        ticks: final.summary.tick - initialTick,
        constructed:
          final.summary.ledger.flows.constructed - before.summary.ledger.flows.constructed,
        imported: final.summary.ledger.flows.imported - before.summary.ledger.flows.imported,
      })
    );
    w.dispose();
  }
} finally {
  db.close();
}

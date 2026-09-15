import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { loadEngine, captureEngine } from "./engine";
import { openLedger, recordRun } from "../lib/ledger";

const input = process.argv[2],
  output = process.argv[3];
if (!input || !output)
  throw new Error("Provide the completed opportunity directory and a new output directory");
mkdirSync(output);
const wasmDigest = captureEngine(output);
const engine = await loadEngine(),
  db = openLedger();
try {
  const production = engine.diagnostic("barrier");
  production.step(100);
  const saved = production.snapshot();
  for (const remove of [false, true]) {
    const world = engine.restore(saved);
    const inspection = world.command<{ genotype: { chromosomes: { behavior: unknown }[] } }>(
      "inspect",
      { cell: 1 }
    );
    const behavior = world.command("diagnosticController", {
      logits: [0.7, 0, 2, 0, -1, 2, 2, 0, 2],
    });
    inspection.genotype.chromosomes.forEach((ch) => {
      ch.behavior = behavior;
    });
    world.command("intervene", {
      cell: 1,
      genotype: inspection.genotype,
      resetMemory: true,
      ...(remove ? { removeSpecies: 15 } : {}),
    });
    const initial = world.command("inspect", { cell: 1 });
    const traces: unknown[] = [];
    const start = performance.now();
    let steps = 0;
    while (steps < 200 && performance.now() - start < 30000) {
      const status = world.step();
      steps++;
      if (steps % 4 === 0) traces.push(world.command("inspect", { cell: 1 }));
      if (status.stopReason) break;
    }
    const summary = world.command<Record<string, unknown>>("summary");
    const result = {
      removed15: remove,
      initial,
      final: world.command("inspect", { cell: 1 }),
      summary,
      steps,
      wasmDigest,
    };
    const label = `barrier-stopped-${remove ? "removed" : "retained"}`;
    const id = recordRun(db, {
      experiment: "numerical-barrier-motion",
      label,
      driver: "wasm",
      seed: 101,
      ticks: steps,
      params: { horizon: 200, wallCapSeconds: 30, wasmDigest },
      summary: result,
      wallMs: performance.now() - start,
    });
    writeFileSync(`${output}/${label}.json`, JSON.stringify({ id, ...result, traces }, null, 2));
    writeFileSync(`${output}/${label}.antropy`, world.snapshot());
    console.log(JSON.stringify({ id, label, steps }));
    world.dispose();
  }
  production.dispose();
  for (const name of ["degradation", "degradation-off", "barrier"]) {
    const world = engine.restore(readFileSync(`${input}/${name}/final.antropy`));
    const before = world.command("summary");
    const start = performance.now();
    const result =
      name === "barrier"
        ? world.command("diffusionProbe")
        : (() => {
            const held = world.command("inspect", { cell: 1 });
            world.command("intervene", { cell: 1, kill: true });
            return {
              held,
              after: world.command("summary"),
              field15: world.command("field", { kind: "chemical", species: 15 }),
            };
          })();
    const id = recordRun(db, {
      experiment: "numerical-chemical-followup",
      label: name,
      driver: "wasm",
      seed: 101,
      ticks: name === "barrier" ? 10 : 0,
      params: { wasmDigest, checkpoint: `${input}/${name}/final.antropy` },
      summary: { before, result },
      wallMs: performance.now() - start,
    });
    writeFileSync(`${output}/${name}.json`, JSON.stringify({ id, before, result }, null, 2));
    console.log(JSON.stringify({ id, name }));
    world.dispose();
  }
} finally {
  db.close();
}

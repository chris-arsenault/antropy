import { readFileSync, writeFileSync } from "node:fs";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating, measureStorage } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";

/** Six bounded runs using states from the Rust resolution_fixture example. */
async function measure(output: string, population: number, growth: boolean, mesh: number) {
  const engine = await loadEngine(),
    wasmDigest = captureEngine(output, engine),
    name = `${population}-${growth}-h${mesh}`,
    world = engine.restore(readFileSync(`${output}/${name}-initial.antropy`));
  try {
    world.step(10);
    const timing = measureOperating(world, 100, 60),
      { saved, ...storage } = measureStorage(engine, world),
      result = { wasmDigest, population, growth, mesh, ...timing, ...storage };
    writeFileSync(`${output}/${name}-final.antropy`, saved, { flag: "wx" });
    const db = openLedger();
    try {
      const id = recordRun(db, {
        experiment: "numerical-resolution-audit",
        label: "Matched material and population; complete CPU workload; no GPU execution",
        driver: "wasm",
        seed: 101,
        ticks: timing.steps,
        params: { population, growth, mesh, warmup: 10, horizon: 100, wallCapSeconds: 60 },
        summary: result,
        wallMs: timing.wallMs,
      });
      writeFileSync(`${output}/${name}.json`, JSON.stringify({ id, ...result }, null, 2), {
        flag: "wx",
      });
      console.log(JSON.stringify({ id, name, tps: timing.ticksPerSecond, ...storage }));
      return { id, ...result };
    } finally {
      db.close();
    }
  } finally {
    world.dispose();
  }
}

const output = process.argv[2];
if (!output) throw new Error("Provide the new resolution_fixture output directory");
const results = [];
for (const [population, growth] of [
  [48, false],
  [2000, false],
  [2000, true],
] as const) {
  for (const mesh of [4, 2]) results.push(await measure(output, population, growth, mesh));
}
writeFileSync(`${output}/report.json`, JSON.stringify(results, null, 2), { flag: "wx" });

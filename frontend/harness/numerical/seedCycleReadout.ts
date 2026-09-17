/** Read archived states only; no simulation ticks or interventions. */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Engine } from "../../src/engine/client";
import { type Summary } from "../../src/engine/types";

const [directory, output] = process.argv.slice(2);
if (!directory || !output || process.argv.length !== 4)
  throw new Error("Expected recorded case and new readout directory");
mkdirSync(output);
const engine = await Engine.load(readFileSync(join(directory, "engine.wasm")));
const manifest = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8"));
if (manifest.status === "running") throw new Error("Wait for the recorded run to finish");
const checkpoints = readdirSync(directory)
  .filter((name) => /^checkpoint-\d+\.bin$/.test(name))
  .sort((a, b) => Number(a.split("-")[1].split(".")[0]) - Number(b.split("-")[1].split(".")[0]));
const observed = new Set<number>();
for (const name of ["initial.bin", ...checkpoints, "checkpoint.bin"]) {
  const bytes = readFileSync(join(directory, name));
  const world = engine.restore(bytes);
  try {
    const summary = world.command<Summary>("summary");
    const tick = summary.tick;
    if (name.startsWith("checkpoint-") && name !== `checkpoint-${tick}.bin`)
      throw new Error("Checkpoint tick mismatch");
    if (!observed.has(tick))
      writeFileSync(
        join(output, `local-${tick}.json`),
        JSON.stringify(world.command("assayFrame"))
      );
    if (name === "checkpoint.bin") {
      const ancestry: unknown[] = [];
      for (let start = 0; start < summary.ancestryRecords; start += 1000)
        ancestry.push(...world.command<unknown[]>("ancestry", { start, count: 1000 }));
      writeFileSync(join(output, "ancestry.json"), JSON.stringify(ancestry));
    }
    if (Buffer.compare(bytes, world.snapshot())) throw new Error("Readout changed physical bytes");
    observed.add(tick);
    console.log(JSON.stringify({ tick, population: summary.population, unchanged: true }));
  } finally {
    world.dispose();
  }
}

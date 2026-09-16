import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Engine } from "../../src/engine/client";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating, measureStorage } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";

const output = process.argv[2],
  baseline = process.argv[3];
if (!output || !baseline) throw new Error("Provide a new output directory and baseline WASM");
mkdirSync(output);
const oldBytes = new Uint8Array(readFileSync(baseline)),
  db = openLedger(),
  results: unknown[] = [];
writeFileSync(`${output}/baseline.wasm`, oldBytes);

async function run(name: string, initial: Uint8Array, previous: boolean, ticks: number) {
  const engine = previous ? await Engine.load(oldBytes) : await loadEngine(),
    world = engine.restore(initial),
    arm = previous ? "dense" : "active";
  try {
    if (name !== "startup") world.step(10);
    const timing = measureOperating(world, ticks, 60),
      activity = previous ? null : world.command("fieldActivity"),
      { saved, ...storage } = measureStorage(engine, world),
      result = { name, arm, ...timing, activity, ...storage };
    writeFileSync(`${output}/${name}-${arm}-final.antropy`, saved);
    if (!previous) captureEngine(output, engine);
    const id = recordRun(db, {
      experiment: "numerical-threshold-scaling",
      label: "Matched saved h2 states; CPU operating cost, no GPU; bounded threshold correction",
      driver: "wasm",
      seed: 27,
      ticks: timing.steps,
      params: {
        name,
        arm,
        warmup: name === "startup" ? 0 : 10,
        horizon: ticks,
        wallCapSeconds: 60,
        mesh: 2,
      },
      summary: result,
      wallMs: timing.wallMs,
    });
    results.push({ id, ...result });
    console.log(JSON.stringify({ id, name, arm, tps: timing.ticksPerSecond, activity }));
  } finally {
    world.dispose();
  }
}

try {
  for (const width of [160, 320, 640]) {
    const engine = await Engine.load(oldBytes),
      world = engine.create(27, {
        width,
        height: width * 0.75,
        mesh: 2,
        sourceCount: 0,
        mutationRate: 0,
        physicalMutationRate: 0,
        learning: "static",
      });
    world.command("fieldFixture", { kind: "patchy" });
    const initial = world.snapshot(),
      name = `localized-${width}`;
    world.dispose();
    writeFileSync(`${output}/${name}-initial.antropy`, initial);
    for (const previous of [true, false]) await run(name, initial, previous, 100);
  }
  const engine = await Engine.load(oldBytes),
    world = engine.create(27, { mesh: 2 }),
    initial = world.snapshot();
  world.dispose();
  writeFileSync(`${output}/startup-initial.antropy`, initial);
  for (const previous of [true, false]) await run("startup", initial, previous, 600);
} finally {
  db.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(results, null, 2));
}

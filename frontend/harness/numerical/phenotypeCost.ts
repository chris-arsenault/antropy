/** PHENOTYPE-OBSERVATION-PLAN: fixed loads, 10 warm + 100 measured, 60 s/arm. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEngine, captureEngine } from "./engine";
import { measureOperating } from "./performance";
import { openLedger, recordRun } from "../lib/ledger";

const [binary, mode, output] = process.argv.slice(2);
if (!binary || !output || !["closed", "active", "pinned"].includes(mode))
  throw new Error("Expected binary, closed|active|pinned, new output directory");
mkdirSync(output);
const engine = await loadEngine(pathToFileURL(resolve(binary)));
const digest = captureEngine(output, engine),
  database = openLedger(),
  results = [];
try {
  for (const population of [48, 2000]) {
    const world = engine.create(101, { founders: 0, sourceCount: 0, sourceSpecies: [] });
    world.command("loadFixture", { population, growth: false });
    const memoryBefore = engine.memoryBytes;
    if (mode !== "closed") {
      world.command("phenotype", {
        action: "configure",
        enabled: mode === "active",
        highlight: true,
        selection: { kind: "all" },
      });
      if (mode === "pinned")
        world.command("phenotype", { action: "pin", id: "cost", label: "Cost fixture" });
    }
    world.step(10);
    let reportMs = 0,
      reportBytes = 0,
      webBytes = 0;
    const measured = new Proxy(world, {
      get(target, key) {
        if (key !== "step") return Reflect.get(target, key);
        return () => {
          const value = target.step();
          if (mode !== "closed" && value.tick % 25 === 0) {
            const at = performance.now();
            const report = target.command("phenotype", { action: "report" });
            reportBytes = Math.max(reportBytes, JSON.stringify(report).length);
            if (mode === "active") {
              const web = target.command("chemicalWeb", {
                mode: "measured",
                focus: null,
                offset: 0,
              });
              webBytes = Math.max(webBytes, JSON.stringify(web).length);
            }
            reportMs += performance.now() - at;
          }
          return value;
        };
      },
    });
    const timing = measureOperating(measured, 100, 60);
    const summary = {
      ...timing,
      digest,
      population,
      mode,
      reportMs,
      reportBytes,
      webBytes,
      memoryBefore,
      memoryAfter: engine.memoryBytes,
    };
    const id = recordRun(database, {
      experiment: "phenotype-observation-cost",
      label:
        "Fixed load; packed rendering, census and selected inspection; observer reductions each 25 ticks",
      driver: "wasm",
      seed: 101,
      ticks: timing.steps,
      params: { population, mode, warmup: 10, horizon: 100, wallCapSeconds: 60 },
      summary,
      wallMs: timing.wallMs,
    });
    results.push({ id, ...summary });
    console.log(
      JSON.stringify({
        id,
        population,
        mode,
        ticksPerSecond: timing.ticksPerSecond,
        reportMs,
        reportBytes,
        webBytes,
        memoryBefore,
        memoryAfter: engine.memoryBytes,
      })
    );
    world.dispose();
  }
} finally {
  database.close();
  writeFileSync(`${output}/report.json`, JSON.stringify(results, null, 2));
}

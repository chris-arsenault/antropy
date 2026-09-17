/** Registered correction cases; reuse the ordinary runner, observers and resource guards. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Definition } from "../../src/engine/types";
import { habitatObserver } from "../lib/habitatObserver";
import { readFrame, runRecorded } from "../lib/longRun";
import { resourceSample, resourceStop } from "../lib/studyBudget";
import { loadEngine, captureEngine } from "./engine";

const [stage, root] = process.argv.slice(2);
if (!root || !["budget", "renewal1200", "renewal2400", "pilot", "main"].includes(stage))
  throw new Error("Expected budget|renewal1200|renewal2400|pilot|main and study directory");
const engine = await loadEngine();
if (stage === "budget") {
  mkdirSync(root);
  captureEngine(root, engine);
  for (const gap of [1200, 2400])
    writeFileSync(
      join(root, `economy-${gap}.json`),
      JSON.stringify(engine.command("resourceEconomy", { seed: 27, config: { sourceGap: gap } }))
    );
} else {
  const main = stage === "main";
  const directory = join(root, stage);
  const config = stage.startsWith("renewal") ? { sourceGap: Number(stage.slice(7)) } : {};
  const world = engine.create(27, config);
  const definition = world.command<Definition>("definition");
  const deadline = Date.now() + (main ? 1800 : 120) * 1000;
  let nextCheck = 0;
  try {
    const preflight = resourceSample(engine, root, root);
    const stop = resourceStop({ ...preflight, caseBytes: 0, studyBytes: 0 });
    if (stop) throw new Error(stop);
    if (preflight.studyBytes >= 3 * 1024 ** 3)
      throw new Error("Study archive lacks the registered 1 GiB terminal-export reserve");
    world.command("traceStart");
    const observe = habitatObserver(engine, definition, directory, root, false);
    const result = runRecorded(engine, world, {
      directory,
      experiment: "ecology-composition-correction",
      label: `v${definition.version} seed27 ${stage}; local-medium weathering observation`,
      ticks: main ? 50000 : 3000,
      cadence: main ? 250 : 100,
      checkpointEvery: main ? 2500 : 3000,
      wallSeconds: main ? 1800 : 120,
      provenance: {
        registration: main
          ? "ENVIRONMENTAL-ECOLOGY-PLAN.md#weathering-50k"
          : "ENVIRONMENTAL-ECOLOGY-PLAN.md#ecology-correction",
        chemistry: definition.chemistry,
        baseline: 3952,
      },
      observation(w) {
        const observations = observe(w);
        const frame = readFrame(w);
        const families = new Map<number, number>();
        for (const cell of frame.cells)
          if (!families.has(cell.lineage)) families.set(cell.lineage, cell.id);
        const inspections =
          frame.tick % 1000 === 0
            ? [...families.values()].slice(0, 8).map((cell) => w.command("inspect", { cell }))
            : [];
        return { ...observations, inspections };
      },
      stop() {
        const now = Date.now();
        if (now >= deadline) return "study wall cap";
        if (now < nextCheck) return null;
        nextCheck = now + 1000;
        const sample = resourceSample(engine, directory, root);
        if (sample.caseBytes >= 3 * 1024 ** 3 || sample.studyBytes >= 4 * 1024 ** 3)
          return "resource limit: registered archive";
        return resourceStop({ ...sample, caseBytes: 0, studyBytes: 0 });
      },
    });
    writeFileSync(join(directory, "definition.json"), JSON.stringify(definition));
    if (result.stop !== "horizon" && result.stop !== "extinction") process.exitCode = 2;
  } finally {
    world.dispose();
  }
}

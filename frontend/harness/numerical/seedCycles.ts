/** One authorized observation of unchanged default physics before its architectural correction. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Definition } from "../../src/engine/types";
import { habitatObserver } from "../lib/habitatObserver";
import { readFrame, runRecorded } from "../lib/longRun";
import { resourceSample, resourceStop } from "../lib/studyBudget";
import { loadEngine } from "./engine";

const [study] = process.argv.slice(2);
if (!study || process.argv.length !== 3) throw new Error("Expected a new study directory");
mkdirSync(study);
const directory = join(study, "seed27"),
  engine = await loadEngine(),
  world = engine.create(),
  definition = world.command<Definition>("definition"),
  deadline = Date.now() + 1800 * 1000;
let nextCheck = 0;
try {
  world.command("traceStart");
  const observe = habitatObserver(engine, definition, directory, study, false);
  const result = runRecorded(engine, world, {
    directory,
    experiment: "default-seed-cycles",
    label: "seed27 unchanged v15; one 50000-tick temporal observation",
    ticks: 50000,
    cadence: 250,
    checkpointEvery: 10000,
    wallSeconds: 1800,
    provenance: {
      registration: "docs/default-seed-cycles-study.md",
      chemistry: definition.chemistry,
    },
    observation(w) {
      const observations = observe(w);
      const frame = readFrame(w);
      const representatives = new Map<number, number>();
      for (const cell of frame.cells)
        if (!representatives.has(cell.lineage)) representatives.set(cell.lineage, cell.id);
      const inspections =
        frame.tick % 1000 === 0
          ? [...representatives.values()].slice(0, 8).map((cell) => w.command("inspect", { cell }))
          : [];
      return { ...observations, inspections };
    },
    stop() {
      const now = Date.now();
      if (now >= deadline) return "study wall cap";
      if (now < nextCheck) return null;
      nextCheck = now + 1000;
      const sample = resourceSample(engine, directory, study);
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

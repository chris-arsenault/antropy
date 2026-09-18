/** Matched archived-kernel observation; registration owns the pilot escalation decision. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { type CellState, type Definition } from "../../src/engine/types";
import { habitatObserver } from "../lib/habitatObserver";
import { runRecorded } from "../lib/longRun";
import { studyGuard } from "../lib/studyBudget";
import { loadEngine } from "./engine";

const [stage, binary, directory] = process.argv.slice(2);
if (!directory || !binary || !["pilot", "main"].includes(stage))
  throw new Error("Expected pilot|main, WASM path and new case directory");
const root = dirname(directory);
mkdirSync(root, { recursive: true });
const engine = await loadEngine(pathToFileURL(resolve(binary)));
const world = engine.create(27);
const definition = world.command<Definition>("definition");
const main = stage === "main";
const wallSeconds = main ? 900 : 120;
const checkpointEvery = main ? 2500 : 3000;
try {
  world.command("traceStart");
  const observe = habitatObserver(engine, definition, directory, root, false);
  const result = runRecorded(engine, world, {
    directory,
    experiment: "bound-material-impact",
    label: `v${definition.version} seed27 ${stage}; preserved material comparison`,
    ticks: main ? 40000 : 3000,
    cadence: 250,
    checkpointEvery,
    wallSeconds,
    provenance: {
      registration: "docs/bound-material-impact-study.md",
      chemistry: definition.chemistry,
    },
    observation(w) {
      const observations = observe(w);
      const tick = w.command<{ tick: number }>("summary").tick;
      if (tick % checkpointEvery !== 0) return { ...observations, inspections: [] };
      const frame = w.command<{ cells: { cell: CellState }[] }>("assayFrame");
      const bound = Array<number>(256).fill(0);
      const free = Array<number>(256).fill(0);
      for (const { cell } of frame.cells) {
        for (let s = 0; s < 256; s++) {
          free[s] += cell.inventory.amounts[s];
          bound[s] += cell.boundMaterial?.amounts[s] ?? 0;
        }
        if (!cell.boundMaterial)
          bound[definition.chemistry.decomposition] += cell.body.reduce((a, b) => a + b, 0);
      }
      return { ...observations, inspections: [], bodyChemistry: { bound, free } };
    },
    stop: studyGuard(engine, directory, root, Date.now() + wallSeconds * 1000),
  });
  writeFileSync(join(directory, "definition.json"), JSON.stringify(definition));
  if (result.stop !== "horizon" && result.stop !== "extinction") process.exitCode = 2;
} finally {
  world.dispose();
}

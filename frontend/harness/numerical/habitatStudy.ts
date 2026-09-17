/** One registered case per process, with exact initial/final artifacts and bounded samples. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Definition } from "../../src/engine/types";
import { runRecorded } from "../lib/longRun";
import { habitatObserver } from "../lib/habitatObserver";
import { studyGuard, studyLimits } from "../lib/studyBudget";
import { loadEngine } from "./engine";

const [stage, seedText, arm, study] = process.argv.slice(2);
if (
  !["pilot", "main"].includes(stage) ||
  !["27", "101"].includes(seedText) ||
  !["on", "off"].includes(arm) ||
  !study
)
  throw new Error("Expected pilot|main 27|101 on|off existing-study-directory");
const seed = Number(seedText),
  coupled = arm === "on",
  directory = join(study, `${stage}-${seed}-${arm}`),
  registration = JSON.parse(readFileSync(join(study, "registration.json"), "utf8")) as {
    started: number;
  },
  deadline = registration.started + 5.5 * 60 * 60 * 1000,
  engine = await loadEngine(),
  world = engine.create(seed, { chemistrySeed: 101, habitatFeedback: coupled });
try {
  const definition = world.command<Definition>("definition");
  world.command("traceStart");
  const result = runRecorded(engine, world, {
    directory,
    experiment: `environmental-${stage}`,
    label: `seed${seed}; shielding ${arm}; ordinary founders`,
    ticks: stage === "pilot" ? 3000 : 500000,
    cadence: 1000,
    checkpointEvery: 501000,
    wallSeconds: stage === "pilot" ? 300 : 4500,
    provenance: {
      registration: "ENVIRONMENTAL-ECOLOGY-PLAN.md#M3",
      stage,
      studyLimits,
      chemistry: definition.chemistry,
    },
    observation: habitatObserver(engine, definition, directory, study, stage === "main" && coupled),
    stop: studyGuard(engine, directory, study, deadline),
  });
  writeFileSync(join(directory, "definition.json"), JSON.stringify(definition));
  if (result.stop !== "horizon" && result.stop !== "extinction" && result.stop !== "wall cap")
    process.exitCode = 2;
} finally {
  world.dispose();
}

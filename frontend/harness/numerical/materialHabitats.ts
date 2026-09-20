/** Registered 1k pilot and 4k continuation; one seed, no campaign or horizon extension. */
import { readFileSync } from "node:fs";
import { runRecorded } from "../lib/longRun";
import { validateAccounts } from "../lib/studyBudget";
import { type Summary } from "../../src/engine/types";
import { loadEngine } from "./engine";

const [stage, directory, checkpoint] = process.argv.slice(2);
if (!["pilot", "continuation"].includes(stage) || !directory)
  throw new Error("Expected pilot|continuation and new output directory");
if ((stage === "continuation") !== Boolean(checkpoint))
  throw new Error("Only continuation requires the pilot checkpoint");
const engine = await loadEngine();
const world = checkpoint
  ? engine.restore(new Uint8Array(readFileSync(checkpoint)))
  : engine.create(27, {});
try {
  if (!(checkpoint ? [1000, 4000] : [0]).includes(world.command<Summary>("summary").tick))
    throw new Error("Unexpected start tick");
  const result = runRecorded(engine, world, {
    directory,
    experiment: "material-habitats-startup",
    label: `seed27 ${stage}; M4 bounded startup only`,
    ticks: checkpoint ? 5000 : 1000,
    cadence: 100,
    checkpointEvery: 1000,
    wallSeconds: 120,
    provenance: { registration: "MATERIAL-HABITATS-PLAN.md", checkpoint },
    observation(w) {
      validateAccounts(w.command<Summary>("summary"));
      return {};
    },
  });
  console.log(JSON.stringify({ stop: result.stop, final: result.final, wallMs: result.wallMs }));
} finally {
  world.dispose();
}

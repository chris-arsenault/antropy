/** Registered 3,000-tick startup arm; not a full cycle of the v30 illumination. */
import { runRecorded } from "../lib/longRun";
import { validateAccounts } from "../lib/studyBudget";
import { type Summary } from "../../src/engine/types";
import { loadEngine } from "./engine";

const [contrastText, directory] = process.argv.slice(2);
if (!["0", "0.8"].includes(contrastText) || !directory)
  throw new Error("Expected contrast 0|0.8 and new output directory");
const engine = await loadEngine();
const world = engine.create(27, { illuminationContrast: Number(contrastText) });
try {
  const result = runRecorded(engine, world, {
    directory,
    experiment: "illumination-startup",
    label: `ordinary seed27; contrast ${contrastText}; 3,000-tick startup only`,
    ticks: 3000,
    cadence: 100,
    checkpointEvery: 3000,
    wallSeconds: 120,
    provenance: {
      registration: "docs/design/light-ecology.md#scalar-correction-verification-registration",
    },
    observation(w) {
      validateAccounts(w.command<Summary>("summary"));
      return {};
    },
  });
  console.log(JSON.stringify({ stop: result.stop, final: result.final, wallMs: result.wallMs }));
} finally {
  world.dispose();
}

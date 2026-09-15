/** Live/frozen current-world population study; neither arm selects founders. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadEngine } from "../numerical/engine";
import { chemicalConfig } from "./sourceSettings";
import { parseFlags, flag, integerFlag } from "./flags";
import { runRecorded, requireRegistration } from "./longRun";

async function run() {
  const flags = parseFlags(process.argv.slice(2)),
    engine = await loadEngine(),
    config = chemicalConfig(flags, engine);
  const seed = integerFlag(flags, "seed", 101),
    ticks = integerFlag(flags, "ticks", 50000),
    frozen = flag(flags, "frozen", "false") === "true";
  const justification = requireRegistration(flags, ticks),
    label = `${frozen ? "frozen" : "live"}-${seed}`;
  if (frozen) {
    config.mutationRate = 0;
    config.physicalMutationRate = 0;
    config.learningRetention = 0;
  }
  const root = flag(flags, "output", "harness/artifacts/chemical-population");
  mkdirSync(root, { recursive: true });
  const world = engine.create(seed, config);
  try {
    runRecorded(engine, world, {
      directory: join(root, label),
      experiment: "chemical-population",
      label,
      ticks,
      cadence: 500,
      checkpointEvery: 25000,
      wallSeconds: integerFlag(flags, "wall-seconds", 3600),
      provenance: { frozen, justification },
    });
  } finally {
    world.dispose();
  }
}
await run();

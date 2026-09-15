import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadEngine } from "./numerical/engine";
import { chemicalConfig, twoSourceMixtures } from "./lib/sourceSettings";
import { parseFlags, flag, integerFlag } from "./lib/flags";
import { runRecorded, requireRegistration } from "./lib/longRun";

async function run() {
  const flags = parseFlags(process.argv.slice(2)),
    engine = await loadEngine(),
    config = chemicalConfig(flags, engine);
  const seed = integerFlag(flags, "seed", 101),
    frozen = flag(flags, "frozen", "false") === "true",
    phase = integerFlag(flags, "phase-ticks", 50000);
  const ticks = phase * 3,
    justification = requireRegistration(flags, ticks),
    label = `${frozen ? "frozen" : "live"}-${seed}`;
  config.sourceEpochs = { phaseTicks: phase, mixtures: twoSourceMixtures([0.8, 0.2], config) };
  config.sourceZones = null;
  if (frozen) {
    config.mutationRate = 0;
    config.physicalMutationRate = 0;
    config.learningRetention = 0;
  }
  const root = flag(flags, "output", "harness/artifacts/chemical-epochs");
  mkdirSync(root, { recursive: true });
  const world = engine.create(seed, config);
  // Greatest common divisor ensures every phase boundary is sampled and checkpointed.
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  try {
    runRecorded(engine, world, {
      directory: join(root, label),
      experiment: "food-epochs",
      label,
      ticks,
      cadence: gcd(1000, phase),
      checkpointEvery: phase,
      wallSeconds: integerFlag(flags, "wall-seconds", 3600),
      provenance: { frozen, justification },
      observation: (w) => ({
        epoch: Math.floor(w.command<{ tick: number }>("summary").tick / phase) % 2,
      }),
    });
  } finally {
    world.dispose();
  }
}
await run();

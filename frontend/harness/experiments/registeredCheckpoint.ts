import { writeFileSync } from "node:fs";
import { createRegisteredWorld, stepWorld } from "../../src/sim/world";
import { encodeCheckpoint, decodeCheckpoint } from "../../src/persist/checkpoint";
import { flag, integerFlag, type Flags } from "../lib/flags";
import { loadColonyModel, digest, physicsDigest } from "../lib/colonyArtifacts";
import { colonyOutcomePoint } from "../lib/colonyOutcome";
import { openLedger, recordRun } from "../lib/ledger";

export function runRegisteredCheckpoint(flags: Flags): void {
  const model = loadColonyModel(flag(flags, "model", "")),
    output = flag(flags, "output", "");
  if (model.version !== 5 || !output)
    throw new Error("registered-checkpoint needs --model and --output");
  const seed = integerFlag(flags, "seed", 41),
    ticks = integerFlag(flags, "ticks", 12000),
    started = Date.now();
  const world = createRegisteredWorld(seed, model);
  for (let tick = 0; tick < ticks; tick++) stepWorld(world);
  const checkpoint = encodeCheckpoint(world),
    point = colonyOutcomePoint(world);
  const restored = decodeCheckpoint(checkpoint);
  for (let tick = 0; tick < 8; tick++) {
    stepWorld(world);
    stepWorld(restored);
  }
  if (encodeCheckpoint(world) !== encodeCheckpoint(restored))
    throw new Error("playback continuation diverged");
  writeFileSync(output, checkpoint);
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "registered-review-checkpoint",
    label: output,
    driver: "registered-runtime",
    seed,
    ticks,
    params: { modelHash: digest(JSON.stringify(model)), physics: physicsDigest() },
    summary: { point, checkpointHash: digest(checkpoint), exactContinuationTicks: 8 },
    wallMs: Date.now() - started,
  });
  database.close();
  console.log(JSON.stringify({ id, output, point, exactContinuationTicks: 8 }));
}

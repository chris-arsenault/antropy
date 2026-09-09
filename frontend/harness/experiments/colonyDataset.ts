import { closeSync, openSync, writeSync, writeFileSync } from "node:fs";
import { PROGRAMMED_LIFECYCLE_CONFIG } from "../../src/sim/config";
import {
  colonyMotor,
  encodeColonyFrame,
  COLONY_INPUT_COUNT,
} from "../../src/sim/controller/colonyEncoding";
import { actColonyNetwork, createColonyState } from "../lib/learnedColony";
import { programmedColony } from "../../src/sim/policies/colony";
import { COLONY_OBSERVATION_CONTRACT } from "../../src/sim/controller/colonyObservation";
import { createWorld, stepWorld } from "../../src/sim/world";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { digest, loadColonyModel, physicsDigest } from "../lib/colonyArtifacts";
import { openLedger, recordRun } from "../lib/ledger";

function recordDataset(output: string, metadata: Record<string, unknown>, started: number): void {
  writeFileSync(`${output}.json`, JSON.stringify(metadata));
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "colony-training-data",
    label: output,
    driver: metadata.modelHash ? "learner-rollout-teacher-labels" : "programmed-teacher",
    seed: (metadata.seeds as number[])[0],
    ticks: metadata.ticks as number,
    params: metadata,
    summary: { rows: metadata.rows, counts: metadata.counts },
    wallMs: Date.now() - started,
  });
  database.close();
  console.log(`Recorded dataset run ${id}`);
}

function datasetOutput(flags: Flags): string {
  const output = flag(flags, "output", "");
  if (!output) throw new Error("colony-dataset requires --output path");
  return output;
}

export function runColonyDataset(flags: Flags): void {
  const seeds = seedsFlag(flags, "1,2,3");
  const ticks = integerFlag(flags, "ticks", 12_000);
  const output = datasetOutput(flags);
  const modelPath = flag(flags, "model", "");
  const model = datasetModel(modelPath);
  const inputs = model?.inputs ?? COLONY_INPUT_COUNT;
  const counts = new Array<number>(8).fill(0);
  const started = Date.now();
  const descriptor = openSync(`${output}.f32`, "w");
  let rows = 0;
  try {
    for (const seed of seeds) {
      const world = createWorld(seed, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG);
      const states = new Map<number, Float32Array>();
      const pending: number[] = [];
      for (let tick = 0; tick < ticks; tick++) {
        stepWorld(world, (frame, ant) => {
          const teacher = programmedColony(frame);
          const motor = colonyMotor(teacher);
          pending.push(
            ...encodeColonyFrame(frame),
            ...(model && model.version !== 1
              ? (states.get(ant.id) ?? createColonyState(model)).slice(model.hidden)
              : []),
            motor,
            teacher.pheromoneA,
            teacher.pheromoneB,
            seed,
            ant.id,
            world.tick
          );
          rows++;
          counts[motor]++;
          if (!model) return teacher;
          const state = states.get(ant.id) ?? createColonyState(model);
          states.set(ant.id, state);
          return actColonyNetwork(model, frame, state);
        });
        if (pending.length >= 117_000) {
          const batch = Float32Array.from(pending);
          writeSync(descriptor, Buffer.from(batch.buffer));
          pending.length = 0;
        }
      }
      if (pending.length) writeSync(descriptor, Buffer.from(Float32Array.from(pending).buffer));
      console.log(
        JSON.stringify({
          seed,
          ticks,
          workers: world.ants.length,
          queen: world.queen.energy,
          rows,
          counts,
        })
      );
    }
  } finally {
    closeSync(descriptor);
  }
  const metadata = {
    version: 1,
    observationContract: COLONY_OBSERVATION_CONTRACT,
    inputs,
    columns: inputs + 6,
    rows,
    counts,
    seeds,
    ticks,
    modelHash: model ? digest(JSON.stringify(model)) : null,
    physics: physicsDigest(),
    config: PROGRAMMED_LIFECYCLE_CONFIG,
  };
  recordDataset(output, metadata, started);
}

function datasetModel(path: string) {
  const model = path ? loadColonyModel(path) : null;
  if (model?.version === 5) throw new Error("use registered rollouts for task-aware models");
  return model;
}

import { writeFileSync } from "node:fs";
import { type ColonyFrame } from "../../src/sim/colonySensors";
import { type RegisteredModel } from "../../src/sim/controller/registeredModel";
import {
  actRegistered,
  encodeRegisteredFrame,
  registeredLogits,
  registeredAction,
} from "../../src/sim/controller/registeredNetwork";
import { colonyMotor } from "../../src/sim/controller/colonyEncoding";
import { createRegisteredWorld, stepWorld } from "../../src/sim/world";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { loadColonyModel, digest, physicsDigest } from "../lib/colonyArtifacts";
import { colonyOutcomePoint } from "../lib/colonyOutcome";
import { openLedger, recordRun } from "../lib/ledger";
import { ColonyCare } from "../lib/colonyCare";
import { TaskTelemetry } from "../lib/taskTelemetry";

function responses(model: RegisteredModel, frame: ColonyFrame, state: Float32Array): number[] {
  return Array.from({ length: model.tasks }, (_, task) => {
    const copy = state.slice(),
      history = copy.subarray(model.hidden, model.hidden + model.history * 8);
    const logits = registeredLogits(
      model,
      encodeRegisteredFrame(model, { ...frame, task }, history),
      copy
    );
    return colonyMotor(registeredAction({ ...model, temperature: 0 }, logits, 0, 0));
  });
}

function probe(model: RegisteredModel, seed: number, ticks: number) {
  const world = createRegisteredWorld(seed, model),
    care = new ColonyCare(),
    tasks = new TaskTelemetry();
  const patterns: Record<string, number> = {};
  let loaded = 0,
    tested = 0,
    taskSensitive = 0;
  for (let tick = 0; tick < ticks; tick++)
    stepWorld(world, (frame, ant) => {
      if (frame.cargo > 0 && ++loaded % 16 === 0) {
        const motors = responses(model, frame, ant.controllerState);
        const key = motors.join(",");
        patterns[key] = (patterns[key] ?? 0) + 1;
        tested++;
        taskSensitive += Number(new Set(motors).size > 1);
      }
      const action = actRegistered(model, frame, ant.controllerState);
      care.observe(frame, action);
      tasks.observe(frame, action);
      return action;
    });
  return {
    seed,
    loaded,
    tested,
    taskSensitive,
    patterns,
    care: care.counts,
    tasks: tasks.counts,
    final: colonyOutcomePoint(world),
  };
}

export function runRegisteredProbe(flags: Flags): void {
  const model = loadColonyModel(flag(flags, "model", ""));
  if (model.version !== 5) throw new Error("registered-probe needs a registered model");
  const seeds = seedsFlag(flags, "41"),
    ticks = integerFlag(flags, "ticks", 8000),
    started = Date.now();
  const results = seeds.map((seed) => probe(model, seed, ticks));
  const params = {
    modelHash: digest(JSON.stringify(model)),
    physics: physicsDigest(),
    seeds,
    ticks,
    probe: "loaded-frame-task-counterfactual-argmax",
    sampledEvery: 16,
  };
  const database = openLedger();
  const id = recordRun(database, {
    experiment: "registered-task-probe",
    label: flag(flags, "label", ""),
    driver: "registered-local-counterfactual",
    seed: seeds[0],
    ticks,
    params,
    summary: { results },
    wallMs: Date.now() - started,
  });
  database.close();
  const output = flag(flags, "output", "");
  if (output) writeFileSync(output, JSON.stringify({ id, params, results }));
  console.log(JSON.stringify({ id, results }));
}

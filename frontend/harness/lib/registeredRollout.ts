import { writeFileSync } from "node:fs";
import { createRegisteredWorld, stepWorld } from "../../src/sim/world";
import { type World } from "../../src/sim/types";
import { type RegisteredModel } from "../../src/sim/controller/registeredModel";
import {
  encodeRegisteredFrame,
  registeredLogits,
  registeredAction,
  registeredRandom,
} from "../../src/sim/controller/registeredNetwork";
import { colonyMotor } from "../../src/sim/controller/colonyEncoding";
import { rememberMotor } from "../../src/sim/controller/directionalEncoding";
import { programmedColony } from "../../src/sim/policies/colony";
import { colonyOutcomePoint, scoreColonyOutcome, type ColonyOutcomePoint } from "./colonyOutcome";
import { TaskTelemetry } from "./taskTelemetry";
import { senseColony } from "../../src/sim/colonySensors";
import { sense } from "../../src/sim/sensors";
import { validateWorldCases, type ColonyWorldCase } from "./colonyWorlds";

export interface RolloutRequest {
  model: RegisteredModel;
  output: string;
  worlds: readonly ColonyWorldCase[];
  ticks: number;
  warmup: number;
}

function logProbability(logits: Float32Array, index: number, temperature: number): number {
  const maximum = Math.max(...logits);
  const sum = logits.reduce((total, value) => total + Math.exp((value - maximum) / temperature), 0);
  return (logits[index] - maximum) / temperature - Math.log(sum);
}

/** Training-only physical potential. No movement, cargo, pickup or teacher agreement reward. */
function potential(world: World): number {
  const point = colonyOutcomePoint(world);
  return (
    point.queenReserve / 24 +
    0.02 * (point.workerReserve + point.broodReserve + point.broodInvestment) +
    point.queenFed * 0.5 +
    point.broodFed * 0.25 +
    point.births * 2
  );
}

export class RegisteredRollouts {
  private readonly worlds = new Map<number, World>();
  private readonly series = new Map<number, ColonyOutcomePoint[]>();
  private readonly definitions = new Map<number, string>();

  private world(request: RolloutRequest, entry: ColonyWorldCase): World {
    const definition = JSON.stringify(entry);
    const oldDefinition = this.definitions.get(entry.id);
    if (oldDefinition && oldDefinition !== definition)
      throw new Error("world identity changed config");
    this.definitions.set(entry.id, definition);
    const previous = this.worlds.get(entry.id);
    if (previous && previous.ants.length && previous.tick < 48000) {
      previous.registeredController = request.model;
      return previous;
    }
    const world = createRegisteredWorld(entry.seed, request.model, entry.config);
    for (let tick = 0; tick < request.warmup; tick++) stepWorld(world, programmedColony);
    for (const ant of world.ants) ant.task = 0;
    this.worlds.set(entry.id, world);
    this.series.set(entry.id, [colonyOutcomePoint(world)]);
    return world;
  }

  private survivalBonus(world: World, caseId: number): number {
    const series = this.series.get(caseId)!;
    if (world.tick % 2000 === 0) series.push(colonyOutcomePoint(world));
    if (world.tick < 48000) return 0;
    return Number(scoreColonyOutcome(series, world.config.workerLifespan).viable) * 100;
  }

  collect(request: RolloutRequest) {
    const rows: number[][] = [],
      summaries = [],
      bootstrap = [];
    const tasks = new TaskTelemetry();
    for (const entry of validateWorldCases(request.worlds)) {
      const world = this.world(request, entry),
        start = colonyOutcomePoint(world);
      for (let tick = 0; tick < request.ticks && world.ants.length && world.tick < 48000; tick++) {
        this.step(world, request.model, rows, tasks, entry.id);
      }
      summaries.push({ ...entry, start, final: colonyOutcomePoint(world) });
      for (const ant of world.ants) {
        const history = ant.controllerState.subarray(
          request.model.hidden,
          request.model.hidden + request.model.history * 8
        );
        const frame = senseColony(world, { ...ant, lastInputs: sense(world, ant) });
        bootstrap.push({
          caseId: entry.id,
          id: ant.id,
          inputs: [...encodeRegisteredFrame(request.model, frame, history)],
          state: [...ant.controllerState.subarray(0, request.model.hidden)],
        });
      }
    }
    const columns = request.model.inputs + request.model.hidden + 8;
    const values = Float32Array.from(rows.flat());
    writeFileSync(request.output, Buffer.from(values.buffer));
    return { rows: rows.length, columns, summaries, tasks: tasks.counts, bootstrap };
  }

  private step(
    world: World,
    model: RegisteredModel,
    rows: number[][],
    tasks: TaskTelemetry,
    caseId: number
  ): void {
    const start = rows.length,
      before = potential(world),
      queenAlive = world.queen.alive;
    stepWorld(world, (frame, ant) => {
      const state = ant.controllerState,
        history = state.subarray(model.hidden, model.hidden + model.history * 8);
      const inputs = encodeRegisteredFrame(model, frame, history);
      const previous = [...state.subarray(0, model.hidden)];
      const logits = registeredLogits(model, inputs, state);
      const action = registeredAction(
        model,
        logits,
        registeredRandom(state),
        registeredRandom(state)
      );
      const motor = colonyMotor(action),
        task = action.task === null ? 0 : action.task + 1;
      const logp =
        logProbability(logits.subarray(0, 8), motor, model.temperature) +
        logProbability(logits.subarray(10), task, model.temperature);
      rows.push([...inputs, ...previous, motor, task, logp, 0, 0, caseId, ant.id, world.tick]);
      rememberMotor(history, motor);
      tasks.observe(frame, action);
      return action;
    });
    const reward =
      potential(world) -
      before +
      (world.queen.alive ? 0.0001 : 0) -
      Number(queenAlive && !world.queen.alive) * 10 +
      this.survivalBonus(world, caseId);
    const living = new Set(world.ants.map((ant) => ant.id)),
      offset = model.inputs + model.hidden;
    for (let i = start; i < rows.length; i++) {
      rows[i][offset + 3] = reward;
      rows[i][offset + 4] = Number(!living.has(rows[i][offset + 6]) || world.tick >= 48000);
    }
  }
}

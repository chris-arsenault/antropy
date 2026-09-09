import { PROGRAMMED_LIFECYCLE_CONFIG, type SimConfig } from "../../src/sim/config";
import { programmedColony } from "../../src/sim/policies/colony";
import { createWorld, createRegisteredWorld, stepWorld } from "../../src/sim/world";
import { createColonyState, actColonyNetwork, type ColonyModel } from "./learnedColony";
import { colonyMotor } from "../../src/sim/controller/colonyEncoding";
import { colonyOutcomePoint, removeExternalSupply, scoreColonyOutcome } from "./colonyOutcome";
import { ColonyMotion } from "./colonyMotion";
import { ColonyCare } from "./colonyCare";
import { TaskTelemetry } from "./taskTelemetry";
import { type Ant, type World } from "../../src/sim/types";
import { type ColonyFrame } from "../../src/sim/colonySensors";
import { overrideTask, validTask } from "../../src/sim/taskMemory";

function validateHorizon(ticks: number, deprivation: number, warmup: number): void {
  if (
    !Number.isSafeInteger(ticks) ||
    ticks <= 0 ||
    !Number.isSafeInteger(deprivation) ||
    deprivation < 0 ||
    deprivation >= ticks ||
    !Number.isSafeInteger(warmup) ||
    warmup < 0
  )
    throw new Error("outcome horizon must be positive and deprivation must precede its endpoint");
}

function outcomeWorld(model: ColonyModel | null, seed: number, warmup: number, config: SimConfig) {
  const world =
    model?.version === 5
      ? createRegisteredWorld(seed, model, config)
      : createWorld(seed, "programmed-lifecycle", config);
  for (let tick = 0; tick < warmup; tick++) stepWorld(world, programmedColony);
  if (model)
    for (const ant of world.ants) {
      ant.controllerState = createColonyState(model, seed ^ Math.imul(ant.id, 2654435761));
      ant.task = 0;
      ant.taskAge = 0;
      ant.taskChanges = 0;
    }
  return world;
}

function actorState(model: ColonyModel | null, ant: Ant, states: Map<number, Float32Array>) {
  if (model?.version === 5) return ant.controllerState;
  if (!model) return new Float32Array();
  const state = states.get(ant.id) ?? createColonyState(model);
  states.set(ant.id, state);
  return state;
}

function clampFrame(world: World, ant: Ant, frame: ColonyFrame, clamp: number | null) {
  if (clamp === null) return frame;
  overrideTask(world, ant.id, clamp);
  return { ...frame, task: clamp };
}

function validateClamp(model: ColonyModel | null, clamp: number | null): void {
  if (clamp === null) return;
  if (!validTask(clamp) || model?.version !== 5 || clamp >= model.tasks)
    throw new Error("task clamp requires a value in a registered model's vocabulary");
}

export function runColonyOutcome(
  model: ColonyModel | null,
  seed: number,
  ticks: number,
  deprivation = 0,
  warmup = 0,
  taskClamp: number | null = null,
  config: SimConfig = PROGRAMMED_LIFECYCLE_CONFIG
) {
  validateHorizon(ticks, deprivation, warmup);
  validateClamp(model, taskClamp);
  const world = outcomeWorld(model, seed, warmup, config),
    states = new Map<number, Float32Array>();
  const motion = new ColonyMotion();
  const care = new ColonyCare();
  const tasks = new TaskTelemetry();
  const series = [colonyOutcomePoint(world)];
  let removedEnergy = 0;
  for (let tick = 0; tick < ticks; tick++) {
    if (deprivation > 0 && tick === deprivation) removedEnergy = removeExternalSupply(world);
    stepWorld(world, (frame, ant) => {
      frame = clampFrame(world, ant, frame, taskClamp);
      const state = actorState(model, ant, states);
      const action = model ? actColonyNetwork(model, frame, state) : programmedColony(frame);
      care.observe(frame, action);
      tasks.observe(frame, action);
      motion.observe(ant.id, ant.x, ant.y, colonyMotor(action));
      return action;
    });
    if ((tick + 1) % 2000 === 0 || tick + 1 === ticks)
      series.push(colonyOutcomePoint(world, removedEnergy));
  }
  return {
    seed,
    warmup,
    taskClamp,
    ...scoreColonyOutcome(series, world.config.workerLifespan),
    series,
    motion: motion.counts,
    care: care.counts,
    tasks: tasks.counts,
  };
}

import { IDLE_ACTION, INPUT_COUNT } from "./controller/contract";
import { createControllerState } from "./controller/runtime";
import { headingBetween, type Point } from "./geometry";
import { type Ant, type Queen, type World } from "./types";
import { createDecisionState } from "./colony/contract";

export function createAnt(
  world: Pick<World, "nest" | "config" | "tick" | "seed" | "registeredController">,
  id: number,
  age = 0,
  point: Point = world.nest.start,
  energy = world.config.initialEnergy
): Ant {
  return {
    caste: "worker",
    job: null,
    brood: null,
    spoil: null,
    decision: createDecisionState(),
    id,
    x: point.x,
    y: point.y,
    heading: headingBetween(world.nest.start, world.nest.primaryRoute[1] ?? world.nest.entrance),
    cargo: 0,
    energy,
    distanceMoved: 0,
    turns: 0,
    previousTurn: 0,
    immediateTurnReversals: 0,
    lastInputs: new Float32Array(INPUT_COUNT),
    lastAction: IDLE_ACTION,
    controllerState: createControllerState(world.registeredController, world.seed, id),
    task: 0,
    taskAge: 0,
    taskChanges: 0,
    age,
    birthTick: world.tick - age,
    pickupTick: null,
  };
}

export function createQueen(world: Parameters<typeof createAnt>[0], id: number): Queen {
  return {
    ...createAnt(world, id, 0, world.nest.home, world.config.queenEnergy),
    caste: "queen",
    carrier: null,
    layingAge: 0,
    alive: true,
  };
}

import { type Action } from "./controller/contract";
import { cellIndex } from "./grid";
import { normalizeHeading, stepFrom } from "./geometry";
import { depositChemical, isWalkable } from "./scent";
import { type Ant, type World } from "./types";
import { occupied } from "./contact";
import { eat, feed, operateMandibles, releaseFood } from "./feeding";
import { spend } from "./resources";
import { writeTask } from "./taskMemory";
import { followCarrier } from "./construction/transport";
import { canAct, carried, reproductive } from "./adultBody";
import { updateLandmark } from "./colony/knowledge";

function depositPheromones(world: World, ant: Ant, action: Action): void {
  if (!action.move || action.turn !== 0 || action.mandible) return;
  const amountA =
    Math.max(0, Math.min(1, action.pheromoneA)) * world.config.chemistry.pheromoneDeposit;
  const amountB =
    Math.max(0, Math.min(1, action.pheromoneB)) * world.config.chemistry.pheromoneDeposit;
  if (amountA === 0 && amountB === 0) return;
  const index = cellIndex(world.grid, ant.x, ant.y);
  depositChemical(world.pheromoneA, index, amountA);
  depositChemical(world.pheromoneB, index, amountB);
  const total = amountA + amountB;
  world.metrics.pheromoneDeposited += total;
  spend(world, ant, total * world.config.pheromoneCost);
}

function turn(world: World, ant: Ant, direction: -1 | 1): void {
  if (ant.previousTurn === -direction) ant.immediateTurnReversals += 1;
  ant.previousTurn = direction;
  ant.heading = normalizeHeading(ant.heading + direction);
  ant.turns += 1;
  spend(world, ant, world.config.turnCost);
}

function move(world: World, ant: Ant): boolean {
  if (carried(world, ant)) return false;
  const target = stepFrom(ant, ant.heading);
  const cost = movementCost(world, ant);
  if (ant.energy < cost) return false;
  spend(world, ant, cost);
  if (!isWalkable(world.grid, target.x, target.y) || occupied(world, target, ant)) {
    world.metrics.failedMoves += 1;
    return false;
  }
  ant.x = target.x;
  ant.y = target.y;
  followCarrier(world, ant);
  if (reproductive(ant)) updateLandmark(world, -2, ant);
  ant.distanceMoved += 1;
  world.economy.movement += 1;
  ant.previousTurn = 0;
  return true;
}

function movementCost(world: World, ant: Ant): number {
  return (
    world.config.moveCost +
    (reproductive(ant) ? world.config.queenCarryCost : 0) +
    (ant.spoil === null ? 0 : world.config.spoilCarryCost) +
    (world.queen.carrier === ant.id ? world.config.queenCarryCost : 0) +
    (ant.brood !== null ? world.config.spoilCarryCost : 0)
  );
}

export function applyActionToAnt(world: World, ant: Ant, action: Action): void {
  ant.lastAction = action;
  if (!canAct(world, ant)) return;
  writeTask(ant, action.task);
  if (action.eat) eat(world, ant);
  else if (action.feed) feed(world, ant);
  else if (action.release) {
    spend(world, ant, world.config.mandibleCost);
    releaseFood(world, ant, true);
  } else if (action.mandible) operateMandibles(world, ant);
  else if (action.turn !== 0) turn(world, ant, action.turn);
  else if (action.move && move(world, ant)) depositPheromones(world, ant, action);
}

export function applyAction(world: World, action: Action): void {
  applyActionToAnt(world, world.ant, action);
}

/** Absolute requests orient the body and pay the same per-angle turning cost before acting. */
export function applyDirectedAction(world: World, ant: Ant, heading: number, action: Action): void {
  const difference = normalizeHeading(heading - ant.heading);
  const turns = Math.min(difference, 8 - difference);
  spend(world, ant, turns * world.config.turnCost);
  ant.turns += turns;
  ant.heading = heading;
  applyActionToAnt(world, ant, action);
}

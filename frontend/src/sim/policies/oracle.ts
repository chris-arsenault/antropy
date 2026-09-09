import { type Action, IDLE_ACTION } from "../controller/contract";
import { cellIndex, pointAt } from "../grid";
import {
  DIRECTIONS,
  headingBetween,
  samePoint,
  stepFrom,
  turnToward,
  type Point,
} from "../geometry";
import { isWalkable } from "../scent";
import { type World } from "../types";

interface RouteChoice {
  readonly next: Point | null;
  readonly target: Point;
}

function targetBeside(world: World, point: Point): Point | null {
  for (const direction of DIRECTIONS) {
    const target = { x: point.x + direction.x, y: point.y + direction.y };
    if (world.ant.cargo > 0) {
      if (samePoint(target, world.cache)) return target;
    } else if (world.foodSources.has(cellIndex(world.grid, target.x, target.y))) {
      return target;
    }
  }
  return null;
}

function reconstructNext(world: World, parent: Int32Array, goal: number): Point | null {
  const start = cellIndex(world.grid, world.ant.x, world.ant.y);
  if (goal === start) return null;
  let cursor = goal;
  while (parent[cursor] !== start) {
    cursor = parent[cursor];
    if (cursor < 0) return null;
  }
  return pointAt(world.grid, cursor);
}

function enqueueNeighbors(
  world: World,
  point: Point,
  current: number,
  parent: Int32Array,
  queue: Int32Array,
  write: number
): number {
  let nextWrite = write;
  for (const direction of DIRECTIONS) {
    const x = point.x + direction.x;
    const y = point.y + direction.y;
    if (!isWalkable(world.grid, x, y)) continue;
    const index = cellIndex(world.grid, x, y);
    if (parent[index] !== -1) continue;
    parent[index] = current;
    queue[nextWrite++] = index;
  }
  return nextWrite;
}

function findRoute(world: World): RouteChoice | null {
  const start = cellIndex(world.grid, world.ant.x, world.ant.y);
  const parent = new Int32Array(world.grid.cells.length).fill(-1);
  const queue = new Int32Array(world.grid.cells.length);
  parent[start] = start;
  queue[0] = start;
  let read = 0;
  let write = 1;
  while (read < write) {
    const current = queue[read++];
    const point = pointAt(world.grid, current);
    const target = targetBeside(world, point);
    if (target) return { next: reconstructNext(world, parent, current), target };
    write = enqueueNeighbors(world, point, current, parent, queue, write);
  }
  return null;
}

function orientOrMove(world: World, destination: Point): Action {
  const desired = headingBetween(world.ant, destination);
  const turn = turnToward(world.ant.heading, desired);
  return turn === 0
    ? {
        ...IDLE_ACTION,
        move: true,
        pheromoneA: world.ant.cargo > 0 ? 0 : 1,
        pheromoneB: world.ant.cargo > 0 ? 1 : 0,
      }
    : { ...IDLE_ACTION, turn };
}

export function oracleAction(world: World): Action {
  const route = findRoute(world);
  if (!route) return IDLE_ACTION;
  if (route.next) return orientOrMove(world, route.next);
  const desired = headingBetween(world.ant, route.target);
  const turn = turnToward(world.ant.heading, desired);
  return turn === 0 ? { ...IDLE_ACTION, mandible: true } : { ...IDLE_ACTION, turn };
}

export function oracleTargetInFront(world: World): boolean {
  const point = stepFrom(world.ant, world.ant.heading);
  return world.ant.cargo > 0
    ? samePoint(point, world.cache)
    : world.foodSources.has(cellIndex(world.grid, point.x, point.y));
}

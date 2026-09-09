import { reachableCells, occupied } from "../contact";
import { cellIndex, pointAt } from "../grid";
import { DIRECTIONS, samePoint, type Point } from "../geometry";
import { isWalkable } from "../scent";
import { type Ant, type World } from "../types";
import { type Route, type KnownLocation } from "./contract";

function goalCells(world: World, target: KnownLocation): Set<number> {
  const goals = new Set<number>();
  for (const direction of DIRECTIONS) {
    const point = { x: target.x + direction.x, y: target.y + direction.y };
    if (isWalkable(world.grid, point.x, point.y))
      goals.add(cellIndex(world.grid, point.x, point.y));
  }
  return goals;
}

function reconstruct(parent: Int32Array, end: number): number[] {
  const cells = [end];
  let current = end;
  while (parent[current] !== current) {
    current = parent[current];
    cells.push(current);
  }
  return cells.reverse();
}

function neighbors(world: World, point: Point): number[] {
  return DIRECTIONS.map((d) => ({ x: point.x + d.x, y: point.y + d.y }))
    .filter((p) => isWalkable(world.grid, p.x, p.y))
    .map((p) => cellIndex(world.grid, p.x, p.y));
}

/** Terrain search ignores resources. Dynamic bodies are checked at execution and acquisition. */
export function acquireRoute(world: World, ant: Ant, target: KnownLocation): Route | null {
  const start = cellIndex(world.grid, ant.x, ant.y);
  const parent = new Int32Array(world.grid.cells.length).fill(-1);
  const goals = goalCells(world, target);
  const queue = [start];
  parent[start] = start;
  for (let read = 0; read < queue.length; read++) {
    const current = queue[read];
    if (goals.has(current))
      return {
        destination: target.id,
        cells: reconstruct(parent, current),
        cursor: 0,
        revision: world.grid.revision,
        offRoute: false,
      };
    for (const index of neighbors(world, pointAt(world.grid, current))) {
      if (parent[index] !== -1 || occupied(world, pointAt(world.grid, index), ant)) continue;
      parent[index] = current;
      queue.push(index);
    }
  }
  return null;
}

export function contactHeading(world: World, ant: Ant, target: Point): number {
  return DIRECTIONS.findIndex((_, h) =>
    reachableCells(world, ant, h).some((p) => samePoint(p, target))
  );
}

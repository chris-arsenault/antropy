import { cellIndex, inBounds, pointAt, type Grid } from "../grid";
import { DIRECTIONS, type Point } from "../geometry";
import { Material } from "../materials";
import { type World } from "../types";

/** Diagnostic geometry only. Controllers never receive the nest area or its growth target. */
export function connectedNestCells(grid: Grid, home: Point): Set<number> {
  const open = (index: number) =>
    grid.backing[index] !== Material.AIR &&
    [Material.AIR, Material.CACHE].includes(grid.cells[index]);
  const start = cellIndex(grid, home.x, home.y);
  const seen = new Set<number>(open(start) ? [start] : []);
  const queue = [...seen];
  for (let i = 0; i < queue.length; i++) {
    const p = pointAt(grid, queue[i]);
    for (const d of DIRECTIONS) {
      const x = p.x + d.x,
        y = p.y + d.y;
      if (!inBounds(grid, x, y)) continue;
      const index = cellIndex(grid, x, y);
      if (seen.has(index) || !open(index)) continue;
      seen.add(index);
      queue.push(index);
    }
  }
  return seen;
}

const cache = new WeakMap<Grid, { revision: number; area: number }>();
export function nestArea(world: World) {
  let entry = cache.get(world.grid);
  if (!entry || entry.revision !== world.grid.revision) {
    entry = {
      revision: world.grid.revision,
      area: connectedNestCells(world.grid, world.nest.home).size,
    };
    cache.set(world.grid, entry);
  }
  const initial = world.construction.initialNestArea;
  return {
    initial,
    current: entry.area,
    growth: entry.area - initial,
    ratio: entry.area / Math.max(1, initial),
  };
}

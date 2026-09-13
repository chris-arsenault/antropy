import { type Cell, type World } from "../sim/types";
import { SpatialIndex } from "../sim/spatial";
import { distance, delta, wrap } from "../sim/geometry";

/** Viewing conventions in physical world units, independent of camera and genotype. */
export const GROUP_REACH = 6;
export const GROUP_MINIMUM = 3;

/** Density-connected cores with non-bridging border cells; isolated migrants remain ungrouped. */
export function spatialGroups(world: World): Cell[][] {
  const index = new SpatialIndex(world.config, world.cells);
  const neighbors = new Map<number, Cell[]>();
  for (const cell of world.cells)
    neighbors.set(
      cell.id,
      index
        .near(cell, GROUP_REACH)
        .filter((other) => distance(cell, other, world.config) <= GROUP_REACH)
    );
  const assigned = new Set<number>();
  const groups: Cell[][] = [];
  for (const cell of world.cells) {
    if (assigned.has(cell.id) || neighbors.get(cell.id)!.length < GROUP_MINIMUM) continue;
    const group = [cell];
    assigned.add(cell.id);
    expandGroup(group, neighbors, assigned);
    groups.push(group);
  }
  return groups;
}

function expandGroup(group: Cell[], neighbors: Map<number, Cell[]>, assigned: Set<number>) {
  for (let i = 0; i < group.length; i++) {
    const near = neighbors.get(group[i].id)!;
    if (near.length < GROUP_MINIMUM) continue;
    for (const other of near) {
      if (assigned.has(other.id)) continue;
      assigned.add(other.id);
      group.push(other);
    }
  }
}

export function groupCenter(world: World, cells: Cell[]) {
  const first = cells[0];
  return {
    x: wrap(
      first.x +
        cells.reduce((s, c) => s + delta(c.x - first.x, world.config.width), 0) / cells.length,
      world.config.width
    ),
    y: wrap(
      first.y +
        cells.reduce((s, c) => s + delta(c.y - first.y, world.config.height), 0) / cells.length,
      world.config.height
    ),
  };
}

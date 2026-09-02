import { getVoxelSafe, voxelIndex } from "./grid";
import { Material } from "./materials";
import { type World } from "./world";

/**
 * Shape of an excavated network — the Phase 2 measurement that separates
 * a nest from a bare shaft. A "line" is one voxel wide at every level
 * with no junctions; anything with a wide spot or a branch is not.
 */
export interface NestShape {
  /** Voxels in the largest connected excavation near the site. */
  volume: number;
  /** Distinct depths the excavation spans. */
  levels: number;
  /** Most voxels at any single level (a wide spot / chamber). */
  maxWidth: number;
  /** Voxels with three or more open neighbours (junctions). */
  branchVoxels: number;
}

export interface Site {
  x: number;
  z: number;
}

type Cell = { x: number; y: number; z: number };

const NEIGHBORS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1],
  [0, 1, 0],
  [0, -1, 0],
] as const;

/** Air below the original surface: excavation, not open sky. */
function isNestAir(world: World, x: number, y: number, z: number): boolean {
  if (getVoxelSafe(world.grid, x, y, z) !== Material.AIR) {
    return false;
  }
  // surfaceMap holds the top SOLID voxel, so air at that level was dug.
  return y <= world.surfaceMap[z * world.grid.sizeX + x];
}

function floodComponent(world: World, seed: Cell, visited: Set<number>): Cell[] {
  const component: Cell[] = [];
  const stack = [seed];
  visited.add(voxelIndex(world.grid, seed.x, seed.y, seed.z));
  while (stack.length > 0) {
    const cell = stack.pop() as Cell;
    component.push(cell);
    for (const [ox, oy, oz] of NEIGHBORS) {
      const n = { x: cell.x + ox, y: cell.y + oy, z: cell.z + oz };
      const key = voxelIndex(world.grid, n.x, n.y, n.z);
      if (!visited.has(key) && isNestAir(world, n.x, n.y, n.z)) {
        visited.add(key);
        stack.push(n);
      }
    }
  }
  return component;
}

function searchBox(site: Site, surfaceY: number, radius: number, depth: number): Cell[] {
  const cells: Cell[] = [];
  for (let dy = -depth; dy <= 0; dy++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        cells.push({ x: site.x + dx, y: surfaceY + dy, z: site.z + dz });
      }
    }
  }
  return cells;
}

function largestComponent(world: World, site: Site, surfaceY: number): Cell[] {
  const visited = new Set<number>();
  let best: Cell[] = [];
  for (const seed of searchBox(site, surfaceY, 12, 20)) {
    const key = voxelIndex(world.grid, seed.x, seed.y, seed.z);
    if (visited.has(key) || !isNestAir(world, seed.x, seed.y, seed.z)) {
      continue;
    }
    const component = floodComponent(world, seed, visited);
    if (component.length > best.length) {
      best = component;
    }
  }
  return best;
}

/** Measure the largest excavated network around a nest site. */
export function measureNest(world: World, site: Site, surfaceY: number): NestShape {
  const cells = largestComponent(world, site, surfaceY);
  if (cells.length === 0) {
    return { volume: 0, levels: 0, maxWidth: 0, branchVoxels: 0 };
  }
  const seen = new Set(cells.map((c) => voxelIndex(world.grid, c.x, c.y, c.z)));
  const byLevel = new Map<number, number>();
  for (const cell of cells) {
    byLevel.set(cell.y, (byLevel.get(cell.y) ?? 0) + 1);
  }
  let branchVoxels = 0;
  for (const cell of cells) {
    let open = 0;
    for (const [ox, oy, oz] of NEIGHBORS) {
      if (seen.has(voxelIndex(world.grid, cell.x + ox, cell.y + oy, cell.z + oz))) {
        open += 1;
      }
    }
    if (open >= 3) {
      branchVoxels += 1;
    }
  }
  return {
    volume: cells.length,
    levels: byLevel.size,
    maxWidth: Math.max(...byLevel.values()),
    branchVoxels,
  };
}

/** The Phase 2 shape test: a nest, not a line. */
export function isNotALine(shape: NestShape): boolean {
  return shape.maxWidth > 1 || shape.branchVoxels > 0;
}

/** A vertical slice through the site, for eyeballing the excavation. */
export function crossSection(world: World, site: Site, surfaceY: number, depth = 14): string {
  const rows: string[] = [];
  for (let y = surfaceY; y >= surfaceY - depth; y--) {
    let row = "";
    for (let x = site.x - 7; x <= site.x + 7; x++) {
      row += getVoxelSafe(world.grid, x, y, site.z) === Material.AIR ? "." : "#";
    }
    rows.push(`y=${y} ${row}`);
  }
  return rows.join("\n");
}

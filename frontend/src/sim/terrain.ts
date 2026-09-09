import { cellIndex, getCell, inBounds, type Grid } from "./grid";
import { Material } from "./materials";
import { DIRECTIONS } from "./geometry";

interface TerrainQueries {
  revision: number;
  walking: Int8Array;
  light: Float32Array;
}

const queries = new WeakMap<Grid, TerrainQueries>();

export function invalidateTerrain(grid: Grid): void {
  queries.delete(grid);
}

function derived(grid: Grid): TerrainQueries {
  const previous = queries.get(grid);
  if (previous?.revision === grid.revision) return previous;
  const light = new Float32Array(grid.cells.length);
  for (let x = 0; x < grid.width; x++) {
    let transmission = 1;
    for (let y = grid.height - 1; y >= 0; y--) {
      const index = cellIndex(grid, x, y);
      if (grid.cells[index] !== Material.AIR) transmission = 0;
      light[index] = transmission;
    }
  }
  const result = {
    revision: grid.revision,
    walking: new Int8Array(grid.cells.length).fill(-1),
    light,
  };
  queries.set(grid, result);
  return result;
}

export function isAir(grid: Grid, x: number, y: number): boolean {
  return inBounds(grid, x, y) && getCell(grid, x, y) === Material.AIR;
}

/** Two-cell physical reach to a solid surface, or contact with the exposed cut face. */
export function isWalkable(grid: Grid, x: number, y: number): boolean {
  if (!isAir(grid, x, y)) return false;
  const index = cellIndex(grid, x, y),
    cache = derived(grid);
  if (cache.walking[index] < 0) {
    const support =
      grid.support === "column"
        ? columnSupport(grid, x, y)
        : grid.backing[index] !== Material.AIR ||
          DIRECTIONS.some((direction) =>
            [1, 2].some((distance) => {
              const sx = x + direction.x * distance,
                sy = y + direction.y * distance;
              return inBounds(grid, sx, sy) && getCell(grid, sx, sy) !== Material.AIR;
            })
          );
    cache.walking[index] = Number(support);
  }
  return cache.walking[index] === 1;
}

function columnSupport(grid: Grid, x: number, y: number): boolean {
  return [0, 1, 2].some(
    (offset) => y >= offset && grid.backing[cellIndex(grid, x, y - offset)] !== Material.AIR
  );
}

export function chemicalAccessible(
  grid: Grid,
  mode: "supported" | "airborne",
  x: number,
  y: number
): boolean {
  return mode === "supported" ? isWalkable(grid, x, y) : isAir(grid, x, y);
}

export function skyLight(
  grid: Grid,
  x: number,
  y: number,
  model: "occluded" | "depth-attenuated" = "occluded"
): number {
  if (!inBounds(grid, x, y)) return 0;
  const visible = derived(grid).light[cellIndex(grid, x, y)];
  if (visible === 0 || model === "occluded") return visible;
  let depth = 0;
  while (y + depth < grid.height && grid.backing[cellIndex(grid, x, y + depth)] !== Material.AIR)
    depth++;
  return Math.exp(-0.8 * depth);
}

export function isInterior(grid: Grid, index: number): boolean {
  return grid.backing[index] !== Material.AIR;
}

/** Cache identity includes both material planes and their exact arrangement. */
export function terrainDigest(grid: Grid): string {
  let hash = 2166136261;
  for (const values of [grid.cells, grid.backing])
    for (const value of values) hash = Math.imul(hash ^ value, 16777619);
  return `${grid.width}:${grid.height}:${grid.support}:${hash >>> 0}`;
}

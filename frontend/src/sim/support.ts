import { getCell, type Grid } from "./grid";
import { Material } from "./materials";
import { type Point } from "./geometry";

/** The cache is a resource marker, not a solid shelf. Backing supplies grip, not a floor. */
export function looseCellOpen(grid: Grid, x: number, y: number): boolean {
  const material = getCell(grid, x, y);
  return material === Material.AIR || material === Material.CACHE;
}

/** Initial placement only. Runtime movement is bounded to one cell per tick. */
export function supportedPlacement(grid: Grid, point: Point): Point {
  let y = point.y;
  while (y > 0 && looseCellOpen(grid, point.x, y - 1)) y--;
  return { x: point.x, y };
}

import { type EnvironmentConfig } from "./environmentConfig";
import { Material } from "./materials";

export interface Grid {
  readonly support: EnvironmentConfig["support"];
  readonly width: number;
  readonly height: number;
  readonly cells: Uint8Array;
  /** Exposed cut face in this XY cell, not a second traversable plane. */
  readonly backing: Uint8Array;
  revision: number;
}

export function createGrid(
  width: number,
  height: number,
  support: EnvironmentConfig["support"] = "contact"
): Grid {
  return {
    support,
    width,
    height,
    cells: new Uint8Array(width * height),
    backing: new Uint8Array(width * height),
    revision: 0,
  };
}

export function cellIndex(grid: Grid, x: number, y: number): number {
  return y * grid.width + x;
}

export function pointAt(grid: Grid, index: number): { x: number; y: number } {
  return { x: index % grid.width, y: Math.floor(index / grid.width) };
}

export function inBounds(grid: Grid, x: number, y: number): boolean {
  return x >= 0 && x < grid.width && y >= 0 && y < grid.height;
}

export function getCell(grid: Grid, x: number, y: number): Material {
  if (!inBounds(grid, x, y)) return Material.ROCK;
  return grid.cells[cellIndex(grid, x, y)] as Material;
}

export function setCell(grid: Grid, x: number, y: number, material: Material): void {
  if (!inBounds(grid, x, y)) throw new Error(`cell outside world: ${x},${y}`);
  grid.cells[cellIndex(grid, x, y)] = material;
  grid.revision += 1;
}

export function setBacking(grid: Grid, x: number, y: number, material: Material): void {
  if (!inBounds(grid, x, y)) throw new Error(`backing outside world: ${x},${y}`);
  grid.backing[cellIndex(grid, x, y)] = material;
  grid.revision += 1;
}

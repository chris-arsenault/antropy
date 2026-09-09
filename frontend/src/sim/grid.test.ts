import { describe, expect, it } from "vitest";
import { cellIndex, createGrid, getCell, pointAt, setCell } from "./grid";
import { Material } from "./materials";

describe("2D grid", () => {
  it("round-trips X/Y cell coordinates", () => {
    const grid = createGrid(7, 5);
    setCell(grid, 4, 3, Material.FOOD);

    expect(getCell(grid, 4, 3)).toBe(Material.FOOD);
    expect(pointAt(grid, cellIndex(grid, 4, 3))).toEqual({ x: 4, y: 3 });
  });

  it("treats the finite boundary as rock", () => {
    const grid = createGrid(3, 3);
    expect(getCell(grid, -1, 1)).toBe(Material.ROCK);
    expect(getCell(grid, 3, 1)).toBe(Material.ROCK);
  });
});

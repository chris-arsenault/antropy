import { describe, expect, it } from "vitest";
import { createGrid, getVoxel, getVoxelSafe, inBounds, setVoxel, voxelIndex } from "./grid";
import { Material } from "./materials";

describe("VoxelGrid", () => {
  it("round-trips set/get at distinct coordinates", () => {
    const grid = createGrid(8, 4, 8);
    setVoxel(grid, 0, 0, 0, Material.ROCK);
    setVoxel(grid, 7, 3, 7, Material.CLAY);
    setVoxel(grid, 3, 2, 5, Material.FOOD);
    expect(getVoxel(grid, 0, 0, 0)).toBe(Material.ROCK);
    expect(getVoxel(grid, 7, 3, 7)).toBe(Material.CLAY);
    expect(getVoxel(grid, 3, 2, 5)).toBe(Material.FOOD);
  });

  it("maps every coordinate to a unique index", () => {
    const grid = createGrid(4, 3, 5);
    const seen = new Set<number>();
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 5; z++) {
          seen.add(voxelIndex(grid, x, y, z));
        }
      }
    }
    expect(seen.size).toBe(4 * 3 * 5);
  });

  it("checks bounds", () => {
    const grid = createGrid(4, 4, 4);
    expect(inBounds(grid, 0, 0, 0)).toBe(true);
    expect(inBounds(grid, 3, 3, 3)).toBe(true);
    expect(inBounds(grid, 4, 0, 0)).toBe(false);
    expect(inBounds(grid, 0, -1, 0)).toBe(false);
  });

  it("reads out-of-bounds as AIR via the safe accessor", () => {
    const grid = createGrid(2, 2, 2);
    grid.data.fill(Material.ROCK);
    expect(getVoxelSafe(grid, -1, 0, 0)).toBe(Material.AIR);
    expect(getVoxelSafe(grid, 0, 2, 0)).toBe(Material.AIR);
    expect(getVoxelSafe(grid, 1, 1, 1)).toBe(Material.ROCK);
  });
});

import { describe, expect, it } from "vitest";
import { createGrid, setVoxel, voxelIndex } from "./grid";
import { Material } from "./materials";
import {
  createScentField,
  depositScent,
  emitFoodScent,
  sampleScent,
  scanFoodSources,
  stepScentField,
} from "./scent";

describe("scent fields", () => {
  it("diffuses into adjacent air voxels", () => {
    const grid = createGrid(8, 8, 8);
    const field = createScentField(grid);
    const center = voxelIndex(grid, 4, 4, 4);
    depositScent(field, center, 1);

    stepScentField(grid, field);
    expect(sampleScent(field, center)).toBeLessThan(1);
    expect(sampleScent(field, voxelIndex(grid, 5, 4, 4))).toBeGreaterThan(0);
    expect(sampleScent(field, voxelIndex(grid, 4, 3, 4))).toBeGreaterThan(0);
  });

  it("does not diffuse into solid voxels", () => {
    const grid = createGrid(8, 8, 8);
    setVoxel(grid, 5, 4, 4, Material.ROCK);
    const field = createScentField(grid);
    depositScent(field, voxelIndex(grid, 4, 4, 4), 1);

    stepScentField(grid, field);
    expect(sampleScent(field, voxelIndex(grid, 5, 4, 4))).toBe(0);
  });

  it("does not wrap across row seams", () => {
    const grid = createGrid(8, 8, 8);
    const field = createScentField(grid);
    depositScent(field, voxelIndex(grid, 7, 4, 4), 1);

    stepScentField(grid, field);
    expect(sampleScent(field, voxelIndex(grid, 0, 4, 5))).toBe(0);
  });

  it("evaporates to inactive over many passes", () => {
    const grid = createGrid(8, 8, 8);
    const field = createScentField(grid);
    depositScent(field, voxelIndex(grid, 4, 4, 4), 1);

    for (let i = 0; i < 200; i++) {
      stepScentField(grid, field);
    }
    expect(field.active.size).toBe(0);
  });

  it("is deterministic", () => {
    const grid = createGrid(8, 8, 8);
    const a = createScentField(grid);
    const b = createScentField(grid);
    depositScent(a, voxelIndex(grid, 4, 4, 4), 1);
    depositScent(b, voxelIndex(grid, 4, 4, 4), 1);
    for (let i = 0; i < 20; i++) {
      stepScentField(grid, a);
      stepScentField(grid, b);
    }
    expect(Array.from(a.values)).toEqual(Array.from(b.values));
  });

  it("emits scent around FOOD voxels", () => {
    const grid = createGrid(8, 8, 8);
    setVoxel(grid, 4, 4, 4, Material.FOOD);
    const sources = scanFoodSources(grid);
    expect(sources.size).toBe(1);

    const field = createScentField(grid);
    emitFoodScent(grid, field, sources);
    expect(sampleScent(field, voxelIndex(grid, 5, 4, 4))).toBeGreaterThan(0);
    expect(sampleScent(field, voxelIndex(grid, 4, 4, 4))).toBe(0);
  });
});

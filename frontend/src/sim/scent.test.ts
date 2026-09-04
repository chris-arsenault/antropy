import { describe, expect, it } from "vitest";
import { createGrid, setVoxel, voxelIndex } from "./grid";
import { Material } from "./materials";
import {
  createScentField,
  depositScent,
  emitFoodScent,
  sampleScent,
  scanFoodSources,
  scentActiveCount,
  stepScentField,
} from "./scent";
import { BEACON_PHYSICS, TRAIL_PHYSICS } from "./tunables";

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
    const field = createScentField(grid, {
      ...BEACON_PHYSICS,
      evaporation: 0.5,
      epsilon: 0.01,
    });
    depositScent(field, voxelIndex(grid, 4, 4, 4), 1);

    for (let i = 0; i < 20; i++) {
      stepScentField(grid, field);
    }
    expect(scentActiveCount(field)).toBe(0);
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
});

describe("trail physics", () => {
  it("keeps a reinforced trail alive across hundreds of ticks", () => {
    const grid = createGrid(8, 8, 8);
    const trail = createScentField(grid, TRAIL_PHYSICS);
    const beacon = createScentField(grid, BEACON_PHYSICS);
    const index = voxelIndex(grid, 4, 4, 4);
    depositScent(trail, index, 1);
    depositScent(beacon, index, 1);

    // 100 passes = 500 ticks at the step cadence.
    for (let i = 0; i < 100; i++) {
      stepScentField(grid, trail);
      stepScentField(grid, beacon);
    }
    // Longevity is mass retention: diffusion blurs but does not destroy.
    let trailMass = 0;
    for (const v of trail.values) {
      trailMass += v;
    }
    expect(trailMass).toBeGreaterThan(0.4);
    expect(sampleScent(trail, index)).toBeGreaterThan(0.02);
    expect(sampleScent(beacon, index)).toBeLessThan(0.001);
    expect(sampleScent(trail, index)).toBeGreaterThan(sampleScent(beacon, index));
  });
});

describe("owner tagging (ADR-0005)", () => {
  it("filters samples by colony owner", () => {
    const grid = createGrid(8, 8, 8);
    const field = createScentField(grid);
    const index = voxelIndex(grid, 4, 4, 4);
    depositScent(field, index, 0.8, 3);

    expect(sampleScent(field, index, 3)).toBeCloseTo(0.8);
    expect(sampleScent(field, index, 5)).toBe(0);
    expect(sampleScent(field, index, 0)).toBe(0);

    // Last writer claims the voxel.
    depositScent(field, index, 0.2, 5);
    expect(sampleScent(field, index, 5)).toBeCloseTo(1.0);
    expect(sampleScent(field, index, 3)).toBe(0);
  });

  it("carries the owner along diffusion into empty voxels", () => {
    const grid = createGrid(8, 8, 8);
    const field = createScentField(grid);
    depositScent(field, voxelIndex(grid, 4, 4, 4), 1, 7);
    stepScentField(grid, field);
    expect(sampleScent(field, voxelIndex(grid, 5, 4, 4), 7)).toBeGreaterThan(0);
    expect(sampleScent(field, voxelIndex(grid, 5, 4, 4), 0)).toBe(0);
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

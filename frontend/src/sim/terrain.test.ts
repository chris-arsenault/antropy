import { describe, expect, it } from "vitest";
import { createGrid, setCell, setBacking, cellIndex } from "./grid";
import { Material } from "./materials";
import { isWalkable, skyLight, terrainDigest } from "./terrain";
import { createChemicalField, depositChemical, stepChemical } from "./scent";
import { buildEnvironment } from "./nest";
import { terrainConfig } from "./config";
import { createRandomState } from "./random";

describe("cellular terrain", () => {
  it("supports stacked ledges while open air remains unwalkable", () => {
    const grid = createGrid(16, 16);
    for (let x = 1; x < 15; x++) {
      setCell(grid, x, 2, Material.SOIL);
      setCell(grid, x, 10, Material.WOOD);
    }
    expect(isWalkable(grid, 8, 3)).toBe(true);
    expect(isWalkable(grid, 8, 11)).toBe(true);
    expect(isWalkable(grid, 8, 6)).toBe(false);
    expect(skyLight(grid, 8, 3)).toBe(0);
    expect(skyLight(grid, 8, 11)).toBe(1);
    setBacking(grid, 8, 6, Material.CLAY);
    expect(isWalkable(grid, 8, 6)).toBe(true);
  });

  it("invalidates support and illumination after material edits", () => {
    const grid = createGrid(12, 12);
    const original = terrainDigest(grid);
    expect(isWalkable(grid, 5, 5)).toBe(false);
    setCell(grid, 5, 6, Material.CLAY);
    expect(isWalkable(grid, 5, 5)).toBe(true);
    expect(skyLight(grid, 5, 5)).toBe(0);
    expect(terrainDigest(grid)).not.toBe(original);
    setCell(grid, 5, 6, Material.AIR);
    expect(skyLight(grid, 5, 5)).toBe(1);
    expect(isWalkable(grid, 5, 5)).toBe(false);
  });

  it("transports airborne odor through unsupported air but retains surface marks", () => {
    const grid = createGrid(12, 12),
      physics = { diffusion: 0.4, evaporation: 1, epsilon: 1e-8 };
    setCell(grid, 5, 2, Material.ROCK);
    const gas = createChemicalField(grid, physics),
      mark = createChemicalField(grid, physics, true);
    for (const field of [gas, mark]) {
      depositChemical(field, cellIndex(grid, 5, 4), 1);
      stepChemical(grid, field);
    }
    expect(gas.values[cellIndex(grid, 5, 5)]).toBeGreaterThan(0);
    expect(mark.values[cellIndex(grid, 5, 5)]).toBe(0);
  });

  it("generates compact heterogeneous terrain with reproducible supported food tiers", () => {
    const config = terrainConfig("tiered");
    const first = buildEnvironment(config, createRandomState(101));
    const second = buildEnvironment(config, createRandomState(101));
    expect(terrainDigest(first.grid)).toBe(terrainDigest(second.grid));
    expect(first.nest.chambers).toHaveLength(6);
    expect(first.grid.cells).toContain(Material.CLAY);
    expect(first.grid.cells).toContain(Material.LOOSE_SOIL);
    expect(first.grid.cells).toContain(Material.WOOD);
    expect(first.foodSources.size).toBe(config.foodCount);
    const heights = [...first.foodSources].map((index) => Math.floor(index / first.grid.width));
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(30);
    for (const index of first.foodSources)
      expect(
        isWalkable(first.grid, index % first.grid.width, Math.floor(index / first.grid.width))
      ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { cellIndex, createGrid } from "./grid";
import {
  createChemicalField,
  depositChemical,
  equilibrateFromSources,
  stepChemical,
} from "./scent";

describe("local 2D chemistry", () => {
  it("diffuses to adjacent diagonal air without appearing at a distance", () => {
    const grid = createGrid(7, 7);
    const field = createChemicalField(grid, { diffusion: 0.4, evaporation: 0.9, epsilon: 1e-8 });
    depositChemical(field, cellIndex(grid, 3, 3), 1);
    stepChemical(grid, field);
    expect(field.values[cellIndex(grid, 4, 4)]).toBeGreaterThan(0);
    expect(field.values[cellIndex(grid, 0, 0)]).toBe(0);
  });

  it("relaxes a fallible scalar field through local adjacency", () => {
    const grid = createGrid(9, 3);
    const field = createChemicalField(grid, { diffusion: 0.2, evaporation: 0.99, epsilon: 1e-8 });
    equilibrateFromSources(grid, field, new Set([cellIndex(grid, 0, 1)]), 1, 0.98, 200);
    expect(field.values[cellIndex(grid, 0, 1)]).toBeCloseTo(1);
    expect(field.values[cellIndex(grid, 4, 1)]).toBeGreaterThan(0);
    expect(field.values[cellIndex(grid, 8, 1)]).toBeLessThan(field.values[cellIndex(grid, 4, 1)]);
  });
});

import { describe, expect, it } from "vitest";
import { FORAGER_CONFIG } from "./config";
import { buildEnvironment } from "./nest";
import { createRandomState } from "./random";

describe("authored 2D environment", () => {
  it("preserves the large branched nest topology", () => {
    const environment = buildEnvironment(FORAGER_CONFIG, createRandomState(3));
    expect(environment.grid.cells).toHaveLength(2_048 * 128);
    expect(environment.nest.chambers).toHaveLength(8);
    expect(environment.nest.junctions).toHaveLength(13);
    expect(environment.nest.passages).toHaveLength(31);
    expect(environment.nest.primaryRoute.at(-1)).toEqual(environment.nest.entrance);
  });

  it("varies distributed food without turning it into solid terrain", () => {
    const first = buildEnvironment(FORAGER_CONFIG, createRandomState(1));
    const second = buildEnvironment(FORAGER_CONFIG, createRandomState(2));
    expect([...first.foodSources]).not.toEqual([...second.foodSources]);
    const occupiedColumns = new Set(
      [...first.foodSources].map((index) => index % first.grid.width)
    );
    expect(occupiedColumns.size).toBe(FORAGER_CONFIG.foodCount);
    for (const index of first.foodSources) expect(first.grid.cells[index]).toBe(0);
  });
});

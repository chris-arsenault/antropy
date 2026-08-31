import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { computeStats, pearson, TRAIT_KEYS } from "./stats";
import { createWorld } from "./world";

describe("pearson", () => {
  it("matches hand-computed fixtures", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
    expect(pearson([1, 2, 3, 4], [5, 5, 5, 5])).toBe(0);
    // Fixture: x=[1,2,3], y=[1,3,2] -> r = 0.5
    expect(pearson([1, 2, 3], [1, 3, 2])).toBeCloseTo(0.5);
  });

  it("returns zero below three samples", () => {
    expect(pearson([1, 2], [3, 4])).toBe(0);
  });
});

describe("computeStats", () => {
  it("reports population, trait means, and a nonzero differential under contrived fitness", () => {
    const world = createWorld(5001);
    foundColony(world);

    // Contrive fitness correlated with body scale.
    for (const ant of world.ants) {
      ant.age = 100;
      ant.deliveries = ant.traits.bodyScale > 1 ? 20 : 1;
    }

    const stats = computeStats(world);
    expect(stats.population).toBe(world.ants.length);
    expect(stats.traitMeans.length).toBe(TRAIT_KEYS.length);
    expect(stats.traitMeans[0]).toBeGreaterThan(0.5);
    expect(stats.traitMeans[0]).toBeLessThan(1.5);
    expect(stats.selectionDifferential[0]).toBeGreaterThan(0.5);
    expect(stats.dominantPatrilineShare).toBeGreaterThan(0);
    expect(stats.dominantPatrilineShare).toBeLessThanOrEqual(1);
  });

  it("handles an empty world", () => {
    const world = createWorld(5002);
    const stats = computeStats(world);
    expect(stats.population).toBe(0);
    expect(stats.selectionDifferential.every((v) => v === 0)).toBe(true);
  });
});

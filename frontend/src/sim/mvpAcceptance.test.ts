import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { computeStats } from "./stats";
import { createWorld, stepWorld } from "./world";

/**
 * MVP acceptance (MVP-PLAN M8): from a fresh seed, one session shows
 * selection operating on the wide founder prior — nonzero selection
 * differentials while the population lives, and lineage (patriline) shares
 * diverging from their founding distribution. This is the headless form of
 * the Act One criterion (design spec §10); the charts render these numbers.
 */
describe("MVP acceptance", () => {
  it("shows the wide prior being pruned within one session", { timeout: 240_000 }, () => {
    const world = createWorld(42);
    foundColony(world);
    const initial = computeStats(world);

    let maxAbsDifferential = 0;
    let sampled = 0;
    for (let t = 0; t < 10_000; t++) {
      stepWorld(world);
      if (world.tick % 200 === 0 && world.ants.length > 3) {
        const stats = computeStats(world);
        sampled += 1;
        for (const value of stats.selectionDifferential) {
          maxAbsDifferential = Math.max(maxAbsDifferential, Math.abs(value));
        }
      }
    }
    const final = computeStats(world);

    expect(final.population).toBeGreaterThan(0);
    expect(sampled).toBeGreaterThan(10);
    expect(maxAbsDifferential).toBeGreaterThan(0.1);
    expect(final.dominantPatrilineShare).not.toBeCloseTo(initial.dominantPatrilineShare, 2);
  });
});

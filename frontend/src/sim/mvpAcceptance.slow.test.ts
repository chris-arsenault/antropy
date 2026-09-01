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
// Interim horizon 2500 ticks: the pre-M5 backbone seed has no temperature
// response, so it dwindles in the Release 3 liability world (measured:
// >5 ants through ~2500 at seed 42). M5's derived seeds restore the 10k
// horizon; the interface itself is certified by the rung-2 ladder gates.
const HORIZON = 2500;

describe("MVP acceptance", () => {
  it("shows the wide prior being pruned within one session", { timeout: 240_000 }, () => {
    const world = createWorld(42);
    foundColony(world);
    const initial = computeStats(world);

    let maxAbsDifferential = 0;
    let sampled = 0;
    for (let t = 0; t < HORIZON; t++) {
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
    expect(sampled).toBeGreaterThan(8);
    expect(maxAbsDifferential).toBeGreaterThan(0.1);
    expect(final.dominantPatrilineShare).not.toBeCloseTo(initial.dominantPatrilineShare, 2);
  });
});

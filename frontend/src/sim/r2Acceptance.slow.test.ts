import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { SEASON } from "./tunables";
import { createWorld, stepWorld } from "./world";

/**
 * Release 2 acceptance (R2-PLAN M6): one unassisted seeded session shows the
 * new regime machinery operating — seasonal carrying capacity, a colony
 * provisioned by real deliveries, and a living world. Long-horizon (30k+)
 * unassisted persistence is open ecology-calibration work tracked in the
 * backlog; the metapopulation loop itself is gated in colony.slow.test.
 */
describe("Release 2 acceptance", () => {
  it("runs one session of the regime machinery unassisted", { timeout: 240_000 }, () => {
    const world = createWorld(42);
    foundColony(world);

    for (let t = 0; t < 10_000; t++) {
      stepWorld(world);
    }

    // Seasons: t=10k is the sinusoid peak for the default period.
    expect(world.tick / SEASON.periodTicks).toBeCloseTo(0.25, 1);
    expect(world.foodTarget).toBeGreaterThan(world.foodBase * 1.2);

    // The colony survived the session on real provisioning.
    expect(world.colonies.length).toBeGreaterThanOrEqual(1);
    expect(world.ants.length).toBeGreaterThan(5);
    const merit = Array.from(world.colonies[0].patrilineDeliveries.values());
    expect(merit.reduce((a, b) => a + b, 0)).toBeGreaterThan(1);
  });
});

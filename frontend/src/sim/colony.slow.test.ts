import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { createWorld, stepWorld, type World } from "./world";

// Slow tier (long simulation runs): excluded from `make test`; run with
// `make test-slow`. Cloud CI runs the full suite.
function meanTraits(world: World): number[] {
  const sums = [0, 0, 0];
  for (const ant of world.ants) {
    sums[0] += ant.traits.bodyScale;
    sums[1] += ant.traits.sensorGain;
    sums[2] += ant.traits.mutationSigma;
  }
  return sums.map((s) => s / world.ants.length);
}

describe("multi-generation evolution (M6 gate)", () => {
  it("evolves through generations without collapse", { timeout: 240_000 }, () => {
    const world = createWorld(4005);
    const colony = foundColony(world);
    colony.queenLifespanTicks = 2500;
    const founderTraits = meanTraits(world);

    for (let t = 0; t < 12_000; t++) {
      stepWorld(world);
    }

    expect(colony.successions).toBeGreaterThanOrEqual(3);
    // Post-excavation-instinct energy economy holds a smaller equilibrium
    // population; the gate is persistence through successions, not size.
    expect(world.ants.length).toBeGreaterThan(2);
    const laterTraits = meanTraits(world);
    const drift = founderTraits.reduce(
      (sum, value, i) => sum + Math.abs(value - laterTraits[i]),
      0
    );
    expect(drift).toBeGreaterThan(0.01);
  });
});

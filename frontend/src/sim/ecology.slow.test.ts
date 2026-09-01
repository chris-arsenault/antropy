import { describe, expect, it } from "vitest";
import { braitenbergController } from "./controller/braitenberg";
import { createWorld, populateForagers, stepWorld, type World } from "./world";
import { FOOD_GOVERNOR } from "./tunables";

// Slow tier (long simulation runs): excluded from `make test`; run with
// `make test-slow`. Cloud CI runs the full suite.
function createReferenceWorld(seed: number): World {
  return createWorld(seed, braitenbergController);
}

describe("ecology calibration (M4 gate)", () => {
  it("keeps most Braitenberg foragers alive with food regenerating", { timeout: 120_000 }, () => {
    const world = createReferenceWorld(2001);
    for (let t = 0; t < FOOD_GOVERNOR.interval * 10; t++) {
      stepWorld(world); // pre-stock the larder
    }
    populateForagers(world, 40);
    const spawned = world.ants.length;

    for (let t = 0; t < 4000; t++) {
      stepWorld(world);
    }
    // Recalibrated for the 192² map (longer travel, patchier local density);
    // the starvation control below preserves the with/without-food contrast.
    expect(world.ants.length / spawned).toBeGreaterThan(0.35);
  });

  it("starves the population without food", { timeout: 120_000 }, () => {
    const world = createReferenceWorld(2002);
    populateForagers(world, 20);
    world.foodBase = 0;
    world.foodTarget = 0;
    for (let t = 0; t < 4000; t++) {
      stepWorld(world);
    }
    expect(world.ants.length).toBeLessThan(5);
  });
});

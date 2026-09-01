import { describe, expect, it } from "vitest";
import { braitenbergController } from "./controller/braitenberg";
import { createWorld, populateForagers, stepWorld, type World } from "./world";
import { FOOD_GOVERNOR } from "./tunables";

// Slow tier: mechanics invariant, not a world-state threshold — the food
// chain must causally matter. Absolute survival fractions are harness
// measurements (pnpm harness run), not tests.
function createReferenceWorld(seed: number): World {
  const world = createWorld(seed, braitenbergController);
  // The asexual reference controller cannot found colonies; these worlds
  // measure forager ecology only.
  world.autoContinue = false;
  return world;
}

describe("ecology mechanics (M4 gate)", () => {
  it("food availability causally separates survival", { timeout: 240_000 }, () => {
    const fed = createReferenceWorld(2001);
    for (let t = 0; t < FOOD_GOVERNOR.interval * 10; t++) {
      stepWorld(fed); // pre-stock the larder
    }
    populateForagers(fed, 40);
    for (let t = 0; t < 4000; t++) {
      stepWorld(fed);
    }

    const starved = createReferenceWorld(2002);
    populateForagers(starved, 40);
    starved.foodBase = 0;
    starved.foodTarget = 0;
    for (let t = 0; t < 4000; t++) {
      stepWorld(starved);
    }

    expect(starved.ants.length).toBeLessThan(5);
    expect(fed.ants.length).toBeGreaterThan(starved.ants.length * 3);
  });
});

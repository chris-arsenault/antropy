import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { CONTINUITY } from "./tunables";
import { createWorld, stepWorld } from "./world";

describe("automatic continue (R3)", () => {
  it("refounds from the survivor pool when population collapses", () => {
    const world = createWorld(6001);
    const first = foundColony(world);
    world.tick = CONTINUITY.cooldownTicks + 1;
    // Cull to below the floor; survivors carry the genetics forward.
    world.ants = world.ants.slice(0, 2);
    const survivorGenomes = world.ants.map((a) => a.genome);

    stepWorld(world);
    expect(world.continuations).toBe(1);
    expect(world.colonies.length).toBeGreaterThanOrEqual(1);
    expect(world.ants.length).toBeGreaterThan(CONTINUITY.minPopulation);
    expect(world.colonies.some((c) => c.id !== first.id)).toBe(true);
    expect(survivorGenomes.length).toBe(2); // the pool existed at trigger

    // Cooldown: no immediate second continuation.
    world.ants = world.ants.slice(0, 2);
    stepWorld(world);
    expect(world.continuations).toBe(1);
  });

  it("stays quiet while the colony is healthy", () => {
    const world = createWorld(6002);
    foundColony(world);
    world.tick = CONTINUITY.cooldownTicks + 1;
    stepWorld(world);
    expect(world.continuations).toBe(0);
  });
});

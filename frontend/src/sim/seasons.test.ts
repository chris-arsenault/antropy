import { describe, expect, it } from "vitest";
import { stepFoodGovernor } from "./foodSpawner";
import { SEASON } from "./tunables";
import { createWorld } from "./world";

describe("oscillating carrying capacity (§9.3)", () => {
  it("traces a sinusoid around foodBase across the season", () => {
    const world = createWorld(6001);
    const base = world.foodBase;

    world.tick = Math.round(SEASON.periodTicks / 4); // sin peak
    stepFoodGovernor(world);
    const peak = world.foodTarget;

    world.tick = Math.round((3 * SEASON.periodTicks) / 4); // sin trough
    stepFoodGovernor(world);
    const trough = world.foodTarget;

    expect(peak).toBeGreaterThan(base * (1 + SEASON.amplitude * 0.6));
    expect(trough).toBeLessThan(base * (1 - SEASON.amplitude * 0.6));
    expect(trough).toBeGreaterThanOrEqual(0);
  });

  it("holds target at zero when foodBase is zero", () => {
    const world = createWorld(6002);
    world.foodBase = 0;
    world.tick = 12_345;
    stepFoodGovernor(world);
    expect(world.foodTarget).toBe(0);
  });

  it("exposes the surface map matching the terrain generator", () => {
    const world = createWorld(6003);
    expect(world.surfaceMap.length).toBe(world.grid.sizeX * world.grid.sizeZ);
    // Spot-check: the voxel above the mapped surface is air, at it is solid.
    const x = 50;
    const z = 90;
    const surface = world.surfaceMap[z * world.grid.sizeX + x];
    expect(world.grid.data[((surface + 1) * world.grid.sizeZ + z) * world.grid.sizeX + x]).toBe(0);
  });
});

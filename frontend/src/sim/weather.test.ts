import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { depositScent, sampleScent } from "./scent";
import { Material } from "./materials";
import { MICROCLIMATE, RAIN } from "./tunables";
import { getVoxelSafe, voxelIndex } from "./grid";
import { microclimateMultiplier, stepWeather, surfaceStress } from "./weather";
import { createWorld, mutateVoxel, stepWorld } from "./world";

function surfaceAirIndex(world: ReturnType<typeof createWorld>, x: number, z: number) {
  const y = surfaceSpawnY(world.grid, x, z) as number;
  return { x, y, z, index: voxelIndex(world.grid, x, y, z) };
}

describe("microclimate (Rule 5)", () => {
  it("stress exceeds 1 on the surface and attenuates with depth", () => {
    const world = createWorld(7001);
    const surface = world.surfaceMap[96 * world.grid.sizeX + 96];
    const shallow = { x: 96, y: surface, z: 96 };
    const deep = { x: 96, y: surface - 12, z: 96 };
    const atSurface = microclimateMultiplier(world, shallow);
    const atDepth = microclimateMultiplier(world, deep);
    expect(atSurface).toBeGreaterThan(1);
    // 12 voxels = 4 half-depths: stress above baseline attenuates 16x.
    expect(atDepth - 1).toBeCloseTo((atSurface - 1) / 16, 5);
  });

  it("stress oscillates with the diurnal cycle", () => {
    const quarterDay = Math.round(MICROCLIMATE.dayTicks / 4);
    expect(surfaceStress(quarterDay)).toBeGreaterThan(surfaceStress(3 * quarterDay));
  });
});

describe("rain (Rule 5)", () => {
  it("washes exposed surface food and spares everything below ground", () => {
    const world = createWorld(7002);
    const spot = surfaceAirIndex(world, 60, 60);
    mutateVoxel(world, spot.x, spot.y, spot.z, Material.FOOD);
    const surface = world.surfaceMap[80 * world.grid.sizeX + 80];
    mutateVoxel(world, 80, surface - 5, 80, Material.AIR);
    mutateVoxel(world, 80, surface - 5, 80, Material.FOOD);

    world.rainRemaining = 10_000;
    world.tick = RAIN.washInterval; // wash pass fires immediately
    for (let i = 0; i < 400; i++) {
      stepWeather(world);
      world.tick += 1;
    }
    expect(getVoxelSafe(world.grid, spot.x, spot.y, spot.z)).toBe(Material.AIR);
    expect(getVoxelSafe(world.grid, 80, surface - 5, 80)).toBe(Material.FOOD);
  });

  it("washes above-surface pheromone and spares tunnel trails", () => {
    const world = createWorld(7003);
    const above = surfaceAirIndex(world, 60, 60);
    const surface = world.surfaceMap[80 * world.grid.sizeX + 80];
    mutateVoxel(world, 80, surface - 5, 80, Material.AIR);
    const below = voxelIndex(world.grid, 80, surface - 5, 80);
    depositScent(world.pheromoneA, above.index, 1, 1);
    depositScent(world.pheromoneA, below, 1, 1);

    world.rainRemaining = RAIN.washInterval + 2;
    world.tick = RAIN.washInterval;
    stepWeather(world);
    expect(sampleScent(world.pheromoneA, above.index, 1)).toBeCloseTo(RAIN.pheromoneRetention);
    expect(sampleScent(world.pheromoneA, below, 1)).toBe(1);
  });

  it("storms schedule from the weather stream without touching world.rng", () => {
    const world = createWorld(7004);
    const before = world.rng.getState();
    for (let i = 0; i < 5000; i++) {
      stepWeather(world);
      world.tick += 1;
    }
    expect(world.rng.getState()).toEqual(before);
  });

  it("keeps stepWorld deterministic for identical seeds", () => {
    const a = createWorld(7005);
    const b = createWorld(7005);
    for (let i = 0; i < 600; i++) {
      stepWorld(a);
      stepWorld(b);
    }
    expect(a.rainRemaining).toBe(b.rainRemaining);
    expect(a.weatherRng.getState()).toEqual(b.weatherRng.getState());
    expect(a.foodSources.size).toBe(b.foodSources.size);
  });
});

import { describe, expect, it } from "vitest";
import { tryDig, tryEat } from "./actions";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { ENERGY, FOOD_GOVERNOR } from "./tunables";
import { createWorld, mutateVoxel, populateForagers, stepWorld, type World } from "./world";

function firstAnt(world: World) {
  const ant = world.ants[0];
  if (!ant) {
    throw new Error("no ants spawned");
  }
  return ant;
}

function countSolidAndCarried(world: World): number {
  let solid = 0;
  for (const value of world.grid.data) {
    if (value !== Material.AIR && value !== Material.FOOD && value !== Material.WATER) {
      solid += 1;
    }
  }
  return solid + world.ants.reduce((sum, ant) => sum + ant.carryLoad, 0);
}

describe("digging and spoil conservation", () => {
  it("digs the faced voxel, loads spoil, and deposits it as LOOSE_FILL", () => {
    const world = createWorld(31);
    populateForagers(world, 5);
    const ant = firstAnt(world);
    ant.heading = 0;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.TOPSOIL);

    const before = countSolidAndCarried(world);
    const energyBefore = ant.energy;
    tryDig(world, ant);
    expect(ant.carrying).toBe(Material.TOPSOIL);
    expect(ant.carryLoad).toBe(1);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.AIR);
    expect(ant.energy).toBeLessThan(energyBefore);
    expect(countSolidAndCarried(world)).toBe(before);

    tryDig(world, ant);
    expect(ant.carrying).toBeNull();
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.LOOSE_FILL);
    expect(countSolidAndCarried(world)).toBe(before);
  });

  it("refuses to dig rock", () => {
    const world = createWorld(32);
    populateForagers(world, 5);
    const ant = firstAnt(world);
    ant.heading = 0;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.ROCK);

    tryDig(world, ant);
    expect(ant.carrying).toBeNull();
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.ROCK);
  });
});

describe("eating and death", () => {
  it("consumes a faced FOOD voxel and gains energy", () => {
    const world = createWorld(33);
    populateForagers(world, 5);
    const ant = firstAnt(world);
    ant.heading = 0;
    ant.energy = 0.2;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.FOOD);

    tryEat(world, ant);
    expect(ant.energy).toBeCloseTo(0.2 + ENERGY.foodEnergy);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.AIR);
    expect(world.foodSources.size).toBe(0);
  });

  it("kills a starved ant and leaves a corpse as FOOD", () => {
    const world = createWorld(34);
    populateForagers(world, 3);
    const ant = firstAnt(world);
    ant.energy = 0.0001;

    for (let t = 0; t < 20 && ant.alive; t++) {
      stepWorld(world);
    }
    expect(ant.alive).toBe(false);
    expect(world.ants).not.toContain(ant);
    expect(getVoxel(world.grid, ant.x, ant.y, ant.z)).toBe(Material.FOOD);
  });
});

describe("food governor", () => {
  it("builds the food supply toward the target", { timeout: 60_000 }, () => {
    const world = createWorld(35);
    for (let t = 0; t < FOOD_GOVERNOR.interval * 30; t++) {
      stepWorld(world);
    }
    expect(world.foodSources.size).toBeGreaterThan(FOOD_GOVERNOR.targetCount / 2);
    expect(world.foodSources.size).toBeLessThanOrEqual(FOOD_GOVERNOR.targetCount);
  });
});

describe("ecology calibration (M4 gate)", () => {
  it("keeps most Braitenberg foragers alive with food regenerating", { timeout: 120_000 }, () => {
    const world = createWorld(2001);
    for (let t = 0; t < FOOD_GOVERNOR.interval * 10; t++) {
      stepWorld(world); // pre-stock the larder
    }
    populateForagers(world, 40);
    const spawned = world.ants.length;

    for (let t = 0; t < 4000; t++) {
      stepWorld(world);
    }
    expect(world.ants.length / spawned).toBeGreaterThan(0.6);
  });

  it("starves the population without food", { timeout: 120_000 }, () => {
    const world = createWorld(2002);
    populateForagers(world, 20);
    world.foodTarget = 0;
    for (let t = 0; t < 4000; t++) {
      stepWorld(world);
    }
    expect(world.ants.length).toBeLessThan(5);
  });
});

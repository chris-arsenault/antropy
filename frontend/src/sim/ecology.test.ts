import { describe, expect, it } from "vitest";
import { spoilCapacity, tryDig, tryEat } from "./actions";
import { braitenbergController } from "./controller/braitenberg";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { ENERGY, FOOD_GOVERNOR } from "./tunables";
import { createWorld, mutateVoxel, populateForagers, stepWorld, type World } from "./world";

// Ecology behavior is calibrated against the reference controller (spec §13
// phase 2 — "ants whose behavior is known"), independent of RNN evolution.
function createReferenceWorld(seed: number): World {
  return createWorld(seed, braitenbergController);
}

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
  return solid + world.ants.reduce((sum, ant) => sum + ant.spoilLoads, 0);
}

describe("digging and spoil conservation", () => {
  it("digs the faced voxel, loads spoil, and deposits it as LOOSE_FILL", () => {
    const world = createReferenceWorld(31);
    populateForagers(world, 5);
    const ant = firstAnt(world);
    ant.heading = 0;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.TOPSOIL);

    const before = countSolidAndCarried(world);
    const energyBefore = ant.energy;
    tryDig(world, ant, 0);
    expect(ant.carrying).toBe(Material.TOPSOIL);
    expect(ant.spoilLoads).toBe(1);
    expect(ant.carryLoad).toBeGreaterThan(0);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.AIR);
    expect(ant.energy).toBeLessThan(energyBefore);
    expect(countSolidAndCarried(world)).toBe(before);

    // At capacity the same channel deposits one load into the faced air.
    ant.spoilLoads = spoilCapacity(ant);
    const atCapacity = countSolidAndCarried(world);
    tryDig(world, ant, 0);
    expect(ant.spoilLoads).toBe(spoilCapacity(ant) - 1);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.LOOSE_FILL);
    expect(countSolidAndCarried(world)).toBe(atCapacity);
  });

  it("digs downward from flat ground and keeps digging until capacity", () => {
    const world = createReferenceWorld(36);
    populateForagers(world, 3);
    const ant = firstAnt(world);
    ant.heading = 0;

    tryDig(world, ant, -1);
    expect(ant.spoilLoads).toBe(1);
    const dugForwardDown = getVoxel(world.grid, ant.x + 1, ant.y - 1, ant.z) === Material.AIR;
    const dugBelow = getVoxel(world.grid, ant.x, ant.y - 1, ant.z) === Material.AIR;
    expect(dugForwardDown || dugBelow).toBe(true);

    // Below capacity, digging continues instead of refilling the hole.
    if (spoilCapacity(ant) > 1) {
      tryDig(world, ant, -1);
      expect(ant.spoilLoads).toBe(2);
    }
  });

  it("deposits spoil level or upward, never straight back down first", () => {
    const world = createReferenceWorld(37);
    populateForagers(world, 3);
    const ant = firstAnt(world);
    ant.heading = 0;
    ant.carrying = Material.TOPSOIL;
    ant.spoilLoads = spoilCapacity(ant);
    // Faced level voxel is air on open ground: the deposit lands there.
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.AIR);
    mutateVoxel(world, ant.x + 1, ant.y - 1, ant.z, Material.AIR);

    tryDig(world, ant, -1);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.LOOSE_FILL);
    expect(getVoxel(world.grid, ant.x + 1, ant.y - 1, ant.z)).toBe(Material.AIR);
  });

  it("refuses to dig rock", () => {
    const world = createReferenceWorld(32);
    populateForagers(world, 5);
    const ant = firstAnt(world);
    ant.heading = 0;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.ROCK);
    mutateVoxel(world, ant.x + 1, ant.y - 1, ant.z, Material.ROCK);

    tryDig(world, ant, 0);
    expect(ant.carrying).toBeNull();
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.ROCK);
  });
});

describe("eating and death", () => {
  it("consumes a faced FOOD voxel and gains energy", () => {
    const world = createReferenceWorld(33);
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
    const world = createReferenceWorld(34);
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
    const world = createReferenceWorld(35);
    for (let t = 0; t < FOOD_GOVERNOR.interval * 30; t++) {
      stepWorld(world);
    }
    expect(world.foodSources.size).toBeGreaterThan(FOOD_GOVERNOR.targetCount / 2);
    expect(world.foodSources.size).toBeLessThanOrEqual(FOOD_GOVERNOR.targetCount);
  });
});

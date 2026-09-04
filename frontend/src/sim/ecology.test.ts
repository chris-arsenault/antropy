import { describe, expect, it } from "vitest";
import { spoilCapacity, tryDig, tryEat } from "./actions";
import { braitenbergController } from "./controller/braitenberg";
import { Output, OUTPUT_COUNT } from "./controller/contract";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { DIG, ENERGY, FOOD_GOVERNOR } from "./tunables";
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

  it("digs straight down from flat ground, one voxel per descent", () => {
    const world = createReferenceWorld(36);
    populateForagers(world, 3);
    const ant = firstAnt(world);
    ant.heading = 0;

    // A strong down bias digs exactly the voxel below — never a
    // forward-down neighbour, which used to widen shafts to two voxels.
    tryDig(world, ant, -1);
    expect(ant.spoilLoads).toBe(1);
    expect(getVoxel(world.grid, ant.x, ant.y - 1, ant.z)).toBe(Material.AIR);
    expect(getVoxel(world.grid, ant.x + 1, ant.y - 1, ant.z)).not.toBe(Material.AIR);

    // The same down-targeted intent now sees air while loaded, so the one
    // terrain channel deposits into that exact voxel.
    tryDig(world, ant, -1);
    expect(ant.spoilLoads).toBe(0);
    expect(getVoxel(world.grid, ant.x, ant.y - 1, ant.z)).toBe(Material.LOOSE_FILL);

    // Unload the test voxel, descend, and expose the next dig target.
    mutateVoxel(world, ant.x, ant.y - 1, ant.z, Material.AIR);
    ant.y -= 1;
    tryDig(world, ant, -1);
    expect(ant.spoilLoads).toBe(1);
    expect(getVoxel(world.grid, ant.x, ant.y - 1, ant.z)).toBe(Material.AIR);
  });
});

describe("terrain intent preconditions", () => {
  it("deposits spoil into the air target selected by vertical bias", () => {
    const world = createReferenceWorld(37);
    populateForagers(world, 3);
    const ant = firstAnt(world);
    ant.heading = 0;
    ant.carrying = Material.TOPSOIL;
    ant.spoilLoads = spoilCapacity(ant);
    // Strong up selects forward-up before the other target candidates.
    mutateVoxel(world, ant.x + 1, ant.y + 1, ant.z, Material.AIR);
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.AIR);

    tryDig(world, ant, 1);
    expect(getVoxel(world.grid, ant.x + 1, ant.y + 1, ant.z)).toBe(Material.LOOSE_FILL);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.AIR);
  });

  it("refuses to dig rock", () => {
    const world = createReferenceWorld(32);
    populateForagers(world, 5);
    const ant = firstAnt(world);
    ant.heading = 0;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.ROCK);
    mutateVoxel(world, ant.x + 1, ant.y - 1, ant.z, Material.ROCK);

    const energyBefore = ant.energy;
    tryDig(world, ant, 0);
    expect(ant.carrying).toBeNull();
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.ROCK);
    expect(ant.energy).toBeCloseTo(energyBefore - DIG.depositCost);
  });

  it("drops an occupant one voxel when its last support is excavated", () => {
    const world = createReferenceWorld(38);
    populateForagers(world, 5);
    const digger = firstAnt(world);
    const occupant = world.ants[1];
    expect(occupant).toBeDefined();

    const x = 96;
    const y = 40;
    const z = 96;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = 0; dy <= 2; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          mutateVoxel(world, x + dx, y + dy, z + dz, Material.AIR);
        }
      }
    }
    mutateVoxel(world, x, y, z, Material.TOPSOIL);
    digger.x = x - 1;
    digger.y = y;
    digger.z = z;
    digger.heading = 0;
    occupant.x = x;
    occupant.y = y + 1;
    occupant.z = z;

    tryDig(world, digger, 0);

    expect(getVoxel(world.grid, x, y, z)).toBe(Material.AIR);
    expect(occupant.y).toBe(y);
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
    ant.energy = Number.EPSILON;

    stepWorld(world);
    expect(ant.alive).toBe(false);
    expect(world.ants).not.toContain(ant);
    expect(getVoxel(world.grid, ant.x, ant.y, ant.z)).toBe(Material.FOOD);
  });

  it("resolves EAT at the contact pose sensed before translation", () => {
    const world = createReferenceWorld(39);
    populateForagers(world, 1);
    const ant = firstAnt(world);
    ant.heading = 0;
    ant.energy = 0.2;
    const foodX = ant.x + 2;
    mutateVoxel(world, foodX, ant.y, ant.z, Material.FOOD);
    const outputs = new Float32Array(OUTPUT_COUNT);
    outputs[Output.FORWARD] = 1;
    outputs[Output.EAT] = 1;
    world.policyOverride = () => outputs;

    stepWorld(world);
    expect(getVoxel(world.grid, foodX, ant.y, ant.z)).toBe(Material.FOOD);

    stepWorld(world);
    expect(getVoxel(world.grid, foodX, ant.y, ant.z)).toBe(Material.AIR);
  });
});

describe("food governor", () => {
  it("builds the food supply toward the target", { timeout: 60_000 }, () => {
    const world = createReferenceWorld(35);
    for (let t = 0; t < FOOD_GOVERNOR.interval * 30; t++) {
      stepWorld(world);
    }
    expect(world.foodSources.size).toBeGreaterThan(FOOD_GOVERNOR.targetCount / 2);
    // The seasonal target breathes above the base (§9.3); bound by its ceiling.
    expect(world.foodSources.size).toBeLessThanOrEqual(FOOD_GOVERNOR.targetCount * 1.6);
  });
});

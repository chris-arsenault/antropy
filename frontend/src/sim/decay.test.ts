import { describe, expect, it } from "vitest";
import { addEgg } from "./eggs";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { rnnController } from "./controller/rnn";
import { DECAY } from "./tunables";
import { createWorld, mutateVoxel, stepWorld, type World } from "./world";

function carveTestTunnel(world: World): { x: number; y: number; z: number } {
  const x = 30;
  const z = 30;
  const y = world.surfaceMap[z * world.grid.sizeX + x] - 8;
  mutateVoxel(world, x, y, z, Material.AIR);
  expect(world.cavities.size).toBeGreaterThan(0);
  return { x, y, z };
}

describe("nest decay (spec §9.2)", () => {
  it("collapses an untrafficked subsurface cavity after the TTL", () => {
    const world = createWorld(5101);
    world.autoContinue = false; // isolate decay from refounding carves
    const spot = carveTestTunnel(world);

    world.tick = DECAY.ttlTicks + 1; // the cavity is long overdue
    for (let t = 0; t < DECAY.interval * 60; t++) {
      stepWorld(world);
    }
    expect(getVoxel(world.grid, spot.x, spot.y, spot.z)).toBe(Material.LOOSE_FILL);
    expect(world.cavities.size).toBe(0);
  });

  it("spares a trafficked cavity", () => {
    const world = createWorld(5102);
    const spot = carveTestTunnel(world);
    world.tick = DECAY.ttlTicks + 1;

    for (let t = 0; t < DECAY.interval * 60; t++) {
      world.lastVisit[(spot.y * world.grid.sizeZ + spot.z) * world.grid.sizeX + spot.x] =
        world.tick;
      stepWorld(world);
    }
    expect(getVoxel(world.grid, spot.x, spot.y, spot.z)).toBe(Material.AIR);
  });

  it("never collapses onto an egg", () => {
    const world = createWorld(5103);
    const spot = carveTestTunnel(world);
    world.tick = DECAY.ttlTicks + 1;
    const genome = rnnController.seed(world.rng);
    addEgg(world, {
      id: 1,
      x: spot.x,
      y: spot.y,
      z: spot.z,
      genome,
      energy: 0.3,
      incubationRemaining: 1_000_000,
      sex: 0,
      queenDestined: 0,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
    });

    for (let t = 0; t < DECAY.interval * 60; t++) {
      stepWorld(world);
    }
    expect(getVoxel(world.grid, spot.x, spot.y, spot.z)).toBe(Material.AIR);
  });
});

describe("egg exposure (spec §7.3)", () => {
  it("kills exposed surface eggs and spares buried ones", () => {
    const world = createWorld(5104);
    const x = 40;
    const z = 40;
    const surface = world.surfaceMap[z * world.grid.sizeX + x];
    const genome = rnnController.seed(world.rng);
    const spec = {
      genome,
      energy: 0.3,
      incubationRemaining: 1_000_000,
      sex: 0,
      queenDestined: 0,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
    };
    addEgg(world, { ...spec, id: 1, x, y: surface + 2, z });
    const by = surface - 6;
    mutateVoxel(world, x + 3, by, z, Material.AIR);
    addEgg(world, { ...spec, id: 2, x: x + 3, y: by, z });

    for (let t = 0; t < 4000 && world.eggs.length > 1; t++) {
      stepWorld(world);
    }
    expect(world.eggs.length).toBe(1);
    expect(world.eggs[0].id).toBe(2);
  });
});

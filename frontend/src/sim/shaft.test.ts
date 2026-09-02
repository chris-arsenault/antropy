import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { FULL_CONFIG, PHASE2_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { Material } from "./materials";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/**
 * Phase 2 step 1: the excavation is exactly the intended column, and
 * matter is accounted for. Assertions, not eyeballing — the shaft used to
 * wander between 1 and 2 voxels wide.
 */
function emptyWorld(seed: number, config = PHASE2_CONFIG): World {
  const world = createWorld(seed, rnnController, config);
  world.foodBase = 0; // no food: isolate excavation from foraging
  world.foodTarget = 0;
  return world;
}

function spawnDigger(world: World, x: number, z: number) {
  const y = surfaceSpawnY(world.grid, x, z) as number;
  const genome = rnnController.seed(world.rng);
  return spawnAnt(world, {
    x,
    y,
    z,
    heading: 0,
    energy: 1,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
    genome,
    controllerState: rnnController.createState(),
    traits: rnnController.physical(genome),
  });
}

interface Delta {
  excavated: { x: number; y: number; z: number }[];
  filled: { x: number; y: number; z: number }[];
}

function gridDelta(before: Uint8Array, world: World): Delta {
  const { sizeX, sizeZ } = world.grid;
  const slab = sizeX * sizeZ;
  const excavated: Delta["excavated"] = [];
  const filled: Delta["filled"] = [];
  for (let i = 0; i < before.length; i++) {
    const was = before[i];
    const now = world.grid.data[i];
    if (was === now) {
      continue;
    }
    const pos = {
      x: i % sizeX,
      y: Math.floor(i / slab),
      z: Math.floor(i / sizeX) % sizeZ,
    };
    if (was !== Material.AIR && now === Material.AIR) {
      excavated.push(pos);
    } else if (was === Material.AIR && now !== Material.AIR) {
      filled.push(pos);
    }
  }
  return { excavated, filled };
}

describe("shaft geometry (Phase 2 step 1)", () => {
  it("excavates exactly the intended column, one voxel wide", () => {
    const world = emptyWorld(9600);
    const ant = spawnDigger(world, 96, 96);
    const ox = ant.x;
    const oz = ant.z;
    const before = world.grid.data.slice();
    world.policyOverride = makeBuilder({ depth: 8 });
    resetBuilderState();
    for (let t = 0; t < 4000; t++) {
      stepWorld(world);
    }

    const { excavated, filled } = gridDelta(before, world);
    const offColumn = excavated.filter((v) => v.x !== ox || v.z !== oz);
    expect(
      offColumn.map((v) => `(${v.x},${v.y},${v.z})`).join(" "),
      "every excavated voxel is on the shaft column"
    ).toBe("");
    expect(excavated.length, "shaft reaches its depth").toBeGreaterThanOrEqual(8);
    // Contiguous: the column has no gaps between top and bottom.
    const ys = excavated.map((v) => v.y).sort((a, b) => a - b);
    expect(ys[ys.length - 1] - ys[0] + 1).toBe(ys.length);
    // Spoil vanishes in this config, so nothing is placed back.
    expect(filled.length).toBe(0);
  });

  it("conserves matter when hauling is on: every dug voxel is carried or placed", () => {
    // Hauling on, but refounding off: this isolates the excavation
    // mechanic. Mortality stays ON so the death path is covered too — a
    // dying carrier must return its load to the world, not delete it.
    const world = emptyWorld(9601, { ...FULL_CONFIG, autoContinue: false });
    spawnDigger(world, 96, 96);
    const before = world.grid.data.slice();
    world.policyOverride = makeBuilder({ depth: 6 });
    resetBuilderState();
    for (let t = 0; t < 4000; t++) {
      stepWorld(world);
    }

    const { excavated, filled } = gridDelta(before, world);
    const carried = world.ants.reduce((sum, a) => sum + a.spoilLoads, 0);
    expect(excavated.length, "the ant dug something").toBeGreaterThan(0);
    // Soil ledger only: corpses and perished brood enter the world as
    // FOOD (biomass), which is a separate accounting line.
    const spoilPlaced = filled.filter(
      (v) =>
        world.grid.data[
          v.y * world.grid.sizeX * world.grid.sizeZ + v.z * world.grid.sizeX + v.x
        ] !== Material.FOOD
    ).length;
    expect(
      spoilPlaced + carried,
      `dug=${excavated.length} spoilPlaced=${spoilPlaced} carried=${carried}`
    ).toBe(excavated.length);
  });
});

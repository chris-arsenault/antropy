import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { LADDER_STEP1_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/**
 * Phase 2 step 1: the excavation is exactly the intended column, and
 * matter is accounted for. Assertions, not eyeballing — the shaft used to
 * wander between 1 and 2 voxels wide.
 */
function emptyWorld(seed: number): World {
  const world = createWorld(seed, rnnController, LADDER_STEP1_CONFIG);
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

function shaftDepth(world: World, x: number, z: number, surfaceY: number): number {
  let y = surfaceY;
  while (y > 1 && getVoxelSafe(world.grid, x, y - 1, z) === Material.AIR) {
    y -= 1;
  }
  return surfaceY - y;
}

interface Delta {
  excavated: { x: number; y: number; z: number; material: number }[];
  filled: { x: number; y: number; z: number }[];
  changedRock: { x: number; y: number; z: number }[];
}

function gridDelta(before: Uint8Array, world: World): Delta {
  const { sizeX, sizeZ } = world.grid;
  const slab = sizeX * sizeZ;
  const excavated: Delta["excavated"] = [];
  const filled: Delta["filled"] = [];
  const changedRock: Delta["changedRock"] = [];
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
      excavated.push({ ...pos, material: was });
    } else if (was === Material.AIR && now !== Material.AIR) {
      filled.push(pos);
    }
    if (was === Material.ROCK) {
      changedRock.push(pos);
    }
  }
  return { excavated, filled, changedRock };
}

describe("shaft geometry (Phase 2 step 1)", () => {
  it("excavates exactly the intended column, one voxel wide", () => {
    const world = emptyWorld(9600);
    const ant = spawnDigger(world, 96, 96);
    const ox = ant.x;
    const oz = ant.z;
    const surfaceY = ant.y;
    const before = world.grid.data.slice();
    world.policyOverride = makeBuilder({ depth: 8 });
    resetBuilderState();
    let completedAt = -1;
    for (let t = 1; t <= 4000; t++) {
      stepWorld(world);
      const depth = shaftDepth(world, ox, oz, surfaceY);
      if (depth >= 8 && ant.spoilLoads === 0) {
        completedAt = t;
        break;
      }
    }

    const { excavated, filled, changedRock } = gridDelta(before, world);
    const offColumn = excavated.filter((v) => v.x !== ox || v.z !== oz);
    expect(
      offColumn.map((v) => `(${v.x},${v.y},${v.z})`).join(" "),
      "every excavated voxel is on the shaft column"
    ).toBe("");
    expect(completedAt, "shaft completes and all spoil is dumped").toBeGreaterThan(0);
    expect(excavated.length, "shaft is exactly eight voxels").toBe(8);
    // Contiguous: the column has no gaps between top and bottom.
    const ys = excavated.map((v) => v.y).sort((a, b) => a - b);
    expect(ys[ys.length - 1] - ys[0] + 1).toBe(ys.length);
    expect(
      excavated.every((v) => v.material === Material.TOPSOIL || v.material === Material.CLAY)
    ).toBe(true);
    expect(changedRock, "ROCK remains untouched").toEqual([]);
    expect(ant.spoilLoads, "all spoil is dumped").toBe(0);
    expect(filled.length, "spoil dumped equals voxels dug").toBe(excavated.length);

    mkdirSync("test-results", { recursive: true });
    writeFileSync(
      "test-results/shaft-economy.txt",
      `step=1 voxels=${excavated.length} ticks=${completedAt} ` +
        `ticksPerVoxel=${(completedAt / excavated.length).toFixed(3)}\n`
    );
  });

  it("conserves matter when hauling is on: every dug voxel is carried or placed", () => {
    const world = emptyWorld(9601);
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

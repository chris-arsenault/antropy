import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { PHASE2_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

// Phase 2 base case (spec §13): a scripted, immortal, known-behavior ant
// digs a real tunnel and stores food in it. Reports the outcome and
// asserts the base loop actually happened.
function spawnAt(world: World, x: number, z: number) {
  const y = surfaceSpawnY(world.grid, x, z) as number;
  const genome = rnnController.seed(world.rng);
  return spawnAnt(world, {
    x, y, z,
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

/** Deepest contiguous air below the surface within a small area. */
function tunnelDepth(world: World, cx: number, cz: number): number {
  let deepest = 0;
  for (let dx = -2; dx <= 6; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const x = cx + dx;
      const z = cz + dz;
      const surface = world.surfaceMap[z * world.grid.sizeX + x];
      let y = surface;
      while (y > 1 && getVoxelSafe(world.grid, x, y - 1, z) === Material.AIR) {
        y -= 1;
      }
      deepest = Math.max(deepest, surface - y);
    }
  }
  return deepest;
}

/** Count FOOD voxels stored below the surface near the shaft. */
function storedFood(world: World, cx: number, cz: number): number {
  let count = 0;
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
    const surface = world.surfaceMap[z * world.grid.sizeX + x];
    if (y < surface && Math.abs(x - cx) <= 8 && Math.abs(z - cz) <= 8) {
      count += 1;
    }
  }
  return count;
}

describe("Phase 2 builder base case (spec §13)", () => {
  mkdirSync("test-results", { recursive: true });
  it("one immortal ant digs a tunnel", { timeout: 120_000 }, () => {
    resetBuilderState();
    const world = createWorld(700, rnnController, PHASE2_CONFIG);
    const ant = spawnAt(world, 96, 96);
    const ox = ant.x;
    const oz = ant.z;
    world.policyOverride = makeBuilder({ depth: 8 });
    for (let t = 0; t < 8000; t++) {
      stepWorld(world);
    }
    const depth = tunnelDepth(world, ox, oz);
    appendFileSync("test-results/builder.txt", `one-ant tunnel depth=${depth}\n`);
    expect(depth, `tunnel depth ${depth}`).toBeGreaterThanOrEqual(4);
  });

  it("a few immortal ants dig and store food underground", { timeout: 180_000 }, () => {
    resetBuilderState();
    const world = createWorld(701, rnnController, PHASE2_CONFIG);
    // Seed some surface food to forage.
    world.foodBase = 200;
    world.foodTarget = 200;
    const ants = [spawnAt(world, 96, 96), spawnAt(world, 97, 96), spawnAt(world, 96, 97)];
    const ox = 96;
    const oz = 96;
    world.policyOverride = makeBuilder({ depth: 6 });
    for (let t = 0; t < 16000; t++) {
      stepWorld(world);
    }
    const depth = tunnelDepth(world, ox, oz);
    const stored = storedFood(world, ox, oz);
    appendFileSync(
      "test-results/builder.txt",
      `colony ants=${ants.length} tunnelDepth=${depth} storedFood=${stored}\n`
    );
    expect(depth, `tunnel depth ${depth}`).toBeGreaterThanOrEqual(4);
    expect(stored, `stored food ${stored}`).toBeGreaterThan(0);
  });
});

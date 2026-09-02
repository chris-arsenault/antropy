import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { spoilCapacity, tryDig } from "./actions";
import { FULL_CONFIG, PHASE2_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { createWorld, spawnAnt, type World } from "./world";

function diggerAt(world: World, x: number, z: number) {
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

/** Solid voxels in the ant's immediate work envelope. */
function countSolid(world: World, cx: number, cy: number, cz: number): number {
  let solid = 0;
  for (let dy = -2; dy <= 1; dy++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (getVoxel(world.grid, cx + dx, cy + dy, cz + dz) !== Material.AIR) {
          solid += 1;
        }
      }
    }
  }
  return solid;
}

describe("spoil hauling config", () => {
  it("with hauling off, digging clears a voxel and the soil vanishes", () => {
    const world = createWorld(8800, rnnController, PHASE2_CONFIG);
    const ant = diggerAt(world, 96, 96);
    const solidBefore = countSolid(world, ant.x, ant.y, ant.z);

    tryDig(world, ant, -1);

    // Exactly one voxel excavated, and it left the world entirely: no
    // load carried, nothing to deposit later.
    expect(countSolid(world, ant.x, ant.y, ant.z)).toBe(solidBefore - 1);
    expect(ant.spoilLoads).toBe(0);
    expect(ant.carrying).toBeNull();
    expect(ant.energy).toBeLessThan(1); // dig cost still paid
  });

  it("with hauling on, digging loads spoil the ant must deposit", () => {
    const world = createWorld(8801, rnnController, FULL_CONFIG);
    const ant = diggerAt(world, 96, 96);

    tryDig(world, ant, -1);

    expect(ant.spoilLoads).toBe(1);
    expect(ant.carrying).not.toBeNull();
  });
});

describe("spoil capacity config", () => {
  it("uses the genome-derived capacity by default", () => {
    const world = createWorld(8802, rnnController, FULL_CONFIG);
    const ant = diggerAt(world, 96, 96);
    expect(spoilCapacity(ant, world.config)).toBe(
      Math.max(1, Math.round(ant.traits.bodyScale * 2))
    );
  });

  it("honors a config override", () => {
    const world = createWorld(8803, rnnController, { ...FULL_CONFIG, spoilCapacity: 7 });
    const ant = diggerAt(world, 96, 96);
    expect(spoilCapacity(ant, world.config)).toBe(7);
  });
});

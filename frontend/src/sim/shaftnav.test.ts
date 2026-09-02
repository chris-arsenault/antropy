import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { PHASE2_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { applyMotor } from "./locomotion";
import { Material } from "./materials";
import { createWorld, mutateVoxel, spawnAnt } from "./world";

/**
 * A 1-wide vertical shaft must be navigable in both directions (the base
 * case's entrance): an ant commanded down descends it, an ant commanded up
 * climbs out. Drives applyMotor directly — pure locomotion, no controller.
 */
function carve1x1Shaft(world: ReturnType<typeof createWorld>, x: number, z: number, depth: number) {
  // Capture the natural surface mouth BEFORE carving (afterwards a
  // top-down scan would find the shaft floor instead). The ant stands at
  // mouthY (air); carve the solid directly below it down `depth` voxels.
  const mouthY = surfaceSpawnY(world.grid, x, z) as number;
  for (let d = 1; d <= depth; d++) {
    mutateVoxel(world, x, mouthY - d, z, Material.AIR);
  }
  return { floor: mouthY - depth, mouthY };
}

function placeAnt(world: ReturnType<typeof createWorld>, x: number, y: number, z: number) {
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

describe("1x1 shaft navigation", () => {
  it("an ant commanded downward descends a 1-wide shaft", () => {
    const world = createWorld(9500, rnnController, PHASE2_CONFIG);
    const x = 96;
    const z = 96;
    const { mouthY } = carve1x1Shaft(world, x, z, 6);
    const ant = placeAnt(world, x, mouthY, z);
    const startY = ant.y;
    const trace: string[] = [];
    for (let t = 0; t < 40; t++) {
      applyMotor(world.grid, ant, { turn: 0, forward: 1, verticalBias: -1 });
      if (t < 8) trace.push(`(${ant.x},${ant.y},${ant.z})`);
    }
    expect(ant.y, `from ${startY}: ${trace.join(" ")} -> (${ant.x},${ant.y},${ant.z})`).toBeLessThanOrEqual(
      mouthY - 4
    );
    expect(ant.x).toBe(x);
    expect(ant.z).toBe(z);
  });

  it("an ant commanded upward climbs out of a 1-wide shaft", () => {
    const world = createWorld(9501, rnnController, PHASE2_CONFIG);
    const x = 96;
    const z = 96;
    const { floor, mouthY } = carve1x1Shaft(world, x, z, 6);
    const ant = placeAnt(world, x, floor + 1, z);
    const startY = ant.y;
    for (let t = 0; t < 40; t++) {
      applyMotor(world.grid, ant, { turn: 0, forward: 1, verticalBias: 1 });
    }
    expect(ant.y, `climbed from ${startY} to ${ant.y}`).toBeGreaterThanOrEqual(mouthY - 1);
  });
});

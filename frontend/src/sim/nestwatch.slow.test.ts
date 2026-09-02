import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { PHASE2_CONFIG } from "./config";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { omniscientOracle } from "./oracles/policies";
import { rnnController } from "./controller/rnn";
import { createWorld, stepWorld, type World } from "./world";

// DIRECT OBSERVATION (not a harness metric): the spec §13 Phase 2 base
// case — known-behavior ants, ecology + digging on, every later-phase
// liability OFF via config. Reports; never asserts a tuned number.
function airAround(world: World, cx: number, cy: number, cz: number): number {
  let air = 0;
  for (let dy = -1; dy <= 2; dy++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (getVoxelSafe(world.grid, cx + dx, cy + dy, cz + dz) === Material.AIR) {
          air += 1;
        }
      }
    }
  }
  return air;
}

describe("Phase 2 base-case watch (spec §13)", () => {
  it("nest holds and food is stored with liabilities off", { timeout: 300_000 }, () => {
    const world = createWorld(42, rnnController, PHASE2_CONFIG);
    const colony = foundColony(world);
    world.policyOverride = omniscientOracle; // known behavior (rung 1)
    const qx = colony.x;
    const qy = colony.y;
    const qz = colony.z;
    const startClearance = airAround(world, qx, qy, qz);

    const lines: string[] = [];
    for (let t = 1; t <= 20_000; t++) {
      stepWorld(world);
      if (t % 4000 === 0) {
        lines.push(
          `t=${t} ants=${world.ants.length} stock=${colony.stockpile.toFixed(1)} ` +
            `clearance=${airAround(world, qx, qy, qz)}/${startClearance} ` +
            `belowQ=${getVoxelSafe(world.grid, qx, qy - 1, qz)}`
        );
      }
    }
    console.info("PHASE2 WATCH seed 42:\n" + lines.join("\n"));

    // Base-case invariants: immortal known-behavior ants persist (no
    // mortality), the pre-carved nest does not fill in around the queen
    // (decay off — a deposit may shift one voxel), and food is stored.
    expect(world.ants.length).toBe(40);
    expect(airAround(world, qx, qy, qz)).toBeGreaterThanOrEqual(startClearance - 1);
    expect(getVoxelSafe(world.grid, qx, qy - 1, qz)).not.toBe(Material.AIR); // queen supported
    expect(colony.stockpile).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { PHASE2_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxelSafe, voxelIndex } from "./grid";
import { Material } from "./materials";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { sampleScent } from "./scent";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/**
 * Phase 2 step 3: rule 1 (amplify) — mark channel A while digging and
 * prefer the strongest-marked face. Solo, the rule must be inert: every
 * lateral neighbour is unexcavated and unmarked, so the dig-down bias
 * still carries and the shaft still completes.
 */
const TARGET_DEPTH = 8;

function shaftDepth(world: World, x: number, z: number, surfaceY: number): number {
  let y = surfaceY;
  while (y > 1 && getVoxelSafe(world.grid, x, y - 1, z) === Material.AIR) {
    y -= 1;
  }
  return surfaceY - y;
}

function digger(world: World, x: number, z: number) {
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

describe("amplify rule (Phase 2 step 3)", () => {
  it("one ant still completes the shaft, and marks it while digging", () => {
    const world = createWorld(9800, rnnController, { ...PHASE2_CONFIG, mortality: true });
    world.foodBase = 0;
    world.foodTarget = 0;
    const x = 96;
    const z = 96;
    const ant = digger(world, x, z);
    const surfaceY = ant.y;
    resetBuilderState();
    world.policyOverride = makeBuilder({ depth: TARGET_DEPTH, amplify: true });

    // Run until the shaft is done (an empty world starves any ant given
    // enough idle time — that is step 2's economy question, not this one).
    let completedAt = -1;
    for (let t = 1; t <= 2000 && completedAt < 0; t++) {
      stepWorld(world);
      if (world.ants.length === 0) {
        break;
      }
      if (shaftDepth(world, x, z, surfaceY) >= TARGET_DEPTH) {
        completedAt = t;
      }
    }

    const depth = shaftDepth(world, x, z, surfaceY);
    expect(world.ants.length, `the ant survived (completed at ${completedAt})`).toBe(1);
    expect(ant.energy, `energy left ${ant.energy.toFixed(3)}`).toBeGreaterThan(0.5);
    expect(depth, `amplify must not break solo digging (depth ${depth})`).toBeGreaterThanOrEqual(
      TARGET_DEPTH
    );

    // The work site carries channel-A marking: that is what later ants
    // amplify. Sample the shaft interior.
    let marked = 0;
    for (let d = 1; d <= depth; d++) {
      if (sampleScent(world.pheromoneA, voxelIndex(world.grid, x, surfaceY - d, z), 0) > 0) {
        marked += 1;
      }
    }
    expect(marked, `marked shaft voxels (${marked} of ${depth})`).toBeGreaterThan(0);
  });
});

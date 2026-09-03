import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { LADDER_STEP2_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/**
 * Phase 2 step 2: with the energy economy ON (mortality, dig costs,
 * metabolism), a known-behavior ant must be able to sink a shaft and
 * still have energy left. This is Appendix B's R6 in test form — the
 * constants have to permit digging before any behavior can choose it.
 */
const TARGET_DEPTH = 8;

function shaftDepth(world: World, x: number, z: number, surfaceY: number): number {
  let y = surfaceY;
  while (y > 1 && getVoxelSafe(world.grid, x, y - 1, z) === Material.AIR) {
    y -= 1;
  }
  return surfaceY - y;
}

describe("dig economy with energy on (Phase 2 step 2)", () => {
  it("a mortal ant completes the shaft with energy to spare", () => {
    const world = createWorld(9700, rnnController, LADDER_STEP2_CONFIG);
    world.foodBase = 0; // no foraging: the shaft must be affordable alone
    world.foodTarget = 0;
    const x = 96;
    const z = 96;
    const y = surfaceSpawnY(world.grid, x, z) as number;
    const genome = rnnController.seed(world.rng);
    const ant = spawnAnt(world, {
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
    resetBuilderState();
    world.policyOverride = makeBuilder({ depth: TARGET_DEPTH });

    let completedAt = -1;
    let energyAtCompletion = 0;
    for (let t = 1; t <= 6000 && completedAt < 0; t++) {
      stepWorld(world);
      if (world.ants.length === 0) {
        break; // starved before finishing
      }
      if (shaftDepth(world, x, z, y) >= TARGET_DEPTH) {
        completedAt = t;
        energyAtCompletion = ant.energy;
      }
    }

    mkdirSync("test-results", { recursive: true });
    appendFileSync(
      "test-results/dig-economy.txt",
      `depth=${TARGET_DEPTH} completedAtTick=${completedAt} ` +
        `energyLeft=${energyAtCompletion.toFixed(3)} of 1.000\n`
    );

    expect(world.ants.length, "the ant survived the excavation").toBe(1);
    expect(completedAt, `shaft of ${TARGET_DEPTH} completed (tick ${completedAt})`).toBeGreaterThan(
      0
    );
    // "With energy to spare": finishing on fumes means the constants only
    // barely permit digging, and no evolved behavior could choose it.
    expect(
      energyAtCompletion,
      `energy left at completion (tick ${completedAt}): ${energyAtCompletion.toFixed(3)}`
    ).toBeGreaterThan(0.5);
  });
});

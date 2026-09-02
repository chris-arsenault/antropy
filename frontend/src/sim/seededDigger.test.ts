import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { PHASE2_CONFIG } from "./config";
import { diggerSeedVector, rnnController, setRuntimeSeedBase } from "./controller/rnn";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { createRng } from "./rng";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/**
 * Phase 2 step 8: the first true Phase-2 moment — one ant driven by the
 * REAL controller through the REAL sensors (no policy override), with
 * energy on, must sink a shaft comparable to the step-2 oracle's.
 */
const TARGET_DEPTH = 8;

function shaftDepth(world: World, x: number, z: number, surfaceY: number): number {
  let y = surfaceY;
  while (y > 1 && getVoxelSafe(world.grid, x, y - 1, z) === Material.AIR) {
    y -= 1;
  }
  return surfaceY - y;
}

interface Run {
  depth: number;
  excavated: number;
  alive: boolean;
  energy: number;
  completedAt: number;
}

/** Voxels turned from solid to air anywhere near the spawn. */
function excavatedCount(before: Uint8Array, world: World): number {
  let dug = 0;
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== Material.AIR && world.grid.data[i] === Material.AIR) {
      dug += 1;
    }
  }
  return dug;
}

/** One seeded ant, real controller. `noisy` uses the shipped seed() path. */
function runSeededDigger(seed: number, noisy: boolean): Run {
  const world = createWorld(seed, rnnController, { ...PHASE2_CONFIG, mortality: true });
  world.foodBase = 0;
  world.foodTarget = 0;
  const x = 96;
  const z = 96;
  const y = surfaceSpawnY(world.grid, x, z) as number;

  setRuntimeSeedBase(diggerSeedVector());
  const genome = noisy
    ? rnnController.seed(createRng(seed))
    : rnnController.deserializeGenome(diggerSeedVector());
  setRuntimeSeedBase(null);

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

  const before = world.grid.data.slice();
  let completedAt = -1;
  for (let t = 1; t <= 3000 && completedAt < 0; t++) {
    stepWorld(world);
    if (world.ants.length === 0) {
      break;
    }
    if (shaftDepth(world, x, z, y) >= TARGET_DEPTH) {
      completedAt = t;
    }
  }
  return {
    depth: shaftDepth(world, x, z, y),
    excavated: excavatedCount(before, world),
    alive: world.ants.length > 0,
    energy: ant.energy,
    completedAt,
  };
}

describe("seeded digger, real controller (Phase 2 step 8)", () => {
  it("sinks a shaft comparable to the oracle's", () => {
    const run = runSeededDigger(9950, false);
    mkdirSync("test-results", { recursive: true });
    appendFileSync(
      "test-results/seeded-digger.txt",
      `pure: depth=${run.depth} completedAtTick=${run.completedAt} ` +
        `energy=${run.energy.toFixed(3)} alive=${run.alive}\n`
    );
    expect(run.alive, "the ant survived its own shaft").toBe(true);
    expect(run.depth, `depth ${run.depth} (tick ${run.completedAt})`).toBeGreaterThanOrEqual(
      TARGET_DEPTH
    );
    expect(run.energy, `energy left ${run.energy.toFixed(3)}`).toBeGreaterThan(0.5);
  });

  it("still digs through the shipped seed() noise", () => {
    const runs = [9951, 9952, 9953].map((s) => runSeededDigger(s, true));
    appendFileSync(
      "test-results/seeded-digger.txt",
      runs
        .map(
          (r, i) =>
            `noisy${i}: depth=${r.depth} excavated=${r.excavated} energy=${r.energy.toFixed(3)}`
        )
        .join("\n") + "\n"
    );
    // Noise perturbs every locus, including the turn bias — a draw that
    // wanders digs a crooked gallery rather than a plumb shaft, so the
    // claim under test is that it still EXCAVATES, not that it sinks a
    // column. (Straightness under noise is evolution's to clean up.)
    for (const run of runs) {
      expect(run.excavated, `noisy excavation ${run.excavated} voxels`).toBeGreaterThanOrEqual(4);
    }
  });
});

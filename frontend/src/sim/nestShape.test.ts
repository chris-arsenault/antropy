import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { PHASE2_CONFIG } from "./config";
import { diggerSeedVector, rnnController, setRuntimeSeedBase } from "./controller/rnn";
import { crossSection, isNotALine, measureNest } from "./nestMetrics";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { createRng } from "./rng";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/**
 * Phase 2 steps 4 and 9: the shape test. A crew — first the scripted
 * oracle, then the real RNN controller — must leave an excavation that is
 * no longer a line. Any branch or widening passes.
 */
const SITE = { x: 96, z: 96 };
const CREW = 8;

/** Spawn a cluster around the site; returns the site's surface level. */
function crew(world: World, count: number, genomeFor: (i: number) => ReturnType<typeof rnnController.seed>): number {
  let surfaceY = 0;
  for (let i = 0; i < count; i++) {
    const x = SITE.x + ((i % 3) - 1);
    const z = SITE.z + (Math.floor(i / 3) - 1);
    const y = surfaceSpawnY(world.grid, x, z);
    if (y === null) {
      continue;
    }
    const genome = genomeFor(i);
    spawnAnt(world, {
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
    if (x === SITE.x && z === SITE.z) {
      surfaceY = y;
    }
  }
  return surfaceY;
}

function record(label: string, world: World, surfaceY: number): void {
  const shape = measureNest(world, SITE, surfaceY);
  mkdirSync("test-results", { recursive: true });
  appendFileSync(
    "test-results/nest-shape.txt",
    `${label}: volume=${shape.volume} levels=${shape.levels} ` +
      `maxWidth=${shape.maxWidth} branchVoxels=${shape.branchVoxels}\n` +
      crossSection(world, SITE, surfaceY) +
      "\n"
  );
}

describe("nest shape (Phase 2 steps 4 and 9)", () => {
  it("step 4: the scripted crew digs a network that is not a line", () => {
    const world = createWorld(9900, rnnController, PHASE2_CONFIG);
    world.foodBase = 0;
    world.foodTarget = 0;
    const surfaceY = crew(world, CREW, () => rnnController.seed(world.rng));
    resetBuilderState();
    world.policyOverride = makeBuilder({
      depth: 12,
      amplify: true,
      overflowCrowding: 2,
      column: SITE,
    });

    for (let t = 0; t < 3000; t++) {
      stepWorld(world);
    }

    const shape = measureNest(world, SITE, surfaceY);
    record("oracle", world, surfaceY);
    expect(shape.volume, "the crew excavated a network").toBeGreaterThan(CREW);
    expect(
      isNotALine(shape),
      `volume=${shape.volume} levels=${shape.levels} maxWidth=${shape.maxWidth} branches=${shape.branchVoxels}`
    ).toBe(true);
  });

  it("step 9: the seeded RNN crew digs a network that is not a line", () => {
    const world = createWorld(9900, rnnController, { ...PHASE2_CONFIG, mortality: true });
    world.foodBase = 0;
    world.foodTarget = 0;
    // Real controller, real sensors: no policy override anywhere here.
    setRuntimeSeedBase(diggerSeedVector());
    const surfaceY = crew(world, CREW, (i) => rnnController.seed(createRng(6100 + i)));
    setRuntimeSeedBase(null);

    for (let t = 0; t < 3000; t++) {
      stepWorld(world);
    }

    const shape = measureNest(world, SITE, surfaceY);
    record("seeded-rnn", world, surfaceY);
    expect(shape.volume, "the RNN crew excavated a network").toBeGreaterThan(CREW);
    expect(
      isNotALine(shape),
      `volume=${shape.volume} levels=${shape.levels} maxWidth=${shape.maxWidth} branches=${shape.branchVoxels}`
    ).toBe(true);
  });
});

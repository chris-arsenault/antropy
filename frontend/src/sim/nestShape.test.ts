import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { LADDER_STEP2_CONFIG } from "./config";
import {
  diggerSeedVector,
  functionalSeedVector,
  rnnController,
  setRuntimeSeedBase,
  shaftSeedVector,
} from "./controller/rnn";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { classifyNest, crossSection, hasSymmetryBrokenStructure, measureNest } from "./nestMetrics";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { premarkDigSite } from "./oracles/digSite";
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
function crew(
  world: World,
  count: number,
  genomeFor: (i: number) => ReturnType<typeof rnnController.seed>
): number {
  let surfaceY = 0;
  for (let i = 0; i < count; i++) {
    const x = SITE.x;
    const z = SITE.z;
    const y = surfaceSpawnY(world.grid, x, z);
    if (y === null) {
      continue;
    }
    const genome = genomeFor(i);
    spawnAnt(world, {
      x,
      y,
      z,
      heading: (i % 4) * (Math.PI / 2),
      energy: 1,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
      genome,
      controllerState: rnnController.createState(),
      traits: rnnController.physical(genome),
    });
    surfaceY = y;
  }
  return surfaceY;
}

function record(label: string, world: World, surfaceY: number): void {
  const shape = measureNest(world, SITE, surfaceY);
  const morphology = classifyNest(world);
  mkdirSync("test-results", { recursive: true });
  appendFileSync(
    "test-results/nest-shape.txt",
    `${label}: volume=${shape.volume} levels=${shape.levels} ` +
      `maxWidth=${shape.maxWidth} branchVoxels=${shape.branchVoxels} ` +
      `corridor=${morphology.corridorVoxels} nonCorridor=${morphology.nonCorridorVoxels} ` +
      `voids=${JSON.stringify(morphology.voids)} ` +
      `connectivity=${JSON.stringify(morphology.networkComponentVolumes)} ` +
      `degrees=${JSON.stringify(morphology.airDegreeDistribution)}\n` +
      crossSection(world, SITE, surfaceY) +
      "\n"
  );
}

function shaftDepth(world: World, surfaceY: number): number {
  let y = surfaceY;
  while (y > 1 && getVoxelSafe(world.grid, SITE.x, y - 1, SITE.z) === Material.AIR) {
    y -= 1;
  }
  return surfaceY - y;
}

/** Stop at construction completion or the first death, before corpse-foraging can alter shape. */
function runConstruction(world: World, surfaceY: number, targetDepth: number): void {
  const startingAnts = world.ants.length;
  for (let t = 0; t < 3000; t++) {
    stepWorld(world);
    if (world.ants.length < startingAnts) {
      return;
    }
    if (
      shaftDepth(world, surfaceY) >= targetDepth &&
      world.ants.every((ant) => ant.spoilLoads === 0)
    ) {
      return;
    }
  }
}

describe("nest shape (Phase 2 steps 4 and 9)", () => {
  it("step 4 control: dig-down alone remains a line", () => {
    const world = createWorld(9900, rnnController, LADDER_STEP2_CONFIG);
    world.foodBase = 0;
    world.foodTarget = 0;
    const surfaceY = crew(world, CREW, () => rnnController.seed(world.rng));
    resetBuilderState();
    world.policyOverride = makeBuilder({ depth: 12, column: SITE });

    runConstruction(world, surfaceY, 12);

    const shape = measureNest(world, SITE, surfaceY);
    const morphology = classifyNest(world);
    record("oracle-control", world, surfaceY);
    expect(shape.volume, "the control crew excavated a shaft").toBeGreaterThan(0);
    expect(
      hasSymmetryBrokenStructure(morphology),
      `corridor=${morphology.corridorVoxels} nonCorridor=${morphology.nonCorridorVoxels} branches=${morphology.branchVoxels}`
    ).toBe(false);
  });

  it("step 4: the scripted crew digs a network that is not a line", () => {
    const world = createWorld(9900, rnnController, LADDER_STEP2_CONFIG);
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

    runConstruction(world, surfaceY, 12);

    const shape = measureNest(world, SITE, surfaceY);
    const morphology = classifyNest(world);
    record("oracle", world, surfaceY);
    expect(shape.volume, "the crew excavated a network").toBeGreaterThan(CREW);
    expect(
      hasSymmetryBrokenStructure(morphology),
      `corridor=${morphology.corridorVoxels} nonCorridor=${morphology.nonCorridorVoxels} branches=${morphology.branchVoxels}`
    ).toBe(true);
  });
});

describe("seeded RNN nest existence (Appendix D step 9)", () => {
  it("step 9: the seeded RNN crew digs a network that is not a line", () => {
    const world = createWorld(9900, rnnController, LADDER_STEP2_CONFIG);
    world.foodBase = 0;
    world.foodTarget = 0;
    // Real controller, real sensors: no policy override anywhere here.
    setRuntimeSeedBase(diggerSeedVector());
    const surfaceY = crew(world, CREW, (i) => rnnController.seed(createRng(6100 + i)));
    setRuntimeSeedBase(null);
    premarkDigSite(world, SITE.x, surfaceY, SITE.z, 0);

    runConstruction(world, surfaceY, 12);

    const shape = measureNest(world, SITE, surfaceY);
    const morphology = classifyNest(world);
    record("seeded-rnn", world, surfaceY);
    expect(shape.volume, "the RNN crew excavated a network").toBeGreaterThan(CREW);
    expect(
      hasSymmetryBrokenStructure(morphology),
      `corridor=${morphology.corridorVoxels} nonCorridor=${morphology.nonCorridorVoxels} branches=${morphology.branchVoxels}`
    ).toBe(true);
  });

  it("step 9 control: dig-down-only RNN crew remains a line", () => {
    const world = createWorld(9900, rnnController, LADDER_STEP2_CONFIG);
    world.foodBase = 0;
    world.foodTarget = 0;
    setRuntimeSeedBase(shaftSeedVector());
    const surfaceY = crew(world, CREW, (i) => rnnController.seed(createRng(6100 + i)));
    setRuntimeSeedBase(null);

    runConstruction(world, surfaceY, 12);

    const shape = measureNest(world, SITE, surfaceY);
    const morphology = classifyNest(world);
    record("seeded-rnn-control", world, surfaceY);
    expect(shape.volume, "the RNN control crew excavated a shaft").toBeGreaterThan(0);
    expect(
      hasSymmetryBrokenStructure(morphology),
      `corridor=${morphology.corridorVoxels} nonCorridor=${morphology.nonCorridorVoxels} branches=${morphology.branchVoxels}`
    ).toBe(false);
  });

  it("step 12: the transport extension retains noisy-colony construction", () => {
    const world = createWorld(9900, rnnController, {
      ...LADDER_STEP2_CONFIG,
      motorJitter: true,
    });
    world.foodBase = 0;
    world.foodTarget = 0;
    setRuntimeSeedBase(functionalSeedVector());
    let surfaceY: number;
    try {
      surfaceY = crew(world, CREW, (i) => rnnController.seed(createRng(6100 + i)));
    } finally {
      setRuntimeSeedBase(null);
    }
    premarkDigSite(world, SITE.x, surfaceY, SITE.z, 0);

    runConstruction(world, surfaceY, 12);

    const shape = measureNest(world, SITE, surfaceY);
    const morphology = classifyNest(world);
    record("functional-seeded-rnn", world, surfaceY);
    expect(shape.volume, "the functional RNN crew excavated a network").toBeGreaterThan(CREW);
    expect(
      hasSymmetryBrokenStructure(morphology),
      `corridor=${morphology.corridorVoxels} nonCorridor=${morphology.nonCorridorVoxels} branches=${morphology.branchVoxels}`
    ).toBe(true);
  });
});

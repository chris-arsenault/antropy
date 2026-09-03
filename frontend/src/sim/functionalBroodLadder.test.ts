import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { LADDER_STEP11B_CONFIG, LADDER_STEP2_CONFIG } from "./config";
import { functionalSeedVector, rnnController, setRuntimeSeedBase } from "./controller/rnn";
import { addEgg, STAGE_EGG, type Egg } from "./eggs";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { makeBroodCarrier } from "./oracles/brood";
import { premarkDigSite } from "./oracles/digSite";
import { createRng } from "./rng";
import { COLONY } from "./tunables";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

const SITE = { x: 96, z: 96 } as const;
const TARGET_DEPTH = 8;
const COHORT_SIZE = 2;
const COHORT_MOTHER_ID = -12_000;
const HARSH_MIDDAY_TICK = 30_500;
const OFFSETS = [
  { dx: -1, dz: 0, heading: 0 },
  { dx: 0, dz: -1, heading: Math.PI / 2 },
] as const;
const CREW_OFFSETS = [
  { dx: -2, dz: 0, heading: 0 },
  { dx: -2, dz: -1, heading: 0 },
  { dx: 0, dz: -2, heading: Math.PI / 2 },
  { dx: -1, dz: -2, heading: Math.PI / 2 },
  { dx: 2, dz: 0, heading: Math.PI },
  { dx: 2, dz: 1, heading: Math.PI },
  { dx: 0, dz: 2, heading: -Math.PI / 2 },
  { dx: 1, dz: 2, heading: -Math.PI / 2 },
] as const;

function exactGenome() {
  return rnnController.deserializeGenome(functionalSeedVector());
}

function noisyGenome(seed: number) {
  setRuntimeSeedBase(functionalSeedVector());
  try {
    return rnnController.seed(createRng(seed));
  } finally {
    setRuntimeSeedBase(null);
  }
}

function spawnWorker(
  world: World,
  x: number,
  y: number,
  z: number,
  heading: number,
  genome = exactGenome()
) {
  return spawnAnt(world, {
    x,
    y,
    z,
    heading,
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

function shaftDepth(world: World, surfaceY: number): number {
  let y = surfaceY;
  while (y > 1 && getVoxelSafe(world.grid, SITE.x, y - 1, SITE.z) === Material.AIR) {
    y -= 1;
  }
  return surfaceY - y;
}

function dugShaft(seed: number): { world: World; surfaceY: number } {
  const world = createWorld(seed, rnnController, LADDER_STEP2_CONFIG);
  world.foodBase = 0;
  world.foodTarget = 0;
  const surfaceY = surfaceSpawnY(world.grid, SITE.x, SITE.z) as number;
  const builder = spawnWorker(world, SITE.x, surfaceY, SITE.z, 0);
  premarkDigSite(world, SITE.x, surfaceY, SITE.z, 0);
  let constructionTicks = 0;
  for (let tick = 0; tick < 2_000; tick++) {
    stepWorld(world);
    constructionTicks = tick + 1;
    if (shaftDepth(world, surfaceY) >= TARGET_DEPTH && builder.spoilLoads === 0) {
      break;
    }
  }
  const constructionTrace = JSON.stringify({
    constructionTicks,
    alive: builder.alive,
    depth: shaftDepth(world, surfaceY),
    loads: builder.spoilLoads,
    energy: builder.energy,
    position: { x: builder.x, y: builder.y, z: builder.z },
    inputs: Array.from(builder.lastInputs),
    outputs: Array.from(builder.lastOutputs),
  });
  expect(
    builder.alive,
    `functional seed retains construction competence: ${constructionTrace}`
  ).toBe(true);
  expect(shaftDepth(world, surfaceY), constructionTrace).toBeGreaterThanOrEqual(TARGET_DEPTH);
  expect(builder.spoilLoads).toBe(0);
  world.ants = [];
  world.config = { ...LADDER_STEP11B_CONFIG, reproduction: false, motorJitter: true };
  world.tick = HARSH_MIDDAY_TICK;
  premarkDigSite(world, SITE.x, surfaceY, SITE.z, 0);
  return { world, surfaceY };
}

function addCohort(world: World, surfaceY: number): Egg[] {
  return OFFSETS.map(({ dx, dz }) => {
    const x = SITE.x + dx;
    const z = SITE.z + dz;
    if (getVoxelSafe(world.grid, x, surfaceY, z) !== Material.AIR) {
      throw new Error(`cohort source is not AIR at (${x},${surfaceY},${z})`);
    }
    const egg: Egg = {
      id: world.nextEggId++,
      x,
      y: surfaceY,
      z,
      carrierId: null,
      genome: exactGenome(),
      energy: 0.3,
      incubationRemaining: COLONY.incubationTicks,
      stage: STAGE_EGG,
      fedProgress: 0,
      hungerTicks: 0,
      sex: 0,
      queenDestined: 0,
      lineageId: 0,
      patrilineId: 0,
      motherId: COHORT_MOTHER_ID,
      fatherId: 0,
    };
    addEgg(world, egg);
    return egg;
  });
}

interface ArmResult {
  survival: number;
  pickedUp: number;
  delivered: number;
  eggsPerished: number;
  deliveryPositions: {
    id: number;
    tick: number;
    depth: number;
  }[];
  finalDepths: number[];
}

function runArm(seed: number, carrierSeedBase: number, oracle: boolean): ArmResult {
  const { world, surfaceY } = dugShaft(seed);
  const eggs = addCohort(world, surfaceY);
  for (const [index, { dx, dz, heading }] of CREW_OFFSETS.entries()) {
    const x = SITE.x + dx;
    const z = SITE.z + dz;
    const y = surfaceSpawnY(world.grid, x, z);
    expect(y, "crew member starts on supported surface air").not.toBeNull();
    spawnWorker(world, x, y as number, z, heading, noisyGenome(carrierSeedBase + index));
  }
  if (oracle) {
    world.policyOverride = makeBroodCarrier({
      destination: { x: SITE.x, y: surfaceY - TARGET_DEPTH, z: SITE.z },
      unloadedWaypoints: [],
      loadedWaypoints: [{ x: SITE.x, y: surfaceY, z: SITE.z }],
    });
  }
  const pickedUp = new Set<number>();
  const delivered = new Set<number>();
  const deliveryPositions: ArmResult["deliveryPositions"] = [];
  const previousCarrier = new Map(eggs.map((egg) => [egg.id, egg.carrierId]));
  for (let tick = 0; tick < COLONY.incubationTicks; tick++) {
    stepWorld(world);
    for (const egg of eggs) {
      if (egg.carrierId !== null) {
        pickedUp.add(egg.id);
      } else if (previousCarrier.get(egg.id) !== null) {
        delivered.add(egg.id);
        const surface = world.surfaceMap[egg.z * world.grid.sizeX + egg.x];
        deliveryPositions.push({
          id: egg.id,
          tick: tick + 1,
          depth: surface - egg.y,
        });
      }
      previousCarrier.set(egg.id, egg.carrierId);
    }
  }
  const grounded = world.eggs.filter((egg) => egg.motherId === COHORT_MOTHER_ID);
  const hatched = world.ants.filter((ant) => ant.alive && ant.motherId === COHORT_MOTHER_ID).length;
  return {
    survival: (grounded.length + hatched) / COHORT_SIZE,
    pickedUp: pickedUp.size,
    delivered: delivered.size,
    eggsPerished: world.eggsPerished,
    deliveryPositions,
    finalDepths: eggs.map((egg) => world.surfaceMap[egg.z * world.grid.sizeX + egg.x] - egg.y),
  };
}

describe("functional seeded brood ledger (Appendix D step 12)", () => {
  it(
    "keeps brood survival within one aggregate cohort member of the oracle",
    { timeout: 60_000 },
    () => {
      const carrierSamples = [12_100, 12_200, 12_300];
      const cases = carrierSamples.map((carrierSeedBase) => ({
        carrierSeedBase,
        oracle: runArm(9_950, carrierSeedBase, true),
        rnn: runArm(9_950, carrierSeedBase, false),
      }));
      const oracleSurvivors = cases.reduce(
        (sum, result) => sum + result.oracle.survival * COHORT_SIZE,
        0
      );
      const rnnSurvivors = cases.reduce(
        (sum, result) => sum + result.rnn.survival * COHORT_SIZE,
        0
      );
      const rnnPickups = cases.reduce((sum, result) => sum + result.rnn.pickedUp, 0);
      const rnnDeliveries = cases.reduce((sum, result) => sum + result.rnn.delivered, 0);
      const aggregateCohort = COHORT_SIZE * cases.length;
      mkdirSync("test-results", { recursive: true });
      writeFileSync(
        "test-results/functional-brood-ledger.txt",
        JSON.stringify({
          seed: 9_950,
          cohortPerCase: COHORT_SIZE,
          aggregateCohort,
          observationTicks: COLONY.incubationTicks,
          oracleSurvivors,
          rnnSurvivors,
          cases,
        }) + "\n"
      );

      expect(rnnPickups).toBe(aggregateCohort);
      expect(rnnDeliveries).toBe(aggregateCohort);
      expect(rnnSurvivors).toBeGreaterThanOrEqual(oracleSurvivors - 1);
    }
  );
});

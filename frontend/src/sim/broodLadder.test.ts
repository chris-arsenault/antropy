import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import {
  LADDER_STEP10B_CONFIG,
  LADDER_STEP10C_CONFIG,
  LADDER_STEP2_CONFIG,
  type SimConfig,
} from "./config";
import { Output, OUTPUT_COUNT } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { getVoxelSafe, voxelIndex } from "./grid";
import { Material } from "./materials";
import { makeBuilder, resetBuilderState } from "./oracles/builder";
import { makeBroodCarrier, placeQueenInNest } from "./oracles/brood";
import { COLONY } from "./tunables";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

const SITE = { x: 96, z: 96 } as const;
const DEPTH = 8;

function shaftDepth(world: World, surfaceY: number): number {
  let y = surfaceY;
  while (y > 1 && getVoxelSafe(world.grid, SITE.x, y - 1, SITE.z) === Material.AIR) {
    y -= 1;
  }
  return surfaceY - y;
}

/** Build the inherited step-2 shaft, then remove its oracle worker. */
function builtShaft(config: SimConfig): { world: World; surfaceY: number } {
  const world = createWorld(10_100, rnnController, config);
  world.foodBase = 0;
  world.foodTarget = 0;
  const surfaceY = surfaceSpawnY(world.grid, SITE.x, SITE.z) as number;
  const genome = rnnController.seed(world.rng);
  const ant = spawnAnt(world, {
    x: SITE.x,
    y: surfaceY,
    z: SITE.z,
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
  world.policyOverride = makeBuilder({ depth: DEPTH, column: SITE });
  for (let tick = 0; tick < 1000; tick++) {
    stepWorld(world);
    if (shaftDepth(world, surfaceY) >= DEPTH && ant.spoilLoads === 0) {
      break;
    }
  }
  expect(shaftDepth(world, surfaceY), "fixture shaft completed").toBe(DEPTH);
  world.ants = [];
  world.policyOverride = undefined;
  return { world, surfaceY };
}

describe("Appendix D brood ladder", () => {
  it("step 10a: a queen placed in the dug nest persists without reproduction", () => {
    const { world, surfaceY } = builtShaft(LADDER_STEP2_CONFIG);
    const before = world.grid.data.slice();
    const colony = placeQueenInNest(world, SITE.x, surfaceY - DEPTH, SITE.z);

    for (let tick = 0; tick < 100; tick++) {
      stepWorld(world);
    }

    expect(world.colonies).toEqual([colony]);
    expect(colony.queenAge).toBe(100);
    expect(world.eggsLaid).toBe(0);
    expect(world.grid.data.some((value, index) => value !== before[index])).toBe(false);
  });

  it("step 10b: reproduction alone lays and hatches an egg", () => {
    const { world, surfaceY } = builtShaft(LADDER_STEP10B_CONFIG);
    const colony = placeQueenInNest(world, SITE.x, surfaceY - DEPTH, SITE.z);
    colony.stockpile = 2.4;
    colony.lastEggTick = -COLONY.eggIntervalMin;

    stepWorld(world);
    expect(world.eggsLaid).toBe(1);
    expect(world.eggs).toHaveLength(1);
    const egg = world.eggs[0];
    colony.stockpile = COLONY.queenReserve;
    for (let tick = 0; tick <= COLONY.incubationTicks && world.eggs.includes(egg); tick++) {
      stepWorld(world);
    }

    expect(world.eggs).not.toContain(egg);
    expect(world.ants).toHaveLength(1);
    expect(world.eggsPerished).toBe(0);
  });

  it("keeps worker-laid eggs behind the reproduction gate", () => {
    const world = createWorld(10_101, rnnController, LADDER_STEP2_CONFIG);
    const surfaceY = surfaceSpawnY(world.grid, SITE.x, SITE.z) as number;
    const genome = rnnController.seed(world.rng);
    const ant = spawnAnt(world, {
      x: SITE.x,
      y: surfaceY,
      z: SITE.z,
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
    world.policyOverride = () => {
      const outputs = new Float32Array(OUTPUT_COUNT);
      outputs[Output.LAY_EGG] = 1;
      return outputs;
    };

    stepWorld(world);

    expect(ant.alive).toBe(true);
    expect(world.eggs).toHaveLength(0);
  });
});

describe("Appendix D brood transport ladder", () => {
  it("step 10c: the oracle carries an egg up a 1-wide shaft through shared DIG", () => {
    const { world, surfaceY } = builtShaft(LADDER_STEP10C_CONFIG);
    const nestY = surfaceY - DEPTH;
    const colony = placeQueenInNest(world, SITE.x, nestY, SITE.z);
    colony.stockpile = 2.4;
    colony.lastEggTick = -COLONY.eggIntervalMin;
    stepWorld(world);
    const egg = world.eggs[0];
    const laidAt = { x: egg.x, y: egg.y, z: egg.z };
    colony.stockpile = COLONY.queenReserve;

    // The inherited shaft is the transit fixture. No destination morphology
    // is authored; the O-layer policy puts the egg in open surface air.
    const genome = rnnController.seed(world.rng);
    const carrier = spawnAnt(world, {
      x: SITE.x,
      y: nestY + 1,
      z: SITE.z,
      heading: 0,
      energy: 1,
      lineageId: colony.id,
      patrilineId: 1,
      motherId: 0,
      fatherId: 1,
      genome,
      controllerState: rnnController.createState(),
      traits: rnnController.physical(genome),
    });
    const destination = { x: SITE.x + 2, y: surfaceY, z: SITE.z };
    world.policyOverride = makeBroodCarrier({
      destination,
      unloadedWaypoints: [],
      loadedWaypoints: [{ x: SITE.x, y: surfaceY, z: SITE.z }],
    });

    let pickedUp = false;
    let lowestCarriedY = Infinity;
    let highestCarriedY = -Infinity;
    for (let tick = 0; tick < 200; tick++) {
      stepWorld(world);
      pickedUp ||= egg.carrierId === carrier.id;
      if (egg.carrierId === carrier.id) {
        lowestCarriedY = Math.min(lowestCarriedY, carrier.y);
        highestCarriedY = Math.max(highestCarriedY, carrier.y);
      }
      if (pickedUp && egg.carrierId === null) {
        break;
      }
    }

    expect(pickedUp).toBe(true);
    expect(egg.carrierId).toBeNull();
    expect([egg.x, egg.y, egg.z]).not.toEqual([laidAt.x, laidAt.y, laidAt.z]);
    expect([egg.x, egg.y, egg.z]).toEqual([destination.x, destination.y, destination.z]);
    expect(lowestCarriedY).toBeLessThanOrEqual(nestY + 1);
    expect(highestCarriedY).toBe(surfaceY);
    for (let y = nestY + 1; y < surfaceY; y++) {
      expect(world.cavities.has(voxelIndex(world.grid, SITE.x, y, SITE.z))).toBe(true);
    }
    expect(carrier.carriedEggIds).toEqual([]);
  });
});

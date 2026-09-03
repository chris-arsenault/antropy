import { afterEach, describe, expect, it } from "vitest";
import { surfaceSpawnY, type Ant } from "./ant";
import { buildAntIndex } from "./antIndex";
import { eggCarryCapacity, tryDig } from "./actions";
import { FULL_CONFIG, LADDER_STEP10B_CONFIG, LADDER_STEP10C_CONFIG, PHASE2_CONFIG } from "./config";
import { Input } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { addEgg, stepEggs, syncCarriedEggs, type Egg } from "./eggs";
import { killAnt } from "./energy";
import { voxelIndex } from "./grid";
import { Material } from "./materials";
import { createInputBuffer, sense } from "./senses";
import { BROOD_TRANSPORT } from "./tunables";
import { createWorld, mutateVoxel, spawnAnt, type World } from "./world";

const DEFAULT_CAPACITY = 1;

afterEach(() => {
  BROOD_TRANSPORT.eggCapacity = DEFAULT_CAPACITY;
});

function spawnCarrier(world: World): Ant {
  const x = 96;
  const z = 96;
  const y = surfaceSpawnY(world.grid, x, z) as number;
  const genome = rnnController.seed(world.rng);
  for (const dx of [-1, 1]) {
    mutateVoxel(world, x + dx, y, z, Material.AIR);
  }
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

function groundEgg(world: World, x: number, y: number, z: number): Egg {
  const egg: Egg = {
    id: world.nextEggId++,
    x,
    y,
    z,
    carrierId: null,
    genome: rnnController.seed(world.rng),
    energy: 0.2,
    incubationRemaining: 100,
    stage: 0,
    fedProgress: 0,
    hungerTicks: 0,
    sex: 0,
    queenDestined: 0,
    lineageId: 0,
    patrilineId: 0,
    motherId: 0,
    fatherId: 0,
  };
  addEgg(world, egg);
  return egg;
}

function carryLoad(world: World, ant: Ant): number {
  const inputs = sense(
    {
      grid: world.grid,
      pheromoneA: world.pheromoneA,
      pheromoneB: world.pheromoneB,
      foodScent: world.foodScent,
      nestScent: world.nestScent,
      colonies: world.colonies,
      antIndex: buildAntIndex(world.grid, world.ants),
      eggIndex: world.eggIndex,
      climate: () => 1,
    },
    ant,
    createInputBuffer()
  );
  return inputs[Input.CARRY_LOAD];
}

describe("live brood transport", () => {
  it("is a separate gate admitted at ladder step 10c", () => {
    expect(PHASE2_CONFIG.broodTransport).toBe(false);
    expect(LADDER_STEP10B_CONFIG.broodTransport).toBe(false);
    expect(LADDER_STEP10C_CONFIG.broodTransport).toBe(true);
    expect(FULL_CONFIG.broodTransport).toBe(true);

    const world = createWorld(10_201, rnnController, LADDER_STEP10B_CONFIG);
    const ant = spawnCarrier(world);
    const egg = groundEgg(world, ant.x + 1, ant.y, ant.z);
    tryDig(world, ant, 0);

    expect(ant.carriedEggIds).toEqual([]);
    expect(egg.carrierId).toBeNull();
    expect(world.eggIndex.get(voxelIndex(world.grid, egg.x, egg.y, egg.z))).toBe(egg);
  });

  it("uses the tunable capacity and reports egg load through CARRY_LOAD", () => {
    const world = createWorld(10_202, rnnController, LADDER_STEP10C_CONFIG);
    const ant = spawnCarrier(world);
    const east = groundEgg(world, ant.x + 1, ant.y, ant.z);
    const west = groundEgg(world, ant.x - 1, ant.y, ant.z);

    expect(eggCarryCapacity()).toBe(1);
    tryDig(world, ant, 0);
    ant.heading = Math.PI;
    tryDig(world, ant, 0);
    expect(ant.carriedEggIds).toEqual([east.id]);
    expect(west.carrierId).toBeNull();

    BROOD_TRANSPORT.eggCapacity = 2;
    tryDig(world, ant, 0);
    expect(ant.carriedEggIds).toEqual([east.id, west.id]);
    expect(west.carrierId).toBe(ant.id);
    expect(carryLoad(world, ant)).toBe(1);
  });
});

describe("live brood transport lifecycle", () => {
  it("uses DIG to place brood into a legal AIR target", () => {
    const world = createWorld(10_203, rnnController, LADDER_STEP10C_CONFIG);
    const ant = spawnCarrier(world);
    const egg = groundEgg(world, ant.x + 1, ant.y, ant.z);
    tryDig(world, ant, 0);

    ant.x += 4;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.AIR);
    syncCarriedEggs(world);
    tryDig(world, ant, 0);

    expect(ant.carriedEggIds).toEqual([]);
    expect(egg.carrierId).toBeNull();
    expect([egg.x, egg.y, egg.z]).toEqual([ant.x + 1, ant.y, ant.z]);
    expect(world.eggIndex.get(voxelIndex(world.grid, egg.x, egg.y, egg.z))).toBe(egg);
  });

  it("keeps carried brood live at the carrier position", () => {
    const world = createWorld(10_204, rnnController, LADDER_STEP10C_CONFIG);
    const ant = spawnCarrier(world);
    const egg = groundEgg(world, ant.x + 1, ant.y, ant.z);
    tryDig(world, ant, 0);
    const before = egg.incubationRemaining;

    ant.x += 3;
    syncCarriedEggs(world);
    stepEggs(world);

    expect([egg.x, egg.y, egg.z]).toEqual([ant.x, ant.y, ant.z]);
    expect(egg.incubationRemaining).toBe(before - 1);
    expect(world.eggs).toContain(egg);
  });

  it("releases carried brood on carrier death", () => {
    const world = createWorld(10_205, rnnController, LADDER_STEP10C_CONFIG);
    const ant = spawnCarrier(world);
    const egg = groundEgg(world, ant.x + 1, ant.y, ant.z);
    tryDig(world, ant, 0);

    killAnt(world, ant);
    expect(ant.carriedEggIds).toEqual([]);
    expect(egg.carrierId).toBeNull();
    expect(world.eggIndex.get(voxelIndex(world.grid, egg.x, egg.y, egg.z))).toBe(egg);
  });
});

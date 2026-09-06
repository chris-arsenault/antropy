import { describe, expect, it } from "vitest";
import { type Ant } from "./ant";
import { buildAntIndex } from "./antIndex";
import { braitenbergController } from "./controller/braitenberg";
import { Input } from "./controller/contract";
import { voxelIndex } from "./grid";
import { setMaterialScent } from "./materialScent";
import { Material } from "./materials";
import { depositScent, scentResponse } from "./scent";
import { createInputBuffer, sense, type SenseContext } from "./senses";
import { ENERGY } from "./tunables";
import { createWorld, mutateVoxel, populateForagers, type World } from "./world";

function contextFor(world: World, climate: SenseContext["climate"] = () => 1): SenseContext {
  return {
    grid: world.grid,
    surfaceMap: world.surfaceMap,
    pheromoneA: world.pheromoneA,
    pheromoneB: world.pheromoneB,
    foodScent: world.foodScent,
    nestScent: world.nestScent,
    colonyScent: world.colonyScent,
    materialColonyScent: world.materialColonyScent,
    config: world.config,
    colonies: world.colonies,
    antIndex: buildAntIndex(world.grid, world.ants),
    eggIndex: world.eggIndex,
    climate,
  };
}

function configureLoopbackAnt(world: World): Ant {
  populateForagers(world, 1);
  const ant = world.ants[0];
  ant.heading = 0;
  ant.age = 5000;
  ant.carryLoad = 0.5;
  ant.carrying = Material.CLAY;
  ant.bodyScale = 0.8;
  ant.falling = true;
  ant.traits = { ...ant.traits, sensorGain: 2, storage: 1.5 };
  ant.energy = 0.5 * ENERGY.max * ant.traits.storage;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        mutateVoxel(world, ant.x + dx, ant.y + dy, ant.z + dz, Material.AIR);
      }
    }
  }
  const solids = [
    [1, 0, 0, Material.FOOD],
    [-1, -1, 0, Material.TOPSOIL],
    [0, -1, 1, Material.CLAY],
    [0, 1, 0, Material.ROCK],
    [-1, 0, -1, Material.LOOSE_FILL],
  ] as const;
  for (const [dx, dy, dz, material] of solids) {
    mutateVoxel(world, ant.x + dx, ant.y + dy, ant.z + dz, material);
  }
  world.eggIndex.set(voxelIndex(world.grid, ant.x + 1, ant.y - 1, ant.z), {} as never);
  world.ants.push(
    { ...ant, id: 2, x: ant.x - 1 },
    { ...ant, id: 3, z: ant.z + 1 },
    { ...ant, id: 4, z: ant.z - 1 }
  );
  return ant;
}

function seedLoopbackScents(world: World, ant: Ant): void {
  const left = voxelIndex(world.grid, ant.x + 1, ant.y, ant.z + 1);
  const right = voxelIndex(world.grid, ant.x + 1, ant.y, ant.z - 1);
  depositScent(world.pheromoneA, left, 0.05, ant.lineageId);
  depositScent(world.pheromoneA, right, 0.1, ant.lineageId);
  depositScent(world.pheromoneB, left, 0.15, ant.lineageId);
  depositScent(world.pheromoneB, right, 0.2, ant.lineageId);
  depositScent(world.foodScent, left, 0.25, 0);
  depositScent(world.foodScent, right, 0.3, 0);
  depositScent(world.nestScent, left, 0.35, ant.lineageId);
  depositScent(world.nestScent, right, 0.4, ant.lineageId);
  const down = voxelIndex(world.grid, ant.x, ant.y - 1, ant.z);
  const up = voxelIndex(world.grid, ant.x, ant.y + 1, ant.z);
  const center = voxelIndex(world.grid, ant.x, ant.y, ant.z);
  const downLeft = voxelIndex(world.grid, ant.x + 1, ant.y - 1, ant.z + 1);
  const downRight = voxelIndex(world.grid, ant.x + 1, ant.y - 1, ant.z - 1);
  const upLeft = voxelIndex(world.grid, ant.x + 1, ant.y + 1, ant.z + 1);
  const upRight = voxelIndex(world.grid, ant.x + 1, ant.y + 1, ant.z - 1);
  depositScent(world.pheromoneA, down, 0.5, ant.lineageId);
  depositScent(world.pheromoneA, up, 0.625, ant.lineageId);
  depositScent(world.pheromoneB, down, 0.75, ant.lineageId);
  depositScent(world.pheromoneB, up, 0.875, ant.lineageId);
  depositScent(world.foodScent, down, 1, 0);
  depositScent(world.foodScent, up, 1.25, 0);
  depositScent(world.nestScent, down, 1.5, ant.lineageId);
  depositScent(world.nestScent, up, 1.75, ant.lineageId);
  depositScent(world.colonyScent, left, 0.875, ant.lineageId);
  depositScent(world.colonyScent, right, 1, ant.lineageId);
  depositScent(world.colonyScent, down, 2, ant.lineageId);
  depositScent(world.colonyScent, up, 2.5, ant.lineageId);
  depositScent(world.pheromoneA, center, 3, ant.lineageId);
  depositScent(world.pheromoneB, center, 4, ant.lineageId);
  depositScent(world.foodScent, center, 5, 0);
  depositScent(world.nestScent, center, 6, ant.lineageId);
  depositScent(world.colonyScent, center, 7, ant.lineageId);
  const verticalStereo = [downLeft, downRight, upLeft, upRight] as const;
  const fields = [
    [world.pheromoneA, ant.lineageId, 0.11],
    [world.pheromoneB, ant.lineageId, 0.21],
    [world.foodScent, 0, 0.31],
    [world.nestScent, ant.lineageId, 0.41],
    [world.colonyScent, ant.lineageId, 0.51],
  ] as const;
  for (const [field, owner, base] of fields) {
    for (let index = 0; index < verticalStereo.length; index++) {
      depositScent(field, verticalStereo[index], base + index * 0.01, owner);
    }
  }
}

const LOOPBACK_EXPECTED = Float32Array.from([
  scentResponse(0.05, 2),
  scentResponse(0.1, 2),
  scentResponse(0.15, 2),
  scentResponse(0.2, 2),
  scentResponse(0.25, 2),
  scentResponse(0.3, 2),
  0.5,
  0.25,
  0.5,
  0.25,
  0.4,
  0,
  1,
  5 / 26,
  3 / 8,
  1,
  1,
  1,
  1,
  1,
  scentResponse(0.35, 2),
  scentResponse(0.4, 2),
  0.5,
  scentResponse(0.5, 2),
  scentResponse(0.625, 2),
  scentResponse(0.75, 2),
  scentResponse(0.875, 2),
  scentResponse(1, 2),
  scentResponse(1.25, 2),
  scentResponse(1.5, 2),
  scentResponse(1.75, 2),
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  scentResponse(0.875, 2),
  scentResponse(1, 2),
  scentResponse(2, 2),
  scentResponse(2.5, 2),
  0,
  0,
  0,
  0,
  scentResponse(3, 2),
  0,
  scentResponse(4, 2),
  0,
  scentResponse(5, 2),
  0,
  scentResponse(6, 2),
  0,
  scentResponse(7, 2),
  0,
  scentResponse(0.11, 2),
  scentResponse(0.12, 2),
  scentResponse(0.13, 2),
  scentResponse(0.14, 2),
  0,
  0,
  0,
  0,
  scentResponse(0.21, 2),
  scentResponse(0.22, 2),
  scentResponse(0.23, 2),
  scentResponse(0.24, 2),
  0,
  0,
  0,
  0,
  scentResponse(0.31, 2),
  scentResponse(0.32, 2),
  scentResponse(0.33, 2),
  scentResponse(0.34, 2),
  0,
  0,
  0,
  0,
  scentResponse(0.41, 2),
  scentResponse(0.42, 2),
  scentResponse(0.43, 2),
  scentResponse(0.44, 2),
  0,
  0,
  0,
  0,
  scentResponse(0.51, 2),
  scentResponse(0.52, 2),
  scentResponse(0.53, 2),
  scentResponse(0.54, 2),
  0,
  0,
  0,
  0,
  ...new Array(6).fill(0),
  1,
  ...new Array(8).fill(0),
]);

function expectedLoopbackInputs(world: World, ant: Ant): Float32Array {
  const expected = Float32Array.from(LOOPBACK_EXPECTED);
  expected[Input.DEPTH] = Math.max(
    0,
    (world.surfaceMap[ant.z * world.grid.sizeX + ant.x] - ant.y) / world.grid.sizeY
  );
  return expected;
}

describe("sense", () => {
  it("reads a stereo food-scent difference across the antennae", () => {
    const world = createWorld(71, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0; // facing +x; left antenna samples forward-left

    depositScent(world.foodScent, voxelIndex(world.grid, ant.x + 1, ant.y, ant.z + 1), 0.8);
    const inputs = sense(contextFor(world), ant, createInputBuffer());

    expect(inputs[Input.FOOD_SCENT_LEFT]).toBeGreaterThan(inputs[Input.FOOD_SCENT_RIGHT]);
  });
});

describe("vertical sensing", () => {
  it.each([
    ["below", Input.FOOD_SCENT_DOWN, -1],
    ["above", Input.FOOD_SCENT_UP, 1],
  ])("reports the %s band without attention switching", (_, channel, dy) => {
    const world = createWorld(710 + dy, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0;
    ant.traits = { ...ant.traits, sensorGain: 1 };
    const sampled = voxelIndex(world.grid, ant.x, ant.y + dy, ant.z);
    const wrongBand = voxelIndex(world.grid, ant.x, ant.y - dy, ant.z);
    depositScent(world.foodScent, sampled, 0.4);
    depositScent(world.foodScent, wrongBand, 0.9);

    const inputs = sense(contextFor(world), ant, createInputBuffer());

    expect(inputs[channel]).toBeCloseTo(scentResponse(0.4, 1));
    expect(inputs[dy < 0 ? Input.FOOD_SCENT_UP : Input.FOOD_SCENT_DOWN]).toBeCloseTo(
      scentResponse(0.9, 1)
    );
  });

  it("reports level, down, and up food scent in the same frame", () => {
    const world = createWorld(719, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0;
    ant.traits = { ...ant.traits, sensorGain: 1 };
    depositScent(world.foodScent, voxelIndex(world.grid, ant.x + 1, ant.y, ant.z + 1), 0.3);
    depositScent(world.foodScent, voxelIndex(world.grid, ant.x, ant.y - 1, ant.z), 0.4);
    depositScent(world.foodScent, voxelIndex(world.grid, ant.x, ant.y + 1, ant.z), 0.5);

    const inputs = sense(contextFor(world), ant, createInputBuffer());

    expect(inputs[Input.FOOD_SCENT_LEFT]).toBeCloseTo(scentResponse(0.3, 1));
    expect(inputs[Input.FOOD_SCENT_DOWN]).toBeCloseTo(scentResponse(0.4, 1));
    expect(inputs[Input.FOOD_SCENT_UP]).toBeCloseTo(scentResponse(0.5, 1));
  });

  it("keeps stereo direction in the non-level bands", () => {
    const world = createWorld(718, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0;
    ant.traits = { ...ant.traits, sensorGain: 1 };
    depositScent(world.foodScent, voxelIndex(world.grid, ant.x + 1, ant.y + 1, ant.z + 1), 0.6);

    const inputs = sense(contextFor(world), ant, createInputBuffer());

    expect(inputs[Input.FOOD_SCENT_UP_LEFT]).toBeCloseTo(scentResponse(0.6, 1));
    expect(inputs[Input.FOOD_SCENT_UP_RIGHT]).toBe(0);
  });

  it.each([
    ["below", -0.8, 0, -1],
    ["level", 0, 1, 0],
    ["above", 0.8, 1, 1],
  ])("reports contact only in the %s mandible band", (_, bias, dx, dy) => {
    const world = createWorld(720 + dy, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0;
    ant.verticalAttention = bias;
    mutateVoxel(world, ant.x + dx, ant.y + dy, ant.z, Material.FOOD);
    mutateVoxel(world, ant.x - 1, ant.y, ant.z, Material.FOOD);

    const inputs = sense(contextFor(world), ant, createInputBuffer());

    expect(inputs[Input.CONTACT_FOOD]).toBe(1);
  });
});

describe("sense state", () => {
  it("samples food identity and transferred colony odor in a vertical band", () => {
    const world = createWorld(69, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.traits = { ...ant.traits, sensorGain: 1 };
    const food = voxelIndex(world.grid, ant.x, ant.y + 1, ant.z);
    mutateVoxel(world, ant.x, ant.y + 1, ant.z, Material.FOOD);

    const wild = sense(contextFor(world), ant, createInputBuffer());
    expect(wild[Input.FOOD_SCENT_UP]).toBe(1);
    expect(wild[Input.COLONY_SCENT_UP]).toBe(0);

    setMaterialScent(world.materialColonyScent, food, 0.75, ant.lineageId);
    ant.verticalAttention = 1;
    const handled = sense(contextFor(world), ant, createInputBuffer());
    expect(handled[Input.COLONY_SCENT_UP]).toBeCloseTo(scentResponse(0.75, 1));
    expect(handled[Input.CONTACT_FOOD]).toBe(1);
  });

  it("reports signed scent change after the baseline frame", () => {
    const world = createWorld(70, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0;
    ant.traits = { ...ant.traits, sensorGain: 1 };
    const sample = voxelIndex(world.grid, ant.x + 1, ant.y, ant.z + 1);
    const inputs = createInputBuffer();
    sense(contextFor(world), ant, inputs);
    ant.lastInputs.set(inputs);
    depositScent(world.foodScent, sample, 0.5);

    sense(contextFor(world), ant, inputs);

    expect(inputs[Input.FOOD_SCENT_LEFT_CHANGE]).toBeGreaterThan(0);
    expect(inputs[Input.FOOD_SCENT_RIGHT_CHANGE]).toBe(0);
  });

  it("flags food contact and reports internal state", () => {
    const world = createWorld(72, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0;
    ant.energy = 0.5 * ENERGY.max * ant.traits.storage;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.FOOD);

    const inputs = sense(contextFor(world), ant, createInputBuffer());
    expect(inputs[Input.CONTACT_FOOD]).toBe(1);
    expect(inputs[Input.ENERGY]).toBeCloseTo(0.5);
    expect(inputs[Input.BIAS]).toBe(1);
    expect(inputs[Input.CONTACT_ANT]).toBe(0);
  });

  it("reports crowding when another ant is adjacent", () => {
    const world = createWorld(73, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    populateForagers(world, 0);
    // Place a second ant next to the first.
    const neighbor = { ...ant, id: ant.id + 1, x: ant.x + 1 };
    world.ants.push(neighbor);

    const inputs = sense(contextFor(world), ant, createInputBuffer());
    expect(inputs[Input.CONTACT_ANT]).toBe(1);
    expect(inputs[Input.CROWDING]).toBeGreaterThan(0);
  });

  it("marshals every input index and normalization in a known world", () => {
    const world = createWorld(74, braitenbergController);
    const ant = configureLoopbackAnt(world);
    seedLoopbackScents(world, ant);

    const inputs = sense(
      contextFor(world, () => 5.5),
      ant,
      createInputBuffer()
    );

    const expected = expectedLoopbackInputs(world, ant);
    expect(inputs).toHaveLength(expected.length);
    for (let index = 0; index < inputs.length; index++) {
      expect(inputs[index], `input ${index}`).toBeCloseTo(expected[index], 6);
    }
  });
});

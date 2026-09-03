import { describe, expect, it } from "vitest";
import { type Ant } from "./ant";
import { buildAntIndex } from "./antIndex";
import { braitenbergController } from "./controller/braitenberg";
import { Input } from "./controller/contract";
import { voxelIndex } from "./grid";
import { Material } from "./materials";
import { depositScent } from "./scent";
import { createInputBuffer, sense, type SenseContext } from "./senses";
import { createWorld, mutateVoxel, populateForagers, type World } from "./world";

function contextFor(world: World, climate: SenseContext["climate"] = () => 1): SenseContext {
  return {
    grid: world.grid,
    pheromoneA: world.pheromoneA,
    pheromoneB: world.pheromoneB,
    foodScent: world.foodScent,
    nestScent: world.nestScent,
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
  ant.energy = 0.75;
  ant.age = 5000;
  ant.carryLoad = 0.5;
  ant.carrying = Material.CLAY;
  ant.bodyScale = 0.8;
  ant.falling = true;
  ant.traits = { ...ant.traits, sensorGain: 2, storage: 1.5 };

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
  world.eggIndex.set(voxelIndex(world.grid, ant.x, ant.y - 1, ant.z), {} as never);
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
}

function expectedLoopbackInputs(world: World, ant: Ant): Float32Array {
  return Float32Array.from([
    0.1,
    0.2,
    0.3,
    0.4,
    0.5,
    0.6,
    0.5,
    0.25,
    0.5,
    0.25,
    0.4,
    1 - ant.y / world.grid.sizeY,
    1,
    5 / 26,
    3 / 8,
    1,
    1,
    1,
    1,
    1,
    0.7,
    0.8,
    0.5,
  ]);
}

describe("sense", () => {
  it("reads a stereo food-scent difference across the antennae", () => {
    const world = createWorld(71, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0; // facing +x; left antenna samples +z side

    depositScent(world.foodScent, voxelIndex(world.grid, ant.x + 1, ant.y, ant.z + 1), 0.8);
    const inputs = sense(contextFor(world), ant, createInputBuffer());

    expect(inputs[Input.FOOD_SCENT_LEFT]).toBeGreaterThan(inputs[Input.FOOD_SCENT_RIGHT]);
  });

  it("flags food contact and reports internal state", () => {
    const world = createWorld(72, braitenbergController);
    populateForagers(world, 1);
    const ant = world.ants[0];
    ant.heading = 0;
    ant.energy = 0.5;
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

    expect(inputs).toEqual(expectedLoopbackInputs(world, ant));
  });
});

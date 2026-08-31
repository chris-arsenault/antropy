import { describe, expect, it } from "vitest";
import { buildAntIndex } from "./antIndex";
import { braitenbergController } from "./controller/braitenberg";
import { Input } from "./controller/contract";
import { voxelIndex } from "./grid";
import { Material } from "./materials";
import { depositScent } from "./scent";
import { createInputBuffer, sense, type SenseContext } from "./senses";
import { createWorld, mutateVoxel, populateForagers, type World } from "./world";

function contextFor(world: World): SenseContext {
  return {
    grid: world.grid,
    pheromoneA: world.pheromoneA,
    pheromoneB: world.pheromoneB,
    foodScent: world.foodScent,
    antIndex: buildAntIndex(world.grid, world.ants),
    eggIndex: world.eggIndex,
  };
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
});

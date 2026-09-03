import { describe, expect, it } from "vitest";
import { LADDER_STEP12_CONFIG, PROGRAMMED_COLONY_CONFIG } from "../sim/config";
import { voxelIndex } from "../sim/grid";
import { sampleScent } from "../sim/scent";
import { stepWorld } from "../sim/world";
import { scenarioById } from "./scenarios";

describe("programmed colony scenario", () => {
  it("starts a fixed review colony with construction and lifecycle changes disabled", () => {
    const world = scenarioById("programmed").build(1);
    const cavityCount = world.cavities.size;

    expect(world.config).toEqual(PROGRAMMED_COLONY_CONFIG);
    expect(world.config.terrainDigging).toBe(false);
    expect(world.config.reproduction).toBe(false);
    expect(world.config.mortality).toBe(false);
    expect(world.config.autoContinue).toBe(false);
    expect(world.colonies).toHaveLength(1);
    expect(world.ants).toHaveLength(40);
    expect(
      world.ants.every((ant) => ant.y <= world.surfaceMap[ant.z * world.grid.sizeX + ant.x])
    ).toBe(true);

    for (let tick = 0; tick < 100; tick++) {
      stepWorld(world);
    }
    expect(world.cavities.size).toBe(cavityCount);
    expect(world.colonies).toHaveLength(1);
    expect(world.ants).toHaveLength(40);
  });
});

describe("Appendix D ladder scenario", () => {
  it("keeps the certified mechanism diagnostic available", () => {
    const world = scenarioById("functional").build(1);
    const colony = world.colonies[0];
    const mouthY = world.surfaceMap[colony.z * world.grid.sizeX + colony.x] + 1;
    const mouth = voxelIndex(world.grid, colony.x, mouthY, colony.z);

    expect(world.config).toEqual(LADDER_STEP12_CONFIG);
    expect(world.controller.id).toBe("rnn");
    expect(world.colonies).toHaveLength(1);
    expect(world.ants.length).toBeGreaterThan(0);
    expect(sampleScent(world.pheromoneA, mouth, colony.id)).toBeGreaterThan(0);

    stepWorld(world);
    expect(world.tick).toBe(1);
  });
});

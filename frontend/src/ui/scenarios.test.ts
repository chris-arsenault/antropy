import { describe, expect, it } from "vitest";
import {
  LADDER_STEP12_CONFIG,
  PROGRAMMED_COLONY_CONFIG,
  VARIATION_NEST_CONFIG,
} from "../sim/config";
import { derivedColonySeedVector, rnnController } from "../sim/controller/rnn";
import { maxEnergy } from "../sim/energy";
import { voxelIndex } from "../sim/grid";
import { authorProgrammedNest } from "../sim/programmedNest";
import { colonyLoopOracle } from "../sim/oracles/colonyLoop";
import { sampleScent } from "../sim/scent";
import { createWorld, stepWorld } from "../sim/world";
import { scenarioById } from "./scenarios";

describe("programmed colony scenario", () => {
  it("exposes the sensor-limited programmed policy in the fixed review world", () => {
    const world = scenarioById("programmed").build(1);
    const authored = createWorld(1, rnnController, PROGRAMMED_COLONY_CONFIG);
    authorProgrammedNest(authored);
    const cavityCount = world.cavities.size;

    expect(world.config).toEqual(PROGRAMMED_COLONY_CONFIG);
    expect(world.config.terrainDigging).toBe(false);
    expect(world.config.workerReproduction).toBe(false);
    expect(world.config.colonyFounding).toBe(false);
    expect(world.config.geneticVariation).toBe(false);
    expect(world.config.mortality).toBe(false);
    expect(world.config.autoContinue).toBe(false);
    expect(world.config.authoredNestTrail).toBe(true);
    expect(world.pheromoneA.activeCount).toBeGreaterThan(0);
    expect(world.sensorPolicyOverride).toBe(colonyLoopOracle);
    expect(world.colonies).toHaveLength(1);
    expect(world.ants).toHaveLength(40);
    expect(Buffer.from(world.grid.data).equals(Buffer.from(authored.grid.data))).toBe(true);
    expect(world.cavities).toEqual(authored.cavities);
    const founderGenome = world.controller.serializeGenome(world.ants[0].genome);
    const colonySeed = derivedColonySeedVector();
    expect(founderGenome.slice(0, colonySeed.length)).toEqual(colonySeed);
    expect(founderGenome.slice(colonySeed.length)).toEqual(colonySeed);
    expect(
      world.ants.every((ant) =>
        Buffer.from(world.controller.serializeGenome(ant.genome)).equals(Buffer.from(founderGenome))
      )
    ).toBe(true);
    expect(
      world.ants.every((ant) => ant.y <= world.surfaceMap[ant.z * world.grid.sizeX + ant.x])
    ).toBe(true);
    expect(world.ants.every((ant) => ant.energy === maxEnergy(ant))).toBe(true);

    for (let tick = 0; tick < 100; tick++) {
      stepWorld(world);
    }
    expect(world.cavities.size).toBe(cavityCount);
    expect(world.colonies).toHaveLength(1);
    expect(world.ants).toHaveLength(40);
  });

  it("exposes the trained RNN as a separate scenario in the same world", () => {
    const rnn = scenarioById("rnn").build(1);

    expect(rnn.config).toEqual(PROGRAMMED_COLONY_CONFIG);
    expect(rnn.sensorPolicyOverride).toBeNull();
    expect(rnn.controller.id).toBe("rnn");
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

describe("standing-variation colony scenario", () => {
  it("changes the replacement world only by admitting genetic variation", () => {
    const world = scenarioById("variation").build(2);
    const distances = world.ants
      .slice(1)
      .map((ant) => world.controller.genomeDistance(world.ants[0].genome, ant.genome));

    expect(world.config).toEqual(VARIATION_NEST_CONFIG);
    expect(world.config.colonyFounding).toBe(false);
    expect(world.config.autoContinue).toBe(false);
    expect(world.ants).toHaveLength(40);
    expect(distances.some((distance) => distance > 0)).toBe(true);
    expect(world.founderGenomes).toHaveLength(7);
  });
});

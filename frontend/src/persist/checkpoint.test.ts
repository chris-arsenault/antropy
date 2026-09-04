import { describe, expect, it } from "vitest";
import { foundColony } from "../sim/colony";
import { NEST_CONFIG } from "../sim/config";
import { rnnController } from "../sim/controller/rnn";
import { carryEgg, addEgg, STAGE_EGG, type Egg } from "../sim/eggs";
import { createWorld, stepWorld } from "../sim/world";
import { sampleMaterialScent, setMaterialScent } from "../sim/materialScent";
import { deserializeWorld, serializeWorld } from "./checkpoint";
import { checkpointFromJson, checkpointToJson } from "./file";

describe("checkpoint codec", () => {
  it("round-trips through the JSON file codec", { timeout: 30_000 }, () => {
    const world = createWorld(8002);
    foundColony(world);
    for (let t = 0; t < 100; t++) {
      stepWorld(world);
    }
    const checkpoint = serializeWorld(world);
    const decoded = checkpointFromJson(checkpointToJson(checkpoint));

    expect(decoded.version).toBe(checkpoint.version);
    expect(decoded.tick).toBe(checkpoint.tick);
    expect(Buffer.from(decoded.grid).equals(Buffer.from(checkpoint.grid))).toBe(true);
    expect(Array.from(decoded.ants[0].genome)).toEqual(Array.from(checkpoint.ants[0].genome));

    const restored = deserializeWorld(decoded);
    expect(restored.tick).toBe(world.tick);
    expect(restored.ants.length).toBe(world.ants.length);
  });

  it("refuses unknown versions and controllers", () => {
    const world = createWorld(8003);
    const checkpoint = serializeWorld(world);
    expect(() => deserializeWorld({ ...checkpoint, version: 99 })).toThrow(/version/);
    expect(() => deserializeWorld({ ...checkpoint, controllerId: "nope" })).toThrow(/controller/);
  });

  it("round-trips Appendix E gates and cargo capacities", () => {
    const config = { ...NEST_CONFIG, broodCapacity: 3, spoilCapacity: 5 };
    const world = createWorld(8005, rnnController, config);
    const restored = deserializeWorld(serializeWorld(world));

    expect(restored.config).toEqual(config);
  });

  it("preserves the vertical attention latch", () => {
    const world = createWorld(8006, rnnController, NEST_CONFIG);
    foundColony(world);
    world.ants[0].verticalAttention = -0.75;

    const restored = deserializeWorld(serializeWorld(world));

    expect(restored.ants[0].verticalAttention).toBe(-0.75);
  });

  it("preserves colony odor absorbed by material", () => {
    const world = createWorld(8007, rnnController, NEST_CONFIG);
    const index = 10;
    setMaterialScent(world.materialColonyScent, index, 0.4, 3);

    const restored = deserializeWorld(serializeWorld(world));

    expect(sampleMaterialScent(restored.materialColonyScent, index, 3)).toBeCloseTo(0.4);
  });
});

describe("checkpoint relationship restoration", () => {
  it("preserves both sides of a live brood carrier link", () => {
    const world = createWorld(8004);
    foundColony(world);
    const ant = world.ants[0];
    const egg: Egg = {
      id: world.nextEggId++,
      x: ant.x,
      y: ant.y,
      z: ant.z,
      carrierId: null,
      genome: ant.genome,
      energy: 0.2,
      incubationRemaining: 100,
      stage: STAGE_EGG,
      fedProgress: 0,
      hungerTicks: 0,
      sex: 0,
      queenDestined: 0,
      lineageId: ant.lineageId,
      patrilineId: ant.patrilineId,
      motherId: 0,
      fatherId: 0,
    };
    addEgg(world, egg);
    expect(carryEgg(world, ant, egg)).toBe(true);

    const restored = deserializeWorld(serializeWorld(world));
    const restoredAnt = restored.ants.find((candidate) => candidate.id === ant.id);
    const restoredEgg = restored.eggs.find((candidate) => candidate.id === egg.id);

    expect(restored.config.broodTransport).toBe(true);
    expect(restored.config.motorJitter).toBe(true);
    expect(restored.config.terrainDigging).toBe(true);
    expect(restoredAnt?.carriedEggIds).toEqual([egg.id]);
    expect(restoredEgg?.carrierId).toBe(ant.id);
    expect(restored.eggIndex.size).toBe(0);
  });
});

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

  it("preserves unrecovered corpse-food provenance", () => {
    const world = createWorld(8008, rnnController, NEST_CONFIG);
    world.recycledFood.add(1234);

    const restored = deserializeWorld(serializeWorld(world));

    expect(restored.recycledFood).toEqual(new Set([1234]));
  });
});

describe("checkpoint simulation fields", () => {
  it("preserves uncredited external food through caches and carriage", () => {
    const world = createWorld(8010, rnnController, NEST_CONFIG);
    const colony = foundColony(world);
    const ant = world.ants[0];
    ant.uncreditedFoodLoads = 2;
    ant.netEnergyDelivered = 2.4;
    world.uncreditedExternalFood.add(4321);
    colony.patrilineMerit.set(ant.patrilineId, 2.4);

    const restored = deserializeWorld(serializeWorld(world));

    expect(restored.uncreditedExternalFood).toEqual(new Set([4321]));
    expect(restored.ants[0].uncreditedFoodLoads).toBe(2);
    expect(restored.ants[0].netEnergyDelivered).toBe(2.4);
    expect(restored.colonies[0].patrilineMerit.get(ant.patrilineId)).toBe(2.4);
    expect(restored.nextGeneticId).toBe(world.nextGeneticId);
    expect(restored.colonies[0].queenGeneticId).toBe(colony.queenGeneticId);
    expect(restored.geneticRecords).toEqual(world.geneticRecords);
    expect(restored.founderGenomes).toHaveLength(world.founderGenomes.length);
    expect(
      restored.controller.genomeDistance(restored.founderGenomes[0], world.founderGenomes[0])
    ).toBe(0);
  });

  it("preserves replacement energy attribution", () => {
    const world = createWorld(8009, rnnController, NEST_CONFIG);
    world.metrics.eggEnergyInvested = 0.3;
    world.metrics.larvalEnergyInvested = 0.6;
    world.metrics.metamorphosisEnergyBurned = 0.6;

    const restored = deserializeWorld(serializeWorld(world));

    expect(restored.metrics.eggEnergyInvested).toBe(0.3);
    expect(restored.metrics.larvalEnergyInvested).toBe(0.6);
    expect(restored.metrics.metamorphosisEnergyBurned).toBe(0.6);
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
      geneticId: world.nextGeneticId++,
      founderLineId: ant.founderLineId,
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

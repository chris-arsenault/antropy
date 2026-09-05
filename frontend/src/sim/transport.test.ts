import { describe, expect, it } from "vitest";
import { spoilCapacity, tryDig, tryEat } from "./actions";
import { foundColony } from "./colony";
import { PROGRAMMED_COLONY_CONFIG } from "./config";
import { Output, OUTPUT_COUNT } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { getVoxel, voxelIndex } from "./grid";
import { Material } from "./materials";
import { exchangeMaterialScent, sampleMaterialScent } from "./materialScent";
import { sampleScent } from "./scent";
import { ENERGY } from "./tunables";
import { createWorld, mutateVoxel, stepWorld, type World } from "./world";

import { surfaceSpawnY } from "./ant";

/** Relocate the worker to open surface well away from the queen's shaft. */
function antWithFood(world: World) {
  const ant = world.ants[0];
  const colony = world.colonies[0];
  ant.x = colony.x + 30;
  ant.z = colony.z + 30;
  ant.y = surfaceSpawnY(world.grid, ant.x, ant.z) ?? ant.y;
  ant.heading = 0;
  mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.FOOD);
  return ant;
}

describe("physical food transport (ADR-0006)", () => {
  it("keeps food pickup available when terrain digging is disabled", () => {
    const world = createWorld(7000, rnnController, PROGRAMMED_COLONY_CONFIG);
    foundColony(world);
    const ant = antWithFood(world);

    tryDig(world, ant, 0);

    expect(ant.carrying).toBe(Material.FOOD);
    expect(ant.carriedColonyScentOwner).toBe(ant.lineageId);
    expect(ant.carriedColonyScent).toBeGreaterThan(0);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.AIR);
  });

  it("resolves contact pickup before a simultaneous turn changes the target", () => {
    const world = createWorld(7006, rnnController, PROGRAMMED_COLONY_CONFIG);
    foundColony(world);
    const ant = antWithFood(world);
    ant.energy = ENERGY.max * ant.traits.storage;
    const output = new Float32Array(OUTPUT_COUNT);
    output[Output.TURN] = 1;
    output[Output.DIG] = 1;
    world.policyOverride = () => output;

    stepWorld(world);

    expect(ant.carrying).toBe(Material.FOOD);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.AIR);
  });

  it("picks up faced food when full instead of eating it", () => {
    const world = createWorld(7001);
    foundColony(world);
    const ant = antWithFood(world);
    ant.energy = ENERGY.max * ant.traits.storage; // satiated

    tryEat(world, ant);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.FOOD);

    tryDig(world, ant, 0);
    expect(ant.carrying).toBe(Material.FOOD);
    expect(ant.spoilLoads).toBe(1);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.AIR);
  });

  it("still eats when hungry", () => {
    const world = createWorld(7002);
    foundColony(world);
    const ant = antWithFood(world);
    ant.energy = 0.2;

    tryEat(world, ant);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.AIR);
    expect(ant.energy).toBeGreaterThan(0.2);
  });
});

describe("physical food deposits (ADR-0006)", () => {
  it("converts a food deposit at the queen into stockpile and merit", () => {
    const world = createWorld(7003);
    const colony = foundColony(world);
    const ant = antWithFood(world);
    tryDig(world, ant, 0); // pick up
    expect(ant.carrying).toBe(Material.FOOD);

    // Stand beside the queen and deposit.
    ant.x = colony.x + 1;
    ant.y = colony.y;
    ant.z = colony.z;
    ant.spoilLoads = spoilCapacity(ant); // force deposit mode
    const stockpileBefore = colony.stockpile;
    const meritBefore = colony.patrilineMerit.get(ant.patrilineId) ?? 0;

    tryDig(world, ant, 0);
    expect(colony.stockpile).toBeCloseTo(stockpileBefore + ENERGY.foodEnergy);
    expect(colony.patrilineMerit.get(ant.patrilineId)).toBeCloseTo(meritBefore + ENERGY.foodEnergy);
    expect(ant.netEnergyDelivered).toBeCloseTo(ENERGY.foodEnergy);
    expect(ant.spoilLoads).toBe(spoilCapacity(ant) - 1);
  });

  it("re-places a FOOD voxel when depositing away from the queen", () => {
    const world = createWorld(7004);
    foundColony(world);
    const ant = antWithFood(world);
    tryDig(world, ant, 0); // pick up
    ant.spoilLoads = spoilCapacity(ant);
    ant.carrying = Material.FOOD;

    tryDig(world, ant, 0);
    const cache = voxelIndex(world.grid, ant.x + 1, ant.y, ant.z);
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.FOOD);
    expect(sampleMaterialScent(world.materialColonyScent, cache, ant.lineageId)).toBeGreaterThan(0);
    exchangeMaterialScent(world.grid, world.colonyScent, world.materialColonyScent);
    expect(
      sampleScent(world.colonyScent, voxelIndex(world.grid, ant.x, ant.y, ant.z), ant.lineageId)
    ).toBeGreaterThan(0);
    expect(ant.netEnergyDelivered).toBe(0);
  });

  it("refuses to mix food and spoil in one carry", () => {
    const world = createWorld(7005);
    foundColony(world);
    const ant = antWithFood(world);
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.TOPSOIL);
    tryDig(world, ant, 0); // spoil load
    expect(ant.carrying).not.toBe(Material.FOOD);
    expect(ant.spoilLoads).toBe(1);

    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.FOOD);
    tryDig(world, ant, 0);
    expect(ant.carrying).not.toBe(Material.FOOD); // food pickup refused
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.FOOD);
  });
});

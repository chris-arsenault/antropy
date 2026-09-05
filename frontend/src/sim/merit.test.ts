import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { spoilCapacity, tryDig, tryTrophallaxis } from "./actions";
import { foundColony } from "./colony";
import { Material } from "./materials";
import { COLONY, ENERGY } from "./tunables";
import { createWorld, mutateVoxel, type World } from "./world";

/**
 * Merit fraud gate (§B.7.2): every credited unit of merit must coincide
 * with net-new energy entering the colony. Shuttling, re-depositing, and
 * give/feed cycling earn nothing.
 */
function antNearFood(world: World) {
  const ant = world.ants[0];
  const colony = world.colonies[0];
  ant.x = colony.x + 30;
  ant.z = colony.z + 30;
  ant.y = surfaceSpawnY(world.grid, ant.x, ant.z) ?? ant.y;
  ant.heading = 0;
  mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.FOOD);
  return { ant, colony };
}

describe("merit fraud gate (§B.7.2)", () => {
  it("a delivered food voxel is consumed — no re-deposit cycle exists", () => {
    const world = createWorld(7101);
    foundColony(world);
    const { ant, colony } = antNearFood(world);
    tryDig(world, ant, 0); // pick up
    ant.x = colony.x + 1;
    ant.y = colony.y;
    ant.z = colony.z;
    ant.spoilLoads = spoilCapacity(ant);

    tryDig(world, ant, 0); // deliver
    const stockAfter = colony.stockpile;
    const meritAfter = colony.patrilineMerit.get(ant.patrilineId);
    expect(world.foodSources.size).toBe(0); // the physical food is gone

    ant.spoilLoads = 0;
    ant.carrying = null;
    for (let i = 0; i < 10; i++) {
      tryDig(world, ant, 0); // nothing to deposit, nothing to defraud
    }
    expect(colony.stockpile).toBe(stockAfter);
    expect(colony.patrilineMerit.get(ant.patrilineId)).toBe(meritAfter);
  });

  it("trophallaxis conserves ant + stockpile energy and terminates", () => {
    const world = createWorld(7102);
    const colony = foundColony(world);
    const ant = world.ants.find((a) => a.sex !== 1);
    if (!ant) throw new Error("no female worker");
    ant.x = colony.x + 1;
    ant.y = colony.y;
    ant.z = colony.z;
    ant.energy = 1;
    colony.stockpile = 2;
    const total = ant.energy + colony.stockpile;
    const meritBefore = colony.patrilineMerit.get(ant.patrilineId) ?? 0;

    for (let i = 0; i < 200; i++) {
      tryTrophallaxis(world, ant);
    }
    // Giving stops exactly at the threshold: the ant cannot pump itself
    // into feed range (0.3) by giving, so no give/feed cycle exists.
    expect(ant.energy).toBeCloseTo(COLONY.trophallaxisThreshold);
    expect(ant.energy + colony.stockpile).toBeCloseTo(total);
    const credited = (colony.patrilineMerit.get(ant.patrilineId) ?? 0) - meritBefore;
    expect(credited).toBe(0);
    expect(ant.netEnergyDelivered).toBe(0);

    // The feed direction credits nothing.
    ant.energy = 0.1;
    const meritMid = colony.patrilineMerit.get(ant.patrilineId);
    tryTrophallaxis(world, ant);
    expect(ant.energy).toBeGreaterThan(0.1);
    expect(colony.patrilineMerit.get(ant.patrilineId)).toBe(meritMid);
    // And feeding restores at most to feedThreshold < give threshold.
    for (let i = 0; i < 200; i++) {
      tryTrophallaxis(world, ant);
    }
    expect(ant.energy).toBeLessThanOrEqual(COLONY.feedThreshold + 1e-9);
  });
});

describe("external-food merit provenance", () => {
  it("depositing food away from the nest re-places it without credit", () => {
    const world = createWorld(7103);
    foundColony(world);
    const { ant, colony } = antNearFood(world);
    tryDig(world, ant, 0); // pick up
    const gatheredAfterInitialPickup = world.metrics.surfaceFoodEnergyGathered;
    ant.spoilLoads = spoilCapacity(ant);
    ant.carrying = Material.FOOD;
    const meritBefore = colony.patrilineMerit.get(ant.patrilineId) ?? 0;

    for (let i = 0; i < 5; i++) {
      tryDig(world, ant, 0); // re-place
      tryDig(world, ant, 0); // re-pick
      ant.spoilLoads = Math.max(1, ant.spoilLoads);
      ant.carrying = Material.FOOD;
    }
    expect(colony.stockpile).toBeCloseTo(COLONY.foundingStockpile);
    expect(colony.patrilineMerit.get(ant.patrilineId) ?? 0).toBe(meritBefore);
    expect(world.metrics.surfaceFoodEnergyGathered).toBe(gatheredAfterInitialPickup);
  });

  it("credits external food once when it first enters a marked underground larder", () => {
    const world = createWorld(7104);
    foundColony(world);
    const { ant, colony } = antNearFood(world);
    tryDig(world, ant, 0);
    expect(ant.uncreditedFoodLoads).toBe(1);

    colony.stockpile = COLONY.stockpileSatiation;
    ant.x = colony.x;
    ant.y = colony.y;
    ant.z = colony.z;
    ant.heading = 0;
    const meritBefore = colony.patrilineMerit.get(ant.patrilineId) ?? 0;
    tryDig(world, ant, 0);

    expect(colony.patrilineMerit.get(ant.patrilineId)).toBeCloseTo(meritBefore + ENERGY.foodEnergy);
    expect(ant.netEnergyDelivered).toBeCloseTo(ENERGY.foodEnergy);
    expect(world.metrics.netEnergyMeritCredited).toBeCloseTo(ENERGY.foodEnergy);

    tryDig(world, ant, 0);
    tryDig(world, ant, 0);
    expect(colony.patrilineMerit.get(ant.patrilineId)).toBeCloseTo(meritBefore + ENERGY.foodEnergy);
  });
});

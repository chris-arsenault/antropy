import { describe, expect, it } from "vitest";
import { spoilCapacity, tryDig, tryEat } from "./actions";
import { foundColony } from "./colony";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { ENERGY } from "./tunables";
import { createWorld, mutateVoxel, type World } from "./world";

function antWithFood(world: World) {
  const ant = world.ants[0];
  ant.heading = 0;
  mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.FOOD);
  return ant;
}

describe("physical food transport (ADR-0006)", () => {
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
    const meritBefore = colony.patrilineDeliveries.get(ant.patrilineId) ?? 0;

    tryDig(world, ant, 0);
    expect(colony.stockpile).toBeCloseTo(stockpileBefore + ENERGY.foodEnergy);
    expect(colony.patrilineDeliveries.get(ant.patrilineId)).toBe(meritBefore + 1);
    expect(ant.deliveries).toBe(1);
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
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.FOOD);
    expect(ant.deliveries).toBe(0);
  });

  it("refuses to mix food and spoil in one carry", () => {
    const world = createWorld(7005);
    foundColony(world);
    const ant = world.ants[0];
    ant.heading = 0;
    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.TOPSOIL);
    tryDig(world, ant, 0); // spoil load
    expect(ant.carrying).toBe(Material.TOPSOIL);

    mutateVoxel(world, ant.x + 1, ant.y, ant.z, Material.FOOD);
    tryDig(world, ant, 0);
    expect(ant.carrying).toBe(Material.TOPSOIL); // food pickup refused
    expect(getVoxel(world.grid, ant.x + 1, ant.y, ant.z)).toBe(Material.FOOD);
  });
});

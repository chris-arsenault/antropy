import { describe, expect, it } from "vitest";
import { createWorld } from "./world";
import { PROGRAMMED_LIFECYCLE_CONFIG, terrainConfig } from "./config";
import { cellIndex, getCell, setCell, setBacking } from "./grid";
import { Material } from "./materials";
import { isWalkable } from "./terrain";
import { settleWorld } from "./settling";
import { energyResidual, totalEnergy, putFood, growFood } from "./resources";
import { updateLandmark } from "./colony/knowledge";

function fixture(gravity = true) {
  const base = terrainConfig("compact", PROGRAMMED_LIFECYCLE_CONFIG);
  const world = createWorld(
    101,
    "colony-programmed",
    {
      ...base,
      workerCount: 1,
      environment: { ...base.environment, gravity },
    },
    false
  );
  for (let x = 20; x <= 30; x++)
    for (let y = 20; y <= 28; y++) {
      setCell(world.grid, x, y, Material.AIR);
      setBacking(world.grid, x, y, Material.SOIL);
    }
  world.food.clear();
  world.foodSources.clear();
  world.renewableSources.splice(0);
  Object.assign(world.ant, { x: 24, y: 24 });
  Object.assign(world.queen, { x: 22, y: 24 });
  updateLandmark(world, -2, world.queen);
  world.economy.initial = totalEnergy(world);
  return world;
}

describe("physical settling", () => {
  it("lets both adult castes grip backing while brood and food settle to the floor", () => {
    const world = fixture();
    world.brood.push({ id: 1, x: 26, y: 24, stage: "egg", age: 0, energy: 2, investment: 0 });
    world.nextBroodId = 2;
    putFood(world, cellIndex(world.grid, 28, 24), 3);
    world.economy.initial = totalEnergy(world);
    settleWorld(world);
    expect(world.ant.y).toBe(24);
    expect(world.queen.y).toBe(24);
    expect(world.brood[0].y).toBe(23);
    expect(world.food.get(cellIndex(world.grid, 28, 23))).toBe(3);
    for (let i = 0; i < 8; i++) settleWorld(world);
    expect(world.queen.y).toBe(24);
    expect(world.brood[0].y).toBe(20);
    expect(world.food.get(cellIndex(world.grid, 28, 20))).toBe(3);
    expect(energyResidual(world)).toBeCloseTo(0, 10);
  });

  it("leaves the disabled comparison unchanged", () => {
    const world = fixture(false);
    const before = JSON.stringify({ queen: world.queen, ants: world.ants, cache: world.cache });
    settleWorld(world);
    expect(JSON.stringify({ queen: world.queen, ants: world.ants, cache: world.cache })).toBe(
      before
    );
  });

  it("updates only queen landmark position and invalidates its existing route", () => {
    const world = fixture();
    for (let x = 21; x <= 23; x++)
      for (let y = 23; y <= 25; y++) setBacking(world.grid, x, y, Material.AIR);
    world.ant.decision.route = {
      destination: -2,
      cells: [cellIndex(world.grid, 24, 24)],
      revision: world.grid.revision,
      cursor: 0,
      offRoute: false,
    };
    settleWorld(world);
    expect(world.knowledge.locations.get(-2)).toEqual({
      id: -2,
      kind: "queen",
      x: 22,
      y: 23,
      quantity: 0,
      observedAt: null,
      backed: true,
    });
    expect(world.ant.decision.route.offRoute).toBe(true);
  });
});

describe("settling collisions and exposed resources", () => {
  it("resolves bodies bottom first without overlaps and respects an attached worker", () => {
    const world = fixture();
    Object.assign(world.queen, { x: 24, y: 25 });
    world.brood.push({ id: 1, x: 24, y: 26, stage: "larva", age: 0, energy: 2, investment: 0 });
    settleWorld(world);
    expect([world.ant.y, world.queen.y, world.brood[0].y]).toEqual([24, 25, 26]);
    world.ant.x = 25;
    settleWorld(world);
    expect([world.queen.y, world.brood[0].y]).toEqual([25, 26]);
  });

  it("merges piles to capacity, retains overflow and does not reveal moved food", () => {
    const world = fixture();
    const bottom = cellIndex(world.grid, 28, 20),
      top = cellIndex(world.grid, 28, 21);
    putFood(world, bottom, 95);
    putFood(world, top, 4);
    world.economy.initial = totalEnergy(world);
    settleWorld(world);
    expect(world.food.get(bottom)).toBe(96);
    expect(world.food.get(top)).toBe(3);
    expect([...world.foodSources].sort()).toEqual([...world.food.keys()].sort());
    expect(world.knowledge.locations.has(bottom)).toBe(false);
    expect(energyResidual(world)).toBeCloseTo(0, 10);
  });

  it("keeps buried resources stationary until exposed and leaves production sites fixed", () => {
    const world = fixture();
    const source = cellIndex(world.grid, 28, 24);
    putFood(world, source, 4);
    world.renewableSources.push(source);
    setCell(world.grid, 28, 24, Material.CLAY);
    world.economy.initial = totalEnergy(world);
    settleWorld(world);
    growFood(world);
    expect(world.food.get(source)).toBe(4);
    setCell(world.grid, 28, 24, Material.AIR);
    settleWorld(world);
    growFood(world);
    expect(world.food.get(source)).toBe(world.config.foodRegrowth);
    expect(world.food.get(source - world.grid.width)).toBe(4);
    expect(world.renewableSources).toEqual([source]);
    expect(energyResidual(world)).toBeCloseTo(0, 10);
  });
});

describe("support changes", () => {
  it.each(["reference", "narrow", "compact"] as const)(
    "initializes workers in air beside the floor cache on %s nests",
    (nestShape) => {
      const base = terrainConfig("compact", PROGRAMMED_LIFECYCLE_CONFIG);
      for (const nestSeed of [0, 1]) {
        const world = createWorld(
          101,
          "colony-programmed",
          {
            ...base,
            nestSeed,
            environment: { ...base.environment, nestShape },
          },
          false
        );
        expect(world.ants.every((ant) => isWalkable(world.grid, ant.x, ant.y))).toBe(true);
        expect(getCell(world.grid, world.queen.x, world.queen.y - 1)).not.toBe(Material.AIR);
        expect(getCell(world.grid, world.cache.x, world.cache.y - 1)).not.toBe(Material.AIR);
      }
    }
  );

  it("lets workers fall only after losing grip and invalidates their route", () => {
    const world = fixture();
    for (let x = 21; x <= 27; x++)
      for (let y = 21; y <= 27; y++) setBacking(world.grid, x, y, Material.AIR);
    expect(isWalkable(world.grid, 24, 24)).toBe(false);
    world.ant.decision.route = {
      destination: -1,
      cells: [cellIndex(world.grid, 24, 24)],
      revision: world.grid.revision,
      cursor: 0,
      offRoute: false,
    };
    settleWorld(world);
    expect(world.ant.y).toBe(23);
    expect(world.ant.decision.route.offRoute).toBe(true);
    expect(world.ant.distanceMoved).toBe(0);
  });

  it("places landmarks on floors and moves the cache marker if its floor is removed", () => {
    const world = fixture();
    const { x, y } = world.cache;
    expect(getCell(world.grid, x, y - 1)).not.toBe(Material.AIR);
    setCell(world.grid, x, y - 1, Material.AIR);
    putFood(world, cellIndex(world.grid, x, y), 2);
    world.economy.initial = totalEnergy(world);
    settleWorld(world);
    expect(world.cache.y).toBe(y - 1);
    expect(getCell(world.grid, x, y)).toBe(Material.AIR);
    expect(getCell(world.grid, x, y - 1)).toBe(Material.CACHE);
    expect(world.food.get(cellIndex(world.grid, x, y - 1))).toBe(2);
    expect(world.knowledge.locations.get(-3)?.y).toBe(y - 1);
    expect(energyResidual(world)).toBeCloseTo(0, 10);
  });
});

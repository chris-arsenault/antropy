import { describe, expect, it } from "vitest";
import { PROGRAMMED_LIFECYCLE_CONFIG } from "./config";
import { createWorld, stepWorld } from "./world";
import { IDLE_ACTION } from "./controller/contract";
import { applyActionToAnt } from "./actions";
import { cellIndex, setCell } from "./grid";
import { Material } from "./materials";
import { energyResidual, growFood, putFood, totalEnergy } from "./resources";
import { maintainColony } from "./lifecycle";

function fixture(density: number) {
  const world = createWorld(
    7,
    "programmed-lifecycle",
    {
      ...PROGRAMMED_LIFECYCLE_CONFIG,
      foodEnergyDensity: density,
    },
    false
  );
  world.ants.splice(1);
  // Isolate transfers from chamber geometry without placing the worker or food inside soil.
  for (let dx = -2; dx <= 2; dx++)
    setCell(world.grid, world.queen.x + dx, world.queen.y, Material.AIR);
  Object.assign(world.ant, { x: world.queen.x - 2, y: world.queen.y, heading: 0, energy: 3 });
  world.queen.energy = 12;
  putFood(world, cellIndex(world.grid, world.ant.x + 1, world.ant.y), 4);
  world.economy.initial = totalEnergy(world);
  return world;
}

describe("food quantity and nutritional energy", () => {
  it.each([1, 0.75, 0.5])(
    "conserves pickup, digestion, feeding and release at density %s",
    (density) => {
      const world = fixture(density),
        ant = world.ant;
      applyActionToAnt(world, ant, { ...IDLE_ACTION, mandible: true });
      expect(ant.cargo).toBe(4);
      const reserve = ant.energy;
      applyActionToAnt(world, ant, { ...IDLE_ACTION, eat: true });
      expect(ant.energy).toBeCloseTo(reserve - world.config.mandibleCost + 0.2 * density);
      expect(ant.cargo).toBeCloseTo(3.8);
      applyActionToAnt(world, ant, { ...IDLE_ACTION, feed: true });
      expect(world.queen.energy).toBeCloseTo(12 + 0.25 * density);
      applyActionToAnt(world, ant, { ...IDLE_ACTION, release: true });
      expect(ant.cargo).toBe(0);
      expect(energyResidual(world)).toBeCloseTo(0, 8);
    }
  );

  it("changes energy supply without changing source volume or chemical clues", () => {
    const full = fixture(1),
      half = fixture(0.5);
    for (let tick = 0; tick < 5; tick++) {
      stepWorld(full, () => IDLE_ACTION);
      stepWorld(half, () => IDLE_ACTION);
    }
    expect(half.food).toEqual(full.food);
    expect(half.foodOdor.values).toEqual(full.foodOdor.values);
    expect(half.economy.grown).toBeCloseTo(full.economy.grown / 2);
    expect(energyResidual(half)).toBeCloseTo(0, 8);
  });
});

describe("nutritional transfer boundaries", () => {
  it("caps digestion by reserve space and funds larvae in energy units", () => {
    const world = fixture(0.5),
      ant = world.ant;
    ant.cargo = 4;
    ant.energy = world.config.maxEnergy - 0.01;
    world.brood.push({
      id: 1,
      x: ant.x + 1,
      y: ant.y,
      stage: "larva",
      age: 0,
      energy: 1,
      investment: 0,
    });
    world.economy.initial = totalEnergy(world);
    applyActionToAnt(world, ant, { ...IDLE_ACTION, eat: true });
    expect(ant.energy).toBeCloseTo(world.config.maxEnergy);
    applyActionToAnt(world, ant, { ...IDLE_ACTION, feed: true });
    expect(world.brood[0].energy).toBeCloseTo(1.125);
    expect(world.economy.broodFed).toBeCloseTo(0.125);
    expect(energyResidual(world)).toBeCloseTo(0, 8);
  });

  it("conserves worker, queen and brood recycling at low density", () => {
    const world = fixture(0.5);
    world.ant.cargo = 2;
    world.ant.age = world.config.workerLifespan;
    world.queen.age = world.config.queenLifespan;
    world.brood.push({
      id: 1,
      x: world.queen.x,
      y: world.queen.y + 1,
      stage: "larva",
      age: 0,
      energy: 0,
      investment: 3,
    });
    world.economy.initial = totalEnergy(world);
    maintainColony(world);
    growFood(world);
    expect(world.ants).toHaveLength(0);
    expect(world.brood).toHaveLength(0);
    expect(world.queen.alive).toBe(false);
    expect(energyResidual(world)).toBeCloseTo(0, 8);
  });

  it("rejects invalid density", () => {
    expect(() => fixture(0)).toThrow("density");
    expect(() => fixture(Number.NaN)).toThrow("density");
  });
});

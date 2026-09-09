import { describe, expect, it } from "vitest";
import { applyActionToAnt } from "./actions";
import { PROGRAMMED_LIFECYCLE_CONFIG } from "./config";
import { IDLE_ACTION } from "./controller/contract";
import { cellIndex, setCell } from "./grid";
import { maintainColony } from "./lifecycle";
import { Material } from "./materials";
import { energyResidual, growFood, putFood, totalEnergy } from "./resources";
import { createWorld } from "./world";
import { senseColony } from "./colonySensors";
import { programmedColony } from "./policies/colony";
import { layEgg } from "./reproduction";

function fixture() {
  const world = createWorld(7, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
  world.ants.splice(1);
  // An explicit supported feeding lane; the generated queen now starts on a narrow floor.
  for (let dx = -2; dx <= 2; dx++)
    setCell(world.grid, world.queen.x + dx, world.queen.y, Material.AIR);
  world.ant.x = world.queen.x - 2;
  world.ant.y = world.queen.y;
  world.ant.heading = 0;
  world.economy.initial = totalEnergy(world);
  return world;
}

describe("physical colony", () => {
  it("transfers food through pickup, eating, queen feeding and release without creating energy", () => {
    const world = fixture();
    const ant = world.ant;
    const index = cellIndex(world.grid, ant.x + 1, ant.y);
    putFood(world, index, 4);
    ant.energy = 3;
    world.queen.energy = 12;
    world.economy.initial = totalEnergy(world);
    applyActionToAnt(world, ant, { ...IDLE_ACTION, mandible: true });
    expect(ant.cargo).toBe(4);
    applyActionToAnt(world, ant, { ...IDLE_ACTION, eat: true });
    expect(ant.energy).toBeGreaterThan(3);
    applyActionToAnt(world, ant, { ...IDLE_ACTION, feed: true });
    expect(world.queen.energy).toBe(12.25);
    applyActionToAnt(world, ant, { ...IDLE_ACTION, release: true });
    expect(world.food.get(index)).toBeCloseTo(3.55);
    expect(ant.cargo).toBe(0);
    expect(energyResidual(world)).toBeCloseTo(0, 9);
  });

  it("cannot sense or feed a queen through intervening soil", () => {
    const world = fixture();
    world.queen.energy = 12;
    world.ant.cargo = 4;
    setCell(world.grid, world.ant.x + 1, world.ant.y, Material.SOIL);
    expect(senseColony(world, world.ant).contacts[0].hungry).toBe(false);
    applyActionToAnt(world, world.ant, { ...IDLE_ACTION, feed: true });
    expect(world.queen.energy).toBe(12);
    expect(world.ant.cargo).toBe(4);
  });

  it("keeps the environmental exit clue independent from worker traffic", () => {
    const world = fixture();
    const index = cellIndex(world.grid, world.ant.x + 1, world.ant.y);
    world.freshAir.values[index] = 2;
    const before = senseColony(world, world.ant).freshAir;
    world.pheromoneA.values[index] = 1000;
    expect(senseColony(world, world.ant).freshAir).toEqual(before);
    expect(before[0]).toBeGreaterThan(0);
    setCell(world.grid, world.ant.x + 1, world.ant.y, Material.SOIL);
    expect(senseColony(world, world.ant).freshAir[0]).toBe(0);
  });
});

describe("development and mortality", () => {
  it("matures an egg without automatically placing it, then pays for an explicit local lay", () => {
    const world = createWorld(7, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
    world.queen.layingAge = world.config.layingInterval;
    maintainColony(world);
    expect(world.ants).toHaveLength(world.config.workerCount);
    expect(world.brood).toHaveLength(0);
    setCell(world.grid, world.queen.x + 1, world.queen.y, Material.AIR);
    setCell(world.grid, world.queen.x + 1, world.queen.y - 1, Material.SOIL);
    expect(layEgg(world, world.queen, 0)).toBe("success");
    expect(world.brood).toHaveLength(1);
    expect(world.brood[0].stage).toBe("egg");
    expect(energyResidual(world)).toBeCloseTo(0, 9);
  });

  it("requires feeding for development and transfers brood reserves into the adult", () => {
    const world = fixture();
    const point = { x: world.queen.x + 2, y: world.queen.y };
    world.brood.push({
      ...point,
      id: 1,
      stage: "larva",
      age: world.config.larvaDuration,
      energy: 1,
      investment: 0,
    });
    world.economy.initial = totalEnergy(world);
    maintainColony(world);
    expect(world.brood[0].stage).toBe("larva");
    world.brood[0].investment = world.config.broodInvestment;
    world.economy.initial = totalEnergy(world) + world.economy.dissipated;
    maintainColony(world);
    expect(world.brood[0].stage).toBe("pupa");
    world.brood[0].age = world.config.pupaDuration;
    const expectedEnergy =
      world.brood[0].energy + world.brood[0].investment - world.config.broodMetabolism;
    maintainColony(world);
    expect(world.ants.at(-1)?.energy).toBeCloseTo(expectedEnergy);
    expect(world.metrics.workerHatches).toBe(1);
    expect(energyResidual(world)).toBeCloseTo(0, 9);
  });

  it("returns cargo and remaining reserve on age death, and attributes starvation separately", () => {
    const world = fixture();
    world.ant.cargo = 3;
    world.ant.age = world.config.workerLifespan;
    world.economy.initial = totalEnergy(world);
    maintainColony(world);
    expect(world.ants).toHaveLength(0);
    expect(world.economy.ageDeaths).toBe(1);
    expect(energyResidual(world)).toBeCloseTo(0, 9);
    const starved = fixture();
    starved.ant.energy = 0;
    starved.economy.initial = totalEnergy(starved);
    maintainColony(starved);
    expect(starved.economy.starvationDeaths).toBe(1);
    expect(energyResidual(starved)).toBeCloseTo(0, 9);
  });

  it("accounts for capped renewable environmental input", () => {
    const world = fixture();
    growFood(world);
    expect(world.economy.grown).toBeGreaterThan(0);
    expect(energyResidual(world)).toBeCloseTo(0, 9);
  });

  it("is a pure local policy with no private state", () => {
    const world = fixture();
    const frame = senseColony(world, world.ant);
    const before = structuredClone(frame);
    expect(programmedColony(frame)).toEqual(programmedColony(structuredClone(frame)));
    expect(frame).toEqual(before);
  });
});

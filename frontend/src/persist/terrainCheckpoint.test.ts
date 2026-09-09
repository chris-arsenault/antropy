import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { FORAGER_CONFIG, PROGRAMMED_LIFECYCLE_CONFIG } from "../sim/config";
import { buildEnvironment } from "../sim/nest";
import { createRandomState } from "../sim/random";
import { Material } from "../sim/materials";
import { setCell, cellIndex } from "../sim/grid";
import { foodAt, takeFood, totalEnergy, energyResidual } from "../sim/resources";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";

it("does not seed food odor through the wall of a buried pocket", () => {
  const config = { ...FORAGER_CONFIG, width: 512 };
  const environment = buildEnvironment(config, createRandomState(101));
  const buried = cellIndex(environment.grid, 20, 20);
  const cavity = cellIndex(environment.grid, 21, 20);
  setCell(environment.grid, 20, 20, Material.CLAY);
  setCell(environment.grid, 21, 20, Material.AIR);
  environment.foodSources.add(buried);
  const world = createWorld(101, "programmed", config, true, environment);
  expect(world.food.get(buried)).toBe(1);
  expect(world.foodOdor.values[cavity]).toBe(0);
  expect(foodAt(world, 20, 20)).toBe(0);
}, 15_000);

it("preserves an altered clay pocket and its buried food without exposing food through soil", () => {
  const world = createWorld(
    101,
    "programmed-lifecycle",
    { ...PROGRAMMED_LIFECYCLE_CONFIG, nestSeed: 712447 },
    false
  );
  const point = { x: 40, y: 20 },
    index = cellIndex(world.grid, point.x, point.y);
  setCell(world.grid, point.x, point.y, Material.CLAY);
  world.food.set(index, 5);
  world.foodSources.add(index);
  world.economy.initial = totalEnergy(world);
  expect(foodAt(world, point.x, point.y)).toBe(0);
  expect(takeFood(world, index, 1)).toBe(0);
  const checkpoint = createCheckpoint(world),
    restored = restoreCheckpoint(checkpoint);
  expect(createCheckpoint(restored)).toEqual(checkpoint);
  const changedDatum = { ...checkpoint, config: { ...checkpoint.config, surfaceBase: 2 } };
  expect(createCheckpoint(restoreCheckpoint(changedDatum))).toEqual(changedDatum);
  expect(() => restoreCheckpoint({ ...checkpoint, version: 6 })).toThrow("canonical 2D");
  for (const candidate of [world, restored]) {
    setCell(candidate.grid, point.x, point.y, Material.AIR);
    expect(foodAt(candidate, point.x, point.y)).toBe(5);
    stepWorld(candidate);
    expect(Math.abs(energyResidual(candidate))).toBeLessThan(1e-6);
  }
  expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
});

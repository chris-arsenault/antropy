import { expect, it } from "vitest";
import { constructionFixture } from "../construction/fixture";
import { FORAGER_CONFIG } from "../config";
import { climateMesh, meshIndex } from "./mesh";
import { syncClimateGeometry } from "./state";
import { stepClimate } from "./transport";
import { developmentRate, maintenanceMultiplier, releaseBodyWater, spoilFood } from "./physiology";
import { energyResidual } from "../resources";
import { Material } from "../materials";
import { setCell } from "../grid";

function fixture(size = 2) {
  return constructionFixture("colony-programmed", 1, {
    environment: {
      ...FORAGER_CONFIG.environment,
      microclimate: true,
      climateEffects: true,
      foodSpoilage: true,
    },
    climate: { ...FORAGER_CONFIG.climate, cellSize: size, interval: 1 },
  }).world;
}

it("conserves neighbor heat and finite water with separately accounted atmosphere exchange", () => {
  const world = fixture(),
    mesh = climateMesh(world.grid, world.config);
  const index = meshIndex(mesh, 25, 21);
  world.climate.temperature[index] += 10;
  world.climate.initialHeat += 10 * mesh.heatCapacity[index];
  for (let i = 0; i < 30; i++) {
    world.tick++;
    stepClimate(world);
  }
  const heat = world.climate.temperature.reduce(
    (sum, value, i) => sum + value * mesh.heatCapacity[i],
    0
  );
  const water = world.climate.water.reduce((sum, value) => sum + value, 0);
  expect(Math.abs(heat - world.climate.initialHeat - world.climate.heatExchange)).toBeLessThan(
    1e-6
  );
  expect(Math.abs(water - world.climate.initialWater - world.climate.boundaryWater)).toBeLessThan(
    1e-6
  );
  expect(world.climate.temperature[index]).toBeLessThan(34);
  expect(Math.min(...world.climate.water)).toBeGreaterThanOrEqual(0);
});

it("changes material exchange after excavation without creating water or silently creating heat", () => {
  const world = fixture(),
    before = world.climate.water.reduce((a, b) => a + b, 0);
  const mesh = climateMesh(world.grid, world.config),
    index = meshIndex(mesh, 21, 20);
  const capacity = mesh.heatCapacity[index];
  setCell(world.grid, 21, 20, Material.AIR);
  syncClimateGeometry(world);
  expect(world.climate.heatCapacity[index]).toBeLessThan(capacity);
  expect(world.climate.water.reduce((a, b) => a + b, 0)).toBe(before);
  expect(world.climate.terrainHeat).toBeLessThan(0);
});

it("charges thermal stress, slows development and accounts body water and food loss", () => {
  const world = fixture(),
    mesh = climateMesh(world.grid, world.config);
  const mild = maintenanceMultiplier(world, world.ant, "ant:1");
  world.climate.temperature.fill(40);
  expect(maintenanceMultiplier(world, world.ant, "ant:1")).toBeGreaterThan(mild);
  expect(developmentRate(world, world.queen)).toBeLessThan(1);
  const water = () =>
    world.climate.water.reduce((a, b) => a + b, 0) +
    [...world.climate.hydration.values()].reduce((a, b) => a + b, 0);
  const before = water();
  releaseBodyWater(world, world.ant, "ant:1");
  expect(water()).toBeCloseTo(before, 7);
  const index = meshIndex(mesh, 40, 21);
  world.climate.water[index] = mesh.waterCapacity[index];
  spoilFood(world);
  expect(world.climate.spoiledEnergy).toBeGreaterThan(0);
  expect(Math.abs(energyResidual(world))).toBeLessThan(1e-8);
});

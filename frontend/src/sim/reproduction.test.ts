import { expect, it } from "vitest";
import { constructionFixture } from "./construction/fixture";
import { maintainColony } from "./lifecycle";
import { layingPeriod, layingStatus } from "./reproduction";
import { cellIndex } from "./grid";
import { energyResidual, putFood, totalEnergy } from "./resources";
import { layEgg } from "./reproduction";

it("accelerates egg synthesis from queen nutrition, not remote food abundance or census", () => {
  const { world } = constructionFixture("colony-programmed", 1, {
    reproductionEnabled: true,
    layingInterval: 80,
  });
  world.queen.energy = world.config.queenEnergy * 0.8;
  const underfed = layingPeriod(world);
  putFood(world, cellIndex(world.grid, 40, 21), 1000);
  expect(layingPeriod(world)).toBe(underfed);
  world.queen.energy = world.config.queenEnergy;
  expect(layingPeriod(world)).toBeLessThan(underfed);
  world.queen.layingAge = world.config.layingInterval;
  world.economy.initial = totalEnergy(world);
  maintainColony(world);
  expect(world.metrics.workerEggs).toBe(0);
  expect(layEgg(world, world.queen, 0)).toBe("success");
  expect(world.metrics.workerEggs).toBe(1);
  expect(energyResidual(world)).toBeCloseTo(0, 8);
});

it("refuses unfunded reproduction even after the laying timer matures", () => {
  const { world } = constructionFixture("colony-programmed", 1, {
    reproductionEnabled: true,
    layingInterval: 80,
  });
  world.queen.energy = world.config.queenEnergy / 2;
  world.queen.layingAge = 10_000;
  world.economy.initial = totalEnergy(world);
  expect(layingStatus(world)).toBe("Waiting for queen feeding");
  maintainColony(world);
  expect(world.brood).toHaveLength(0);
  expect(energyResidual(world)).toBeCloseTo(0, 8);
});

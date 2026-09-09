import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { scenarioConfig } from "../sim/scenarios";
import { cellIndex } from "../sim/grid";
import { putFood, totalEnergy, energyResidual } from "../sim/resources";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";

it("restores mid-fall state without settling at load and continues identically", () => {
  const world = createWorld(
    101,
    "colony-programmed",
    { ...scenarioConfig("colony-programmed", "compact"), width: 512, foodCount: 4 },
    false
  );
  world.queen.y += 2;
  putFood(world, cellIndex(world.grid, world.cache.x + 2, world.cache.y + 2), 2);
  world.economy.initial = totalEnergy(world);
  stepWorld(world);
  const checkpoint = createCheckpoint(world);
  const restored = restoreCheckpoint(checkpoint);
  expect(createCheckpoint(restored)).toEqual(checkpoint);
  for (let i = 0; i < 6; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
  expect(energyResidual(world)).toBeCloseTo(0, 8);
  expect(() => restoreCheckpoint({ ...checkpoint, version: 10 })).toThrow("canonical 2D");
  expect(() =>
    restoreCheckpoint({
      ...checkpoint,
      config: {
        ...checkpoint.config,
        environment: { ...checkpoint.config.environment, gravity: "yes" },
      },
    })
  ).toThrow("gravity");
});

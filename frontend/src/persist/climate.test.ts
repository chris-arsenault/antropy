import { expect, it } from "vitest";
import { constructionFixture } from "../sim/construction/fixture";
import { FORAGER_CONFIG } from "../sim/config";
import { stepClimate } from "../sim/climate/transport";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";
import { attachBrood } from "../sim/construction/brood";
import { totalEnergy } from "../sim/resources";

it("continues climate and carried brood exactly, rejecting forged water and a missing carrier", () => {
  const { world } = constructionFixture("colony-lgp", 1, {
    environment: { ...FORAGER_CONFIG.environment, microclimate: true },
    climate: { ...FORAGER_CONFIG.climate, interval: 1, initialCavityHeat: 16 },
  });
  world.brood.push({ id: 1, x: 24, y: 21, stage: "larva", age: 0.5, energy: 2, investment: 0 });
  world.nextBroodId = 2;
  world.economy.initial = totalEnergy(world);
  attachBrood(world, world.ant, { x: 24, y: 21 });
  for (let i = 0; i < 5; i++) {
    world.tick++;
    stepClimate(world);
  }
  const checkpoint = createCheckpoint(world),
    restored = restoreCheckpoint(checkpoint);
  for (let i = 0; i < 5; i++) {
    world.tick++;
    restored.tick++;
    stepClimate(world);
    stepClimate(restored);
  }
  expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
  checkpoint.ants[0].brood = 900;
  expect(() => restoreCheckpoint(checkpoint)).toThrow(/brood carrier/);
  checkpoint.ants[0].brood = 1;
  checkpoint.climate.water[0] += 1;
  expect(() => restoreCheckpoint(checkpoint)).toThrow(/water budget/);
});

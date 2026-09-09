import { expect, it } from "vitest";
import { constructionFixture } from "./construction/fixture";
import { actColonyWorker } from "./colony/actors";
import { observeKnowledge, updateLandmark } from "./colony/knowledge";
import { setBacking } from "./grid";
import { Material } from "./materials";
import { observeHabitat, availableSites } from "./construction/habitat";
import { observedSiteLocations } from "./colony/reproductiveObservation";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s queen preserves a nursery position while adequately fed",
  (driver) => {
    const { world } = constructionFixture(driver);
    world.queen.energy = world.config.queenEnergy * 0.8;
    world.knowledge.locations.set(123, {
      id: 123,
      x: 45,
      y: 21,
      backed: false,
      kind: "food",
      quantity: 4,
      observedAt: 0,
    });
    actColonyWorker(world, world.queen);
    expect(world.queen.decision.history.at(-1)?.request.kind).toBe("wait");
    expect(world.queen).toMatchObject({ x: 25, y: 21 });
  }
);

it("offers every remembered site within one bounded scan without ranking its suitability", () => {
  const { world } = constructionFixture();
  for (let x = 21; x < 54; x += 3) {
    world.ant.x = x;
    observeHabitat(world, world.ant);
  }
  const sites = availableSites(world);
  const offered = new Set<number>();
  for (let tick = 0; tick <= Math.ceil(sites.length / 4); tick++) {
    world.tick = tick;
    for (const site of observedSiteLocations(world, world.queen)) offered.add(site.id);
  }
  expect(offered).toEqual(new Set(sites.map((site) => site.id)));
});

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s queen returns from feeding to an observed nursery and lays there",
  (driver) => {
    const { world } = constructionFixture(driver, 1, { reproductionEnabled: true });
    world.brood.push({ id: 1, x: 25, y: 21, stage: "larva", age: 0, energy: 2, investment: 0 });
    world.nextBroodId = 2;
    world.knowledge.locations.set(-100_000_001, {
      id: -100_000_001,
      x: 25,
      y: 21,
      backed: true,
      kind: "care",
      quantity: 6,
      observedAt: 0,
    });
    for (let x = 35; x < 55; x++)
      for (let y = 21; y < 29; y++) setBacking(world.grid, x, y, Material.AIR);
    Object.assign(world.queen, { x: 45, y: 21, layingAge: world.config.layingInterval });
    updateLandmark(world, -2, world.queen);
    observeKnowledge(world, world.queen);
    actColonyWorker(world, world.queen);
    expect(world.queen.decision.route?.destination).toBe(-100_000_001);
    for (let i = 0; i < 40 && world.brood.length === 1; i++) {
      world.tick++;
      actColonyWorker(world, world.queen);
    }
    expect(world.brood).toHaveLength(2);
    expect(world.queen.x).toBeLessThan(35);
  }
);

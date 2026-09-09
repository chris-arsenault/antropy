import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { FORAGER_CONFIG } from "../config";
import { actColonyWorker } from "../colony/actors";
import { setBacking } from "../grid";
import { Material } from "../materials";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s forages outside instead of returning empty to refresh a stale care observation",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
    });
    world.tick = 300;
    world.ant.x = 50;
    setBacking(world.grid, 50, 21, Material.AIR);
    world.knowledge.locations.get(-2)!.observedAt = 0;
    world.knowledge.locations.set(123, {
      id: 123,
      x: 54,
      y: 21,
      kind: "food",
      quantity: 4,
      backed: false,
      observedAt: 299,
    });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request).toMatchObject({
      kind: "acquire",
      destination: 123,
    });
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s keeps outdoor foraging when a shared care need appears beside stocked caches",
  (driver) => {
    const { world, source } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
    });
    world.tick = 300;
    world.ant.x = 50;
    setBacking(world.grid, 50, 21, Material.AIR);
    world.knowledge.locations.set(-2, {
      ...world.knowledge.locations.get(-2)!,
      quantity: 3,
      observedAt: 300,
    });
    world.knowledge.locations.set(source, {
      ...world.knowledge.locations.get(source)!,
      quantity: 8,
      observedAt: 300,
    });
    world.knowledge.locations.set(123, {
      id: 123,
      x: 54,
      y: 21,
      kind: "food",
      quantity: 4,
      backed: false,
      observedAt: 299,
    });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request).toMatchObject({
      kind: "acquire",
      destination: 123,
    });
  }
);

import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { actColonyWorker } from "../colony/actors";
import { cellIndex } from "../grid";
import { energyResidual, totalEnergy } from "../resources";
import { FORAGER_CONFIG } from "../config";
import { requestConstruction } from "./sites";
import { observeCandidates, F } from "../colony/observation";
import { observeHabitat } from "./habitat";
import { setBacking } from "../grid";
import { Material } from "../materials";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s physically delivers to the original empty cache without a second cache",
  (driver) => {
    const { world, source } = constructionFixture(driver);
    const cache = world.caches.get(source)!;
    const landmark = world.knowledge.locations.get(source)!;
    world.caches.delete(source);
    world.knowledge.locations.delete(source);
    world.caches.set(-3, cache);
    world.knowledge.locations.set(-3, { ...landmark, id: -3 });
    world.food.clear();
    world.foodSources.clear();
    Object.assign(world.ant, { x: 24, y: 21, cargo: 2 });
    world.economy.initial = totalEnergy(world);
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request).toMatchObject({
      kind: "acquire",
      destination: -3,
    });
    for (let i = 0; i < 25 && world.ant.cargo > 0; i++) actColonyWorker(world, world.ant);
    expect(world.caches.size).toBe(1);
    expect(world.food.get(cellIndex(world.grid, cache.x, cache.y))).toBe(2);
    expect(world.ant.cargo).toBe(0);
    expect(energyResidual(world)).toBeCloseTo(0, 8);
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s treats an exposed cache as storage and carries a care load away",
  (driver) => {
    const { world, source } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
    });
    Object.assign(world.ant, { x: 39, y: 21, cargo: 2 });
    setBacking(world.grid, 39, 21, Material.AIR);
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("deposit");
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).not.toBe("pickup");
    expect(world.knowledge.locations.get(cellIndex(world.grid, 40, 21))).toBeUndefined();
    Object.assign(world.ant, { x: 39, y: 21, task: 19 });
    world.knowledge.locations.set(-2, {
      ...world.knowledge.locations.get(-2)!,
      quantity: 2,
      observedAt: world.tick,
    });
    actColonyWorker(world, world.ant);
    expect(world.ant.cargo).toBe(4);
    expect(world.ant.task).toBe(36);
    for (let i = 0; i < 4; i++) actColonyWorker(world, world.ant);
    expect(world.ant.x).toBeLessThan(39);
    expect(world.ant.cargo).toBeGreaterThan(0);
    expect(world.knowledge.locations.get(source)?.quantity).toBe(5);
  }
);

it("exposes an active queen claim even when another worker proposes a different destination", () => {
  const { world } = constructionFixture("colony-programmed", 1, {
    environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
  });
  observeHabitat(world, world.ant);
  const job = requestConstruction(world, "queen", { x: 50, y: 21 }, { x: 51, y: 21 });
  job.status = "active";
  job.owner = 99;
  const candidates = observeCandidates(world, world.ant).filter(
    (candidate) => candidate.request.proposal?.kind === "queen"
  );
  expect(candidates.length).toBeGreaterThan(0);
  expect(candidates.every((candidate) => candidate.inputs[F.siteReserved] === 1)).toBe(true);
});

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s withdraws for care, feeds the queen and restores the unused food",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, autonomousConstruction: true },
    });
    world.queen.energy -= 2;
    observeHabitat(world, world.ant);
    Object.assign(world.ant, { x: 39, y: 21 });
    for (let i = 0; i < 70; i++) actColonyWorker(world, world.ant);
    expect(world.economy.queenFed).toBeGreaterThanOrEqual(1.5);
    expect(world.ant.cargo).toBe(0);
    expect(world.economy.harvested).toBe(0);
    expect(world.economy.completedReturns).toBe(0);
    expect(world.food.get(cellIndex(world.grid, 40, 21))).toBeCloseTo(7 - world.economy.queenFed);
  }
);

import { expect, it } from "vitest";
import { constructionFixture } from "./construction/fixture";
import { actColonyWorker } from "./colony/actors";
import { observeKnowledge } from "./colony/knowledge";
import { applyRequest } from "./colony/resolve";
import { WAIT } from "./colony/contract";
import { cellIndex, setCell } from "./grid";
import { Material } from "./materials";
import { putFood, totalEnergy, energyResidual } from "./resources";
import { maintainColony } from "./lifecycle";
import { attachQueen } from "./construction/transport";
import { senseColony } from "./colonySensors";
import { actorSystem } from "./actorSystem";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s queen chooses a food route, moves, and eats through the common controller",
  (driver) => {
    const { world } = constructionFixture(driver);
    world.ant.x = 42;
    observeKnowledge(world, world.ant);
    world.queen.energy = 12;
    world.economy.initial = totalEnergy(world);
    const workerMemory = structuredClone(world.ant.decision);
    expect(senseColony(world, world.queen).hunger).toBeCloseTo(0.6);
    actColonyWorker(world, world.queen);
    expect(world.queen.decision.history.at(-1)?.request.kind).toBe("acquire");
    for (let i = 0; i < 30; i++) {
      world.tick++;
      if (i === 2) world.queen.decision.route!.offRoute = true;
      actColonyWorker(world, world.queen);
      if (i === 2) expect(world.queen.decision.history.at(-1)?.request.kind).toBe("acquire");
    }
    expect(world.queen.x).toBeGreaterThan(25);
    expect(world.queen.energy).toBeGreaterThan(12);
    expect(world.queen.taskChanges).toBeGreaterThan(0);
    expect(world.ant.decision).toEqual(workerMemory);
    expect(world.knowledge.locations.get(-2)).toMatchObject({ x: world.queen.x, y: world.queen.y });
    expect(energyResidual(world)).toBeCloseTo(0, 8);
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s queen lays only as a controller action at an adjacent physical site",
  (driver) => {
    const { world } = constructionFixture(driver, 1, { reproductionEnabled: true });
    world.queen.layingAge = world.config.layingInterval;
    maintainColony(world);
    expect(world.brood).toHaveLength(0);
    actColonyWorker(world, world.queen);
    expect(world.queen.decision.history.at(-1)?.request.kind).toBe("lay-egg");
    expect(world.brood).toHaveLength(1);
    expect(
      Math.max(
        Math.abs(world.brood[0].x - world.queen.x),
        Math.abs(world.brood[0].y - world.queen.y)
      )
    ).toBe(1);
    expect(world.queen.layingAge).toBe(0);
    expect(energyResidual(world)).toBeCloseTo(0, 8);
  }
);

it("does not substitute a different laying site or grant workers reproductive capability", () => {
  const { world } = constructionFixture("colony-programmed", 1, { reproductionEnabled: true });
  world.queen.layingAge = world.config.layingInterval;
  setCell(world.grid, 26, 21, Material.SOIL);
  expect(applyRequest(world, world.queen, { ...WAIT, kind: "lay-egg", heading: 0 })).toBe(
    "blocked"
  );
  expect(applyRequest(world, world.ant, { ...WAIT, kind: "lay-egg", heading: 0 })).toBe("empty");
  expect(world.brood).toHaveLength(0);
});

it("keeps a carried queen's private controller active while preventing locomotion and laying", () => {
  const { world } = constructionFixture("colony-programmed", 1, { reproductionEnabled: true });
  world.ant.x = 24;
  expect(attachQueen(world, world.ant, world.queen)).toBe("success");
  world.queen.layingAge = world.config.layingInterval;
  world.queen.energy = 12;
  world.queen.cargo = 2;
  world.economy.initial = totalEnergy(world);
  const { x, y } = world.queen;
  expect(applyRequest(world, world.queen, { ...WAIT, kind: "right" })).toBe("blocked");
  expect(applyRequest(world, world.queen, { ...WAIT, kind: "lay-egg" })).toBe("blocked");
  actColonyWorker(world, world.queen);
  expect(world.queen.decision.history.at(-1)?.request.kind).toBe("eat");
  expect(world.queen).toMatchObject({ x, y, carrier: world.ant.id });
  expect(world.queen.energy).toBeGreaterThan(12);
  expect(energyResidual(world)).toBeCloseTo(0, 8);
});

it("runs the queen after worker extinction and returns her crop and reserves exactly once on death", () => {
  const { world } = constructionFixture();
  world.ants.splice(0);
  world.queen.energy = 12;
  putFood(world, cellIndex(world.grid, 26, 21), 2);
  world.economy.initial = totalEnergy(world);
  actorSystem.run({ world, policy: null, diagnosticGenome: null });
  expect(world.queen.energy).toBeGreaterThan(12);
  world.queen.cargo = 3;
  world.queen.age = world.config.queenLifespan;
  world.economy.initial = totalEnergy(world) + world.economy.dissipated;
  maintainColony(world);
  expect(world.queen).toMatchObject({ alive: false, cargo: 0, energy: 0 });
  const food = [...world.food];
  maintainColony(world);
  expect([...world.food]).toEqual(food);
  expect(energyResidual(world)).toBeCloseTo(0, 8);
});

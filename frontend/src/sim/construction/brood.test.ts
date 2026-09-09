import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { attachBrood, releaseBrood } from "./brood";
import { attachQueen, releaseWorkerLoads } from "./transport";
import { applyRequest } from "../colony/resolve";
import { WAIT } from "../colony/contract";
import { dig } from "./excavation";
import { settleWorld } from "../settling";
import { totalEnergy } from "../resources";
import { maintainColony } from "../lifecycle";

it("carries one brood body through paid motion, excludes other loads, and restores the carrier", () => {
  const { world } = constructionFixture();
  world.brood.push({ id: 1, x: 24, y: 21, stage: "larva", age: 0, energy: 2, investment: 0 });
  world.nextBroodId = 2;
  world.economy.initial = totalEnergy(world);
  expect(attachBrood(world, world.ant, { x: 24, y: 21 })).toBe("success");
  expect(attachQueen(world, world.ant, world.queen)).toBe("full");
  expect(dig(world, world.ant, { x: 22, y: 20 })).toBe("full");
  const energy = world.ant.energy;
  applyRequest(world, world.ant, { ...WAIT, kind: "up" });
  expect(world.ant.energy).toBeLessThan(energy);
  expect(world.brood[0].y).toBe(world.ant.y);
  settleWorld(world);
  expect(world.brood[0].y).toBe(world.ant.y);
  expect(releaseBrood(world, world.ant, { x: 24, y: 21 })).toBe("success");
  expect(world.ant.brood).toBeNull();
  expect(world.brood[0]).toMatchObject({ x: 24, y: 21, energy: 2 });
});

it("releases brood at the carrier position without deleting its reserves", () => {
  const { world } = constructionFixture();
  world.brood.push({ id: 1, x: 24, y: 21, stage: "pupa", age: 600, energy: 2, investment: 6 });
  attachBrood(world, world.ant, { x: 24, y: 21 });
  releaseWorkerLoads(world, world.ant);
  expect(world.ant.brood).toBeNull();
  expect(world.brood[0]).toMatchObject({ x: 23, y: 21, energy: 2, investment: 6 });
});

it("holds mature pupae in transit until the carrier places them", () => {
  const { world } = constructionFixture();
  world.brood.push({ id: 1, x: 24, y: 21, stage: "pupa", age: 600, energy: 2, investment: 6 });
  world.nextBroodId = 2;
  attachBrood(world, world.ant, { x: 24, y: 21 });
  maintainColony(world);
  expect(world.ants).toHaveLength(1);
  expect(world.brood).toHaveLength(1);
  expect(releaseBrood(world, world.ant, { x: 24, y: 21 })).toBe("success");
  maintainColony(world);
  expect(world.ants).toHaveLength(2);
  expect(world.brood).toHaveLength(0);
});

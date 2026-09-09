import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { FORAGER_CONFIG } from "../config";
import { applyRequest } from "../colony/resolve";
import { observeCandidates, F } from "../colony/observation";
import { WAIT } from "../colony/contract";
import { focusLocation } from "./collective";
import { Material } from "../materials";
import { cellIndex, getCell, setCell } from "../grid";
import { totalEnergy } from "../resources";
import { actColonyWorker } from "../colony/actors";

it("keeps a remembered worksite private and rejects another worker's landmark", () => {
  const { world } = constructionFixture("colony-programmed", 1, { workerCount: 2 });
  const [a, b] = world.ants;
  expect(applyRequest(world, a, { ...WAIT, kind: "remember-site" })).toBe("success");
  const target = focusLocation(a)!;
  expect(world.knowledge.locations.has(target.id)).toBe(false);
  expect(observeCandidates(world, b).some((c) => c.request.destination === target.id)).toBe(false);
  expect(applyRequest(world, b, { ...WAIT, kind: "acquire", destination: target.id })).toBe(
    "unknown-destination"
  );
  expect(applyRequest(world, a, { ...WAIT, kind: "forget-site" })).toBe("success");
  expect(a.decision.focus).toBeNull();
});

it("conserves the excavated material through a physical handoff to another ant", () => {
  const { world } = constructionFixture("colony-programmed", 1, {
    workerCount: 2,
    environment: { ...FORAGER_CONFIG.environment, excavation: true },
  });
  const [digger, hauler] = world.ants;
  Object.assign(hauler, { x: 27, y: 21 });
  setCell(world.grid, 22, 21, Material.LOOSE_SOIL);
  let result = applyRequest(world, digger, { ...WAIT, kind: "dig", heading: 4 });
  for (let n = 0; n < 20 && result === "working"; n++)
    result = applyRequest(world, digger, { ...WAIT, kind: "dig", heading: 4 });
  expect(result).toBe("success");
  expect(digger.spoil).toBe(Material.LOOSE_SOIL);
  const before = totalEnergy(world);
  expect(applyRequest(world, digger, { ...WAIT, kind: "drop-spoil", heading: 0 })).toBe("success");
  expect(totalEnergy(world)).toBeLessThan(before);
  expect(world.construction.loose.get(cellIndex(world.grid, 24, 21))).toEqual([
    Material.LOOSE_SOIL,
  ]);
  Object.assign(hauler, { x: 24, y: 22 });
  expect(applyRequest(world, hauler, { ...WAIT, kind: "recover-spoil", heading: 6 })).toBe(
    "success"
  );
  expect(digger.spoil).toBeNull();
  expect(world.construction.loose.size).toBe(0);
  Object.assign(hauler, { x: 28, y: 21 });
  expect(applyRequest(world, hauler, { ...WAIT, kind: "deposit-spoil", heading: 0 })).toBe(
    "success"
  );
  expect(getCell(world.grid, 29, 21)).toBe(Material.LOOSE_SOIL);
  expect(hauler.spoil).toBeNull();
});

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s releases a stale focus instead of shuttling forever",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: {
        ...FORAGER_CONFIG.environment,
        collectiveWork: true,
        autonomousConstruction: true,
      },
    });
    world.tick = 6001;
    world.ant.decision.focus = { x: 23, y: 21, since: 0, backed: true };
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("forget-site");
    expect(world.ant.decision.focus).toBeNull();
  }
);

it("does not observe remote workers as local competition", () => {
  const { world } = constructionFixture("colony-programmed", 1, { workerCount: 2 });
  Object.assign(world.ants[1], { x: 50, y: 21 });
  expect(observeCandidates(world, world.ant)[0].inputs[F.areaWorkers]).toBe(0);
});

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s releases excavation commitment when it acquires food",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: {
        ...FORAGER_CONFIG.environment,
        collectiveWork: true,
        autonomousConstruction: true,
      },
    });
    Object.assign(world.ant, { x: 30, y: 25, cargo: 1 });
    world.ant.decision.focus = { x: 31, y: 25, since: 0, backed: true };
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("forget-site");
    expect(world.ant.cargo).toBe(1);
  }
);

import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { actColonyWorker } from "../colony/actors";
import { FORAGER_CONFIG } from "../config";
import { setCell, createGrid, setBacking } from "../grid";
import { Material } from "../materials";
import { connectedNestCells } from "./nestArea";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s continues widening a nursery after local clearance and brood relocation",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, collectiveWork: true, excavation: true },
    });
    world.tick = 400;
    world.knowledge.locations.set(-1, {
      id: -1,
      x: 23,
      y: 40,
      kind: "entrance",
      backed: false,
      quantity: 0,
      observedAt: null,
    });
    world.ant.decision.focus = { x: 24, y: 21, since: 0, backed: true };
    setCell(world.grid, 24, 21, Material.SOIL);
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("dig");
    expect(world.ant.decision.focus).not.toBeNull();
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s seeks food after hauling instead of taking another soil load",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, collectiveWork: true },
    });
    world.ant.task = 91;
    world.construction.loose.set(21 * world.grid.width + 24, [Material.SOIL]);
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).not.toBe("recover-spoil");
    expect(world.ant.task).toBe(91);
    expect(world.ant.spoil).toBeNull();
  }
);

it("counts connected backed space and excludes the surface, isolated cuts and refilled cells", () => {
  const grid = createGrid(20, 20);
  for (let x = 2; x <= 5; x++) setBacking(grid, x, 5, Material.SOIL);
  setBacking(grid, 12, 5, Material.SOIL);
  expect(connectedNestCells(grid, { x: 2, y: 5 }).size).toBe(4);
  setCell(grid, 4, 5, Material.SOIL);
  expect(connectedNestCells(grid, { x: 2, y: 5 }).size).toBe(2);
});

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s descends toward disposal ground with a soil load",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, collectiveWork: true },
    });
    for (let x = 30; x < 56; x++)
      for (let y = 21; y < 29; y++) setBacking(world.grid, x, y, Material.AIR);
    Object.assign(world.ant, { x: 42, y: 23, spoil: Material.SOIL });
    world.knowledge.locations.set(-1, {
      id: -1,
      x: 23,
      y: 21,
      kind: "entrance",
      backed: false,
      quantity: 0,
      observedAt: null,
    });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("down");
    expect(world.ant.y).toBe(22);
    expect(world.ant.spoil).toBe(Material.SOIL);
  }
);

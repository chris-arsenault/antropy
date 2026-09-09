import { expect, it } from "vitest";
import { constructionFixture } from "../construction/fixture";
import { FORAGER_CONFIG } from "../config";
import { actColonyWorker } from "./actors";
import { applyRequest } from "./resolve";
import { WAIT } from "./contract";
import { cellIndex, setBacking } from "../grid";
import { Material } from "../materials";
import { depositChemical } from "../scent";

const environment = {
  ...FORAGER_CONFIG.environment,
  collectiveWork: true,
  autonomousConstruction: true,
};

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s completes an entrance trip despite recruitment scent behind it",
  (driver) => {
    const { world } = constructionFixture(driver, 1, { environment });
    Object.assign(world.ant, { x: 23, y: 22 });
    world.knowledge.locations.set(-1, {
      id: -1,
      kind: "entrance",
      x: 23,
      y: 24,
      backed: false,
      quantity: 0,
      observedAt: null,
    });
    depositChemical(world.pheromoneB, cellIndex(world.grid, 23, 21), 1);
    applyRequest(world, world.ant, { ...WAIT, kind: "acquire", destination: -1 });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.kind).toBe("forward");
    expect(world.ant.y).toBe(23);
    depositChemical(world.pheromoneB, cellIndex(world.grid, 23, 22), 1);
    actColonyWorker(world, world.ant);
    expect(world.ant.y).toBeGreaterThanOrEqual(23);
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s keeps hauling outward after reaching the surface",
  (driver) => {
    const { world } = constructionFixture(driver, 1, { environment });
    Object.assign(world.ant, { x: 30, y: 22, spoil: Material.SOIL });
    for (let x = 26; x < 40; x++)
      for (let y = 21; y < 25; y++) setBacking(world.grid, x, y, Material.AIR);
    world.knowledge.locations.set(-1, {
      id: -1,
      kind: "entrance",
      x: 23,
      y: 21,
      backed: false,
      quantity: 0,
      observedAt: null,
    });
    applyRequest(world, world.ant, { ...WAIT, kind: "acquire", destination: -1 });
    actColonyWorker(world, world.ant);
    expect(world.ant.x).toBeGreaterThanOrEqual(30);
    expect(world.ant.decision.history.at(-1)?.request.kind).not.toBe("acquire");
    expect(world.ant.decision.history.at(-1)?.request.kind).not.toBe("forward");
  }
);

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s forages instead of visiting an old hungry recipient with an empty crop",
  (driver) => {
    const { world } = constructionFixture(driver, 1, { environment });
    world.tick = 300;
    world.knowledge.locations.set(-1, {
      id: -1,
      kind: "entrance",
      x: 23,
      y: 28,
      backed: false,
      quantity: 0,
      observedAt: null,
    });
    world.knowledge.locations.set(-10, {
      id: -10,
      kind: "care",
      x: 29,
      y: 21,
      backed: true,
      quantity: 6,
      observedAt: 0,
    });
    actColonyWorker(world, world.ant);
    expect(world.ant.decision.history.at(-1)?.request.destination).toBe(-1);
  }
);

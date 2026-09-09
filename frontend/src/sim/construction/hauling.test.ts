import { expect, it } from "vitest";
import { constructionFixture } from "./fixture";
import { actColonyWorker } from "../colony/actors";
import { FORAGER_CONFIG } from "../config";
import { setBacking, setCell } from "../grid";
import { Material } from "../materials";
import { observeHabitat } from "./habitat";

it.each(["colony-programmed", "colony-lgp"] as const)(
  "%s routes over a terrain step and places spoil on observed ground away from the entrance",
  (driver) => {
    const { world } = constructionFixture(driver, 1, {
      environment: { ...FORAGER_CONFIG.environment, collectiveWork: true },
    });
    for (let x = 30; x < 56; x++)
      for (let y = 21; y < 29; y++) setBacking(world.grid, x, y, Material.AIR);
    for (let y = 21; y < 25; y++) setCell(world.grid, 34, y, Material.SOIL);
    world.knowledge.locations.set(-1, {
      id: -1,
      x: 30,
      y: 21,
      kind: "entrance",
      backed: false,
      quantity: 0,
      observedAt: null,
    });
    Object.assign(world.ant, { x: 45, y: 21 });
    observeHabitat(world, world.ant);
    Object.assign(world.ant, { x: 32, y: 21, spoil: Material.SOIL });
    for (let i = 0; i < 50 && world.construction.deposited === 0; i++) {
      world.tick++;
      actColonyWorker(world, world.ant);
    }
    expect(world.construction.deposited).toBe(1);
    expect(world.ant.x).toBeGreaterThan(34);
    expect(world.ant.spoil).toBeNull();
    expect(world.ant.task).toBe(91);
  }
);

import { constructionFixture } from "../../src/sim/construction/fixture";
import { FORAGER_CONFIG } from "../../src/sim/config";
import { Material } from "../../src/sim/materials";
import { setCell, setBacking } from "../../src/sim/grid";
import { totalEnergy } from "../../src/sim/resources";
import { type World } from "../../src/sim/types";

/** Supplied brood and reserves isolate construction mechanics; this does not certify survival. */
export function collectiveArena(
  driver: "colony-programmed" | "colony-lgp",
  collective: boolean
): World {
  const { world } = constructionFixture(driver, 101, {
    workerCount: 2,
    environment: {
      ...FORAGER_CONFIG.environment,
      excavation: true,
      autonomousConstruction: true,
      collectiveWork: collective,
    },
  });
  Object.assign(world.queen, { x: 22, y: 21 });
  Object.assign(world.ant, { x: 25, y: 21 });
  Object.assign(world.ants[1], { x: 25, y: 23 });
  world.knowledge.locations.set(-2, { ...world.knowledge.locations.get(-2)!, x: 22 });
  for (let x = 26; x < 34; x++)
    for (let y = 21; y < 24; y++) setCell(world.grid, x, y, Material.SOIL);
  for (let x = 34; x < 56; x++)
    for (let y = 21; y < 29; y++) setBacking(world.grid, x, y, Material.AIR);
  world.knowledge.locations.set(-1, {
    id: -1,
    x: 35,
    y: 21,
    kind: "entrance",
    backed: false,
    quantity: 0,
    observedAt: null,
  });
  for (const x of [23, 24])
    world.brood.push({
      id: world.nextBroodId++,
      x,
      y: 21,
      age: 0,
      stage: "egg",
      energy: world.config.workerEggCost,
      investment: 0,
    });
  world.economy.initial = totalEnergy(world);
  return world;
}

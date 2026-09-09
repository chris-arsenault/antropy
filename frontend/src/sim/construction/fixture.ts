import { FORAGER_CONFIG, type SimConfig } from "../config";
import { createClimate } from "../climate/state";
import { createWorld } from "../world";
import { Material } from "../materials";
import { cellIndex, setBacking, setCell } from "../grid";
import { totalEnergy, putFood } from "../resources";
import { updateLandmark } from "../colony/knowledge";
import { addCache } from "./sites";

/** Bounded mechanics arena; supplied reserves are accounted and do not certify survival. */
export function constructionFixture(
  scenario: "colony-programmed" | "colony-lgp" = "colony-programmed",
  seed = 1,
  overrides: Partial<SimConfig> = {}
) {
  const world = createWorld(
    seed,
    scenario,
    {
      ...FORAGER_CONFIG,
      width: 512,
      foodCount: 4,
      mortalityEnabled: true,
      reproductionEnabled: false,
      workerCount: 1,
      cropCapacity: 4,
      ...overrides,
    },
    false
  );
  world.food.clear();
  world.foodSources.clear();
  world.renewableSources.length = 0;
  for (let y = 20; y < 29; y++)
    for (let x = 20; x < 56; x++) {
      setCell(world.grid, x, y, y === 20 ? Material.ROCK : Material.AIR);
      setBacking(world.grid, x, y, Material.SOIL);
    }
  Object.assign(world.ant, { x: 23, y: 21 });
  Object.assign(world.queen, { x: 25, y: 21 });
  world.knowledge.locations.clear();
  world.knowledge.locations.set(-2, {
    x: 25,
    y: 21,
    id: -2,
    kind: "queen",
    backed: true,
    quantity: 0,
    observedAt: null,
  });
  updateLandmark(world, -2, world.queen);
  setCell(world.grid, world.cache.x, world.cache.y, Material.AIR);
  world.caches.clear();
  const source = addCache(world, { x: 40, y: 21 })!;
  putFood(world, cellIndex(world.grid, 40, 21), 7);
  world.economy.initial = totalEnergy(world);
  world.climate = createClimate(world.grid, world.config);
  return { world, source };
}

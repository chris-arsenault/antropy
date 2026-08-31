import { surfaceSpawnY } from "./ant";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { FOOD_GOVERNOR } from "./tunables";
import { mutateVoxel, type World } from "./world";

/**
 * Static density-dependent food governor (design spec §6): spawns FOOD at
 * random surface positions toward a fixed target count. Oscillating carrying
 * capacity replaces the static target in Release 2.
 */
export function stepFoodGovernor(world: World): void {
  const deficit = world.foodTarget - world.foodSources.size;
  const toSpawn = Math.min(deficit, FOOD_GOVERNOR.maxSpawnPerPass);
  for (let i = 0; i < toSpawn; i++) {
    const x = 1 + Math.floor(world.rng.next() * (world.grid.sizeX - 2));
    const z = 1 + Math.floor(world.rng.next() * (world.grid.sizeZ - 2));
    const y = surfaceSpawnY(world.grid, x, z);
    if (y !== null && getVoxelSafe(world.grid, x, y, z) === Material.AIR) {
      mutateVoxel(world, x, y, z, Material.FOOD);
    }
  }
}

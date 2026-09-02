import { surfaceSpawnY } from "./ant";
import { getVoxelSafe, voxelIndex } from "./grid";
import { Material } from "./materials";
import { randNormal } from "./rng";
import { FOOD_GOVERNOR, SEASON } from "./tunables";
import { mutateVoxel, type World } from "./world";

/**
 * Density-dependent food governor under an oscillating carrying capacity
 * (design spec §6, §9.3): the target breathes around world.foodBase on a slow
 * sinusoid plus noise, and FOOD spawns at random surface positions toward it.
 */
export function stepFoodGovernor(world: World): void {
  if (world.config.seasons) {
    const phase = (2 * Math.PI * world.tick) / SEASON.periodTicks;
    const seasonal = world.foodBase * (1 + SEASON.amplitude * Math.sin(phase));
    const jitter = world.foodBase * SEASON.noise * randNormal(world.rng);
    world.foodTarget = Math.max(0, Math.round(seasonal + jitter));
  } else {
    world.foodTarget = world.foodBase;
  }

  const deficit = world.foodTarget - world.foodSources.size;
  const toSpawn = Math.min(deficit, FOOD_GOVERNOR.maxSpawnPerPass);
  if (toSpawn <= 0) {
    return;
  }
  const occupied = new Set<number>();
  for (const ant of world.ants) {
    occupied.add(voxelIndex(world.grid, ant.x, ant.y, ant.z));
  }
  for (let i = 0; i < toSpawn; i++) {
    const x = 1 + Math.floor(world.rng.next() * (world.grid.sizeX - 2));
    const z = 1 + Math.floor(world.rng.next() * (world.grid.sizeZ - 2));
    const y = surfaceSpawnY(world.grid, x, z);
    if (
      y !== null &&
      getVoxelSafe(world.grid, x, y, z) === Material.AIR &&
      !occupied.has(voxelIndex(world.grid, x, y, z))
    ) {
      mutateVoxel(world, x, y, z, Material.FOOD);
    }
  }
}

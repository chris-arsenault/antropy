import { type Colony } from "./colony";
import { recordFoodPickup } from "./energy";
import { Material } from "./materials";
import { sampleMaterialScent } from "./materialScent";
import { COLONY, ENERGY } from "./tunables";
import { mutateVoxel, type World } from "./world";

function accessibleFood(
  world: World,
  colony: Colony,
  index: number,
  x: number,
  y: number,
  z: number
): boolean {
  const localSurface = world.surfaceMap[z * world.grid.sizeX + x];
  const withinAttendantReach =
    Math.abs(x - colony.x) <= COLONY.restockRadius &&
    Math.abs(z - colony.z) <= COLONY.restockRadius &&
    y <= localSurface + 1;
  const markedUndergroundCache =
    y <= localSurface &&
    world.storedFood.has(index) &&
    sampleMaterialScent(world.materialColonyScent, index, colony.id) > 0;
  return withinAttendantReach || markedUndergroundCache;
}

/** Transfer one physically accessible food voxel into the queen's crop. */
export function restockFromLarder(world: World, colony: Colony): void {
  if (colony.stockpile >= COLONY.restockBelow) return;
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
    if (!accessibleFood(world, colony, index, x, y, z)) continue;
    recordFoodPickup(world, Material.FOOD, x, y, z);
    mutateVoxel(world, x, y, z, Material.AIR);
    colony.stockpile += ENERGY.foodEnergy;
    return;
  }
}

import { inBounds, voxelIndex } from "../grid";
import { depositScent } from "../scent";
import { type World } from "../world";

/**
 * O-layer founding mark for the ladder's intended shaft mouth. The 3×3
 * surface patch covers both forward antenna samples for every spawn heading;
 * it authors a site, not a route or an action.
 */
export function premarkDigSite(world: World, x: number, y: number, z: number, owner: number): void {
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (inBounds(world.grid, x + dx, y, z + dz)) {
        depositScent(world.pheromoneA, voxelIndex(world.grid, x + dx, y, z + dz), 1, owner);
      }
    }
  }
}

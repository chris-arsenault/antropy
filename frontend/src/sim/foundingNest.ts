import { getVoxel } from "./grid";
import { Material } from "./materials";
import { mutateVoxel, type World } from "./world";

function carveIfSoft(world: World, x: number, y: number, z: number): void {
  if (getVoxel(world.grid, x, y, z) !== Material.ROCK) {
    mutateVoxel(world, x, y, z, Material.AIR);
  }
}

function carveShaft(world: World, cx: number, cy: number, cz: number, surfaceY: number): void {
  for (let y = cy + 2; y <= surfaceY; y++) {
    carveIfSoft(world, cx, y, cz);
    if (world.config.wideEntranceShaft) {
      carveIfSoft(world, cx + 1, y, cz);
      carveIfSoft(world, cx, y, cz + 1);
      carveIfSoft(world, cx + 1, y, cz + 1);
    }
  }
}

/** Founding chamber, entrance shaft, and shallow surface depression. */
export function carveFoundingNest(
  world: World,
  cx: number,
  cy: number,
  cz: number,
  surfaceY: number
): void {
  for (let dy = 0; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        carveIfSoft(world, cx + dx, cy + dy, cz + dz);
      }
    }
  }
  carveShaft(world, cx, cy, cz, surfaceY);
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const surface = world.surfaceMap[(cz + dz) * world.grid.sizeX + (cx + dx)];
      carveIfSoft(world, cx + dx, surface, cz + dz);
    }
  }
}

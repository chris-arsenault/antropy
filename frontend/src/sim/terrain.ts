import { createGrid, setVoxel, type VoxelGrid } from "./grid";
import { Material, type MaterialId } from "./materials";
import { fbm2 } from "./noise";
import { TERRAIN, WORLD_SIZE_X, WORLD_SIZE_Y, WORLD_SIZE_Z } from "./tunables";

// Independent noise domains derived from the world seed.
const SURFACE_SALT = 0x51ab;

/** Surface height for a column, from fBm over the horizontal plane. */
export function surfaceHeight(seed: number, x: number, z: number): number {
  const n = fbm2(
    seed ^ SURFACE_SALT,
    x * TERRAIN.surfaceScale,
    z * TERRAIN.surfaceScale,
    TERRAIN.surfaceOctaves
  );
  return Math.round(TERRAIN.surfaceBase + (n - 0.5) * 2 * TERRAIN.surfaceAmplitude);
}

function columnMaterial(
  seed: number,
  x: number,
  y: number,
  z: number,
  surface: number
): MaterialId {
  if (y > surface) {
    return Material.AIR;
  }
  if (y < TERRAIN.basementRows) {
    return Material.ROCK;
  }
  const warpX = x * TERRAIN.warpScale;
  const warpZ = z * TERRAIN.warpScale;
  const topsoilBottom =
    surface -
    TERRAIN.topsoilDepth -
    Math.round((fbm2(seed ^ 0x70b5, warpX, warpZ, 2) - 0.5) * 2 * TERRAIN.topsoilWarp);
  if (y > topsoilBottom) {
    return Material.TOPSOIL;
  }
  const clayBottom =
    topsoilBottom -
    TERRAIN.clayDepth -
    Math.round((fbm2(seed ^ 0xc1a4, warpX, warpZ, 2) - 0.5) * 2 * TERRAIN.clayWarp);
  if (y > clayBottom) {
    return Material.CLAY;
  }
  return Material.ROCK;
}

/** Generate the layered mineral world (design spec §5.2) from a seed. */
export function generateTerrain(seed: number): VoxelGrid {
  const grid = createGrid(WORLD_SIZE_X, WORLD_SIZE_Y, WORLD_SIZE_Z);
  for (let x = 0; x < grid.sizeX; x++) {
    for (let z = 0; z < grid.sizeZ; z++) {
      const surface = surfaceHeight(seed, x, z);
      for (let y = 0; y < grid.sizeY; y++) {
        setVoxel(grid, x, y, z, columnMaterial(seed, x, y, z, surface));
      }
    }
  }
  return grid;
}

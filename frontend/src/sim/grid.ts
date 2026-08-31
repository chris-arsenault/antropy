import { Material, type MaterialId } from "./materials";

/**
 * Flat typed-array voxel volume (design spec §5.1). Y is up. Indexing is
 * x-fastest, then z, then y, so a horizontal slab is contiguous.
 */
export interface VoxelGrid {
  readonly sizeX: number;
  readonly sizeY: number;
  readonly sizeZ: number;
  readonly data: Uint8Array;
}

export function createGrid(sizeX: number, sizeY: number, sizeZ: number): VoxelGrid {
  return { sizeX, sizeY, sizeZ, data: new Uint8Array(sizeX * sizeY * sizeZ) };
}

export function voxelIndex(grid: VoxelGrid, x: number, y: number, z: number): number {
  return (y * grid.sizeZ + z) * grid.sizeX + x;
}

export function inBounds(grid: VoxelGrid, x: number, y: number, z: number): boolean {
  return x >= 0 && x < grid.sizeX && y >= 0 && y < grid.sizeY && z >= 0 && z < grid.sizeZ;
}

export function getVoxel(grid: VoxelGrid, x: number, y: number, z: number): MaterialId {
  return grid.data[voxelIndex(grid, x, y, z)] as MaterialId;
}

export function setVoxel(
  grid: VoxelGrid,
  x: number,
  y: number,
  z: number,
  material: MaterialId
): void {
  grid.data[voxelIndex(grid, x, y, z)] = material;
}

/** Out-of-bounds coordinates read as AIR so edge checks stay branch-light. */
export function getVoxelSafe(grid: VoxelGrid, x: number, y: number, z: number): MaterialId {
  if (!inBounds(grid, x, y, z)) {
    return Material.AIR;
  }
  return getVoxel(grid, x, y, z);
}

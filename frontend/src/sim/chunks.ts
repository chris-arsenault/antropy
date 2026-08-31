import { type VoxelGrid } from "./grid";

/** Chunk edge length in voxels (design spec §5.1). */
export const CHUNK_SIZE = 16;

export interface ChunkCoord {
  cx: number;
  cy: number;
  cz: number;
}

/** Packs a chunk coordinate into a single integer key. */
export function chunkKey(cx: number, cy: number, cz: number): number {
  return (cy * 1024 + cz) * 1024 + cx;
}

export function chunkOfVoxel(x: number, y: number, z: number): ChunkCoord {
  return {
    cx: Math.floor(x / CHUNK_SIZE),
    cy: Math.floor(y / CHUNK_SIZE),
    cz: Math.floor(z / CHUNK_SIZE),
  };
}

export function chunkCount(grid: VoxelGrid): ChunkCoord {
  return {
    cx: Math.ceil(grid.sizeX / CHUNK_SIZE),
    cy: Math.ceil(grid.sizeY / CHUNK_SIZE),
    cz: Math.ceil(grid.sizeZ / CHUNK_SIZE),
  };
}

/**
 * Chunks whose mesh depends on the voxel at (x, y, z): its own chunk plus any
 * face-adjacent chunk when the voxel lies on a chunk boundary.
 */
export function affectedChunkKeys(x: number, y: number, z: number): number[] {
  const { cx, cy, cz } = chunkOfVoxel(x, y, z);
  const keys = [chunkKey(cx, cy, cz)];
  const lx = x % CHUNK_SIZE;
  const ly = y % CHUNK_SIZE;
  const lz = z % CHUNK_SIZE;
  if (lx === 0) keys.push(chunkKey(cx - 1, cy, cz));
  if (lx === CHUNK_SIZE - 1) keys.push(chunkKey(cx + 1, cy, cz));
  if (ly === 0) keys.push(chunkKey(cx, cy - 1, cz));
  if (ly === CHUNK_SIZE - 1) keys.push(chunkKey(cx, cy + 1, cz));
  if (lz === 0) keys.push(chunkKey(cx, cy, cz - 1));
  if (lz === CHUNK_SIZE - 1) keys.push(chunkKey(cx, cy, cz + 1));
  return keys;
}

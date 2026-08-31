import { type Ant } from "./ant";
import { voxelIndex, type VoxelGrid } from "./grid";

/** Voxel-keyed ant lookup, rebuilt once per tick for contact queries. */
export type AntIndex = Map<number, Ant[]>;

export function buildAntIndex(grid: VoxelGrid, ants: Iterable<Ant>): AntIndex {
  const index: AntIndex = new Map();
  for (const ant of ants) {
    if (!ant.alive) {
      continue;
    }
    const key = voxelIndex(grid, ant.x, ant.y, ant.z);
    const bucket = index.get(key);
    if (bucket) {
      bucket.push(ant);
    } else {
      index.set(key, [ant]);
    }
  }
  return index;
}

/** Ants within a cubic radius of a voxel, in deterministic order. */
export function antsNear(
  index: AntIndex,
  grid: VoxelGrid,
  x: number,
  y: number,
  z: number,
  radius: number
): Ant[] {
  const found: Ant[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const bucket = index.get(voxelIndex(grid, x + dx, y + dy, z + dz));
        if (bucket) {
          found.push(...bucket);
        }
      }
    }
  }
  return found;
}

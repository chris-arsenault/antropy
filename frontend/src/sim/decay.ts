import { voxelIndex } from "./grid";
import { Material } from "./materials";
import { DECAY } from "./tunables";
import { mutateVoxel, type World } from "./world";

// Reused occupancy scratch — rebuilt each pass, single-threaded.
const OCCUPIED = new Set<number>();

/**
 * Nest decay (design spec §9.2): subsurface air untrafficked past the TTL
 * collapses stochastically to LOOSE_FILL. Traffic (ant or queen presence)
 * refreshes lastVisit, so a living colony's core never decays — the map is
 * rented, not owned. Occupied voxels (ant or egg) never collapse.
 */
export function stepDecay(world: World): void {
  OCCUPIED.clear();
  for (const ant of world.ants) {
    if (ant.alive) {
      OCCUPIED.add(voxelIndex(world.grid, ant.x, ant.y, ant.z));
    }
  }
  const cutoff = world.tick > DECAY.ttlTicks ? world.tick - DECAY.ttlTicks : 0;
  if (cutoff === 0) {
    return;
  }
  for (const index of Array.from(world.cavities)) {
    if (world.lastVisit[index] >= cutoff) {
      continue;
    }
    if (OCCUPIED.has(index) || world.eggIndex.has(index)) {
      continue;
    }
    if (world.rng.next() < DECAY.collapseChance) {
      const x = index % world.grid.sizeX;
      const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
      const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
      mutateVoxel(world, x, y, z, Material.LOOSE_FILL);
    }
  }
}

/** Stamp a voxel as trafficked at the current tick. */
export function stampVisit(world: World, x: number, y: number, z: number): void {
  world.lastVisit[voxelIndex(world.grid, x, y, z)] = world.tick;
}

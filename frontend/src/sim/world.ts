import { affectedChunkKeys } from "./chunks";
import { setVoxel, type VoxelGrid } from "./grid";
import { type MaterialId } from "./materials";
import { createRng, type Rng, type RngState } from "./rng";
import { generateTerrain } from "./terrain";

export interface World {
  readonly seed: number;
  tick: number;
  rng: Rng;
  grid: VoxelGrid;
  /**
   * Change feed for the renderer: chunk keys whose voxels changed since the
   * last drain. Transient — rebuilt, never checkpointed.
   */
  dirtyChunks: Set<number>;
}

export interface WorldSnapshot {
  seed: number;
  tick: number;
  rngState: RngState;
}

export function createWorld(seed: number): World {
  return {
    seed,
    tick: 0,
    rng: createRng(seed),
    grid: generateTerrain(seed),
    dirtyChunks: new Set(),
  };
}

/** Advance the world by exactly one fixed timestep. */
export function stepWorld(world: World): void {
  world.tick += 1;
}

/** The canonical voxel mutation path: writes the grid and feeds the renderer. */
export function mutateVoxel(
  world: World,
  x: number,
  y: number,
  z: number,
  material: MaterialId
): void {
  setVoxel(world.grid, x, y, z, material);
  for (const key of affectedChunkKeys(x, y, z)) {
    world.dirtyChunks.add(key);
  }
}

export function snapshotWorld(world: World): WorldSnapshot {
  return {
    seed: world.seed,
    tick: world.tick,
    rngState: world.rng.getState(),
  };
}

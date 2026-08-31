import { createAnt, surfaceSpawnY, type Ant, type AntSpawn } from "./ant";
import { affectedChunkKeys } from "./chunks";
import { setVoxel, type VoxelGrid } from "./grid";
import { applyMotor } from "./locomotion";
import { type MaterialId } from "./materials";
import { createRng, type Rng, type RngState } from "./rng";
import { generateTerrain } from "./terrain";
import { walkerMotor } from "./walker";

export interface World {
  readonly seed: number;
  tick: number;
  rng: Rng;
  grid: VoxelGrid;
  ants: Ant[];
  nextAntId: number;
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
    ants: [],
    nextAntId: 1,
    dirtyChunks: new Set(),
  };
}

export function spawnAnt(world: World, spawn: AntSpawn): Ant {
  const ant = createAnt(world.nextAntId, spawn);
  world.nextAntId += 1;
  world.ants.push(ant);
  return ant;
}

/**
 * Scripted surface walkers for the pre-colony harness (M3/M4). The colony
 * system (M6) is the real population source.
 */
export function populateDebugWalkers(world: World, count: number): void {
  for (let i = 0; i < count; i++) {
    const x = 8 + Math.floor(world.rng.next() * (world.grid.sizeX - 16));
    const z = 8 + Math.floor(world.rng.next() * (world.grid.sizeZ - 16));
    const y = surfaceSpawnY(world.grid, x, z);
    if (y === null) {
      continue;
    }
    spawnAnt(world, {
      x,
      y,
      z,
      heading: world.rng.next() * Math.PI * 2,
      energy: 1,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
    });
  }
}

/** Advance the world by exactly one fixed timestep. */
export function stepWorld(world: World): void {
  world.tick += 1;
  for (const ant of world.ants) {
    if (!ant.alive) {
      continue;
    }
    ant.age += 1;
    applyMotor(world.grid, ant, walkerMotor(world.rng));
  }
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

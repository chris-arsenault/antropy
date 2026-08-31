import { createRng, type Rng, type RngState } from "./rng";

export interface World {
  readonly seed: number;
  tick: number;
  rng: Rng;
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
  };
}

/** Advance the world by exactly one fixed timestep. */
export function stepWorld(world: World): void {
  world.tick += 1;
}

export function snapshotWorld(world: World): WorldSnapshot {
  return {
    seed: world.seed,
    tick: world.tick,
    rngState: world.rng.getState(),
  };
}

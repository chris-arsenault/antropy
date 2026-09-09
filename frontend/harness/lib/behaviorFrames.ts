import { type World, type Ant } from "../../src/sim/types";

/** Sampled terrain and bodies for rendering; no climate or route reconstruction is implied. */
export function captureFrames(world: World, actor: (ant: Ant) => unknown) {
  const initialGrid = [...world.grid.cells];
  const frames: Record<string, unknown>[] = [];
  let revision = -1;
  let terrain: [number, number][] = [];
  return {
    initialGrid,
    frames,
    sample() {
      if (world.grid.revision !== revision) {
        terrain = [];
        world.grid.cells.forEach((material, index) => {
          if (material !== initialGrid[index]) terrain.push([index, material]);
        });
        revision = world.grid.revision;
      }
      frames.push({
        tick: world.tick,
        ants: world.ants.map(actor),
        queen: structuredClone(world.queen),
        brood: world.brood.map((body) => ({ ...body })),
        food: [...world.food],
        jobs: world.construction.jobs.map((job) => ({ ...job })),
        loose: [...world.construction.loose].map(([cell, pile]) => [cell, [...pile]]),
        terrain,
      });
    },
  };
}

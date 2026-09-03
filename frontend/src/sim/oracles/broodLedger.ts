import { eggExposureHazard } from "../eggs";
import { type World } from "../world";

export interface LedgerPosition {
  x: number;
  y: number;
  z: number;
}

/** Expected survival under the production exposure hazard, without sampling noise. */
export function expectedEggSurvival(
  world: World,
  position: LedgerPosition,
  startTick: number,
  observationTicks: number
): number {
  const previousTick = world.tick;
  let survival = 1;
  try {
    for (let tick = 1; tick <= observationTicks; tick++) {
      world.tick = startTick + tick;
      survival *= 1 - eggExposureHazard(world, position);
    }
    return survival;
  } finally {
    world.tick = previousTick;
  }
}

function positionFromIndex(world: World, index: number): LedgerPosition {
  const x = index % world.grid.sizeX;
  const yz = Math.floor(index / world.grid.sizeX);
  return { x, y: Math.floor(yz / world.grid.sizeZ), z: yz % world.grid.sizeZ };
}

/** Omniscient O-layer opportunity: mean survival in the best available cavity cells. */
export function bestCavityCohortSurvival(
  world: World,
  cohortSize: number,
  startTick: number,
  observationTicks: number
): number {
  const survival = [...world.cavities]
    .map((index) =>
      expectedEggSurvival(world, positionFromIndex(world, index), startTick, observationTicks)
    )
    .sort((a, b) => b - a)
    .slice(0, cohortSize);
  if (survival.length === 0) {
    return 0;
  }
  return survival.reduce((sum, value) => sum + value, 0) / survival.length;
}

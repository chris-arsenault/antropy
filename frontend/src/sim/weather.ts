import { type Ant } from "./ant";
import { Material } from "./materials";
import { type ScentField } from "./scent";
import { MICROCLIMATE, RAIN, SEASON } from "./tunables";
import { mutateVoxel, type World } from "./world";

/**
 * Weather liabilities (Appendix B Rule 5): a hostile surface makes depth,
 * caches, and tunnels worth their dig cost. Scheduling draws from the
 * world's dedicated weather rng stream so storms never perturb the
 * behavioral rng sequence.
 */

/** Surface metabolic stress multiplier: seasonal trough + midday peaks. */
export function surfaceStress(tick: number): number {
  const seasonPhase = (2 * Math.PI * tick) / SEASON.periodTicks;
  const dayPhase = (2 * Math.PI * tick) / MICROCLIMATE.dayTicks;
  const seasonal = MICROCLIMATE.seasonalStress * (0.5 - 0.5 * Math.sin(seasonPhase));
  const diurnal = MICROCLIMATE.diurnalStress * (0.5 + 0.5 * Math.sin(dayPhase));
  return 1 + seasonal + diurnal;
}

/** Depth-attenuated stress at an ant's position (halves every halfDepth). */
export function microclimateMultiplier(world: World, ant: Pick<Ant, "x" | "y" | "z">): number {
  const surface = world.surfaceMap[ant.z * world.grid.sizeX + ant.x];
  const depth = Math.max(0, surface - ant.y);
  return 1 + (surfaceStress(world.tick) - 1) * Math.pow(2, -depth / MICROCLIMATE.halfDepth);
}

// Wash scratch: reused across passes, single-threaded.
const washScratch: number[] = [];

function washSurfaceFood(world: World): void {
  washScratch.length = 0;
  const slab = world.grid.sizeX * world.grid.sizeZ;
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / slab);
    if (y > world.surfaceMap[z * world.grid.sizeX + x] && world.weatherRng.next() < RAIN.foodDestroyFraction) {
      washScratch.push(index);
    }
  }
  for (const index of washScratch) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / slab);
    mutateVoxel(world, x, y, z, Material.AIR);
  }
}

/** Scale above-surface actives toward zero; compaction culls them later. */
function washSurfacePheromone(world: World, field: ScentField): void {
  const slab = world.grid.sizeX * world.grid.sizeZ;
  for (let i = 0; i < field.activeCount; i++) {
    const index = field.activeList[i];
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / slab);
    if (y > world.surfaceMap[z * world.grid.sizeX + x]) {
      field.values[index] *= RAIN.pheromoneRetention;
    }
  }
}

function tryStartStorm(world: World): void {
  const phase = (2 * Math.PI * world.tick) / SEASON.periodTicks;
  const chance = RAIN.chanceAtPeak * (0.5 + 0.5 * Math.sin(phase));
  if (world.weatherRng.next() < chance) {
    world.rainRemaining = RAIN.durationTicks;
  }
}

/** One weather tick: run active rain washes or roll for the next storm. */
export function stepWeather(world: World): void {
  if (world.rainRemaining > 0) {
    world.rainRemaining -= 1;
    if (world.tick % RAIN.washInterval === 0) {
      washSurfaceFood(world);
      washSurfacePheromone(world, world.pheromoneA);
      washSurfacePheromone(world, world.pheromoneB);
    }
    return;
  }
  if (world.tick % RAIN.checkInterval === 0) {
    tryStartStorm(world);
  }
}

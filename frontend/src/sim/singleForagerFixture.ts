import { placeBootstrapColony } from "./colony";
import { SINGLE_FORAGER_CONFIG } from "./config";
import { rnnController, zeroGenome } from "./controller/rnn";
import { maxEnergy } from "./energy";
import { getVoxelSafe, voxelIndex } from "./grid";
import { Material } from "./materials";
import { exchangeMaterialScent, primeAuthoredMaterialScent } from "./materialScent";
import { primeAuthoredNestScent, primeAuthoredNestTrail } from "./nestScentCarrier";
import { authorProgrammedNest, type ProgrammedNest } from "./programmedNest";
import { emitFoodScent, stepScentField } from "./scent";
import { COLONY_ODOR } from "./tunables";
import { createWorld, mutateVoxel, type World } from "./world";

const FOOD_PATCH_SIZE = 8;
const FOOD_SCENT_WARMUP_PASSES = 40;
const FOOD_PATCH_OFFSET = { x: 9, z: -4 } as const;

export interface SingleForagerFixture {
  readonly world: World;
  readonly nest: ProgrammedNest;
}

function addFoodVoxel(world: World, x: number, z: number, patch: Set<number>): void {
  if (x <= 0 || x >= world.grid.sizeX - 1 || z <= 0 || z >= world.grid.sizeZ - 1) return;
  const y = world.surfaceMap[z * world.grid.sizeX + x] + 1;
  if (
    getVoxelSafe(world.grid, x, y, z) === Material.AIR &&
    getVoxelSafe(world.grid, x, y - 1, z) !== Material.AIR
  ) {
    mutateVoxel(world, x, y, z, Material.FOOD);
    patch.add(voxelIndex(world.grid, x, y, z));
  }
}

function addFoodRing(
  world: World,
  center: { readonly x: number; readonly z: number },
  radius: number,
  patch: Set<number>
): void {
  for (let dz = -radius; dz <= radius && patch.size < FOOD_PATCH_SIZE; dz++) {
    for (let dx = -radius; dx <= radius && patch.size < FOOD_PATCH_SIZE; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) === radius) {
        addFoodVoxel(world, center.x + dx, center.z + dz, patch);
      }
    }
  }
}

function authorFoodPatch(world: World, nest: ProgrammedNest): void {
  const center = {
    x: nest.entrance.x + FOOD_PATCH_OFFSET.x,
    z: nest.entrance.z + FOOD_PATCH_OFFSET.z,
  };
  const patch = new Set<number>();
  for (let radius = 0; radius <= 3 && patch.size < FOOD_PATCH_SIZE; radius++) {
    addFoodRing(world, center, radius, patch);
  }
  if (patch.size < FOOD_PATCH_SIZE) {
    throw new Error("single-forager fixture could not place its authored food patch");
  }
  world.foodBase = patch.size;
  world.foodTarget = patch.size;
}

function primeFoodOdor(world: World): void {
  for (let pass = 0; pass < FOOD_SCENT_WARMUP_PASSES; pass++) {
    emitFoodScent(world.grid, world.foodScent, world.foodSources);
    stepScentField(world.grid, world.foodScent);
  }
}

function primeColonyOdor(world: World, colonyId: number): void {
  primeAuthoredMaterialScent(world.grid, world.cavities, world.materialColonyScent, colonyId);
  for (let pass = 0; pass < COLONY_ODOR.fixtureWarmupPasses; pass++) {
    stepScentField(world.grid, world.colonyScent);
    exchangeMaterialScent(world.grid, world.colonyScent, world.materialColonyScent);
  }
}

/**
 * Construct the shared physical world before either diagnostic policy is attached.
 * This module deliberately has no dependency on omniscient planning code.
 */
export function buildSingleForagerFixture(seed: number): SingleForagerFixture {
  const world = createWorld(seed, rnnController, SINGLE_FORAGER_CONFIG);
  const nest = authorProgrammedNest(world);
  const colony = placeBootstrapColony(world, nest.queenHome, [nest.queenHome], nest.entrance, 1);
  const ant = world.ants[0];
  if (!ant) throw new Error("single-forager fixture requires one worker");
  ant.genome = zeroGenome();
  ant.traits = rnnController.physical(ant.genome);
  ant.bodyScale = ant.traits.bodyScale;
  ant.energy = maxEnergy(ant);

  authorFoodPatch(world, nest);
  primeAuthoredNestScent(world, colony);
  // This one-worker fixture inherits only that worker's physical traffic trace.
  // Seeding every unused station creates branch trails with no ants to maintain them.
  primeAuthoredNestTrail(world, colony, [nest.queenHome]);
  primeColonyOdor(world, colony.id);
  primeFoodOdor(world);
  return { world, nest };
}

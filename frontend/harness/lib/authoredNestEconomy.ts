import { type Ant } from "../../src/sim/ant";
import { type Colony } from "../../src/sim/colony";
import { NEST_CONFIG, type SimConfig } from "../../src/sim/config";
import { stepFoodGovernor } from "../../src/sim/foodSpawner";
import { Material } from "../../src/sim/materials";
import { buildAuthoredNestWorld, type AuthoredNestWorld } from "../../src/sim/nestWorld";
import { emitFoodScent, stepScentField } from "../../src/sim/scent";
import { ENERGY } from "../../src/sim/tunables";
import { type World } from "../../src/sim/world";

/** Fill the steady-food control world without advancing simulation time. */
function stockSteadyFood(world: World): void {
  for (let pass = 0; pass < 60 && world.foodSources.size < world.foodTarget; pass++) {
    stepFoodGovernor(world);
  }
}

/** Bring the food carrier to its mature control-world state before ants act. */
function primeFoodCarrier(world: World, passes = 100): void {
  for (let pass = 0; pass < passes; pass++) {
    emitFoodScent(world.grid, world.foodScent, world.foodSources);
    stepScentField(world.grid, world.foodScent);
  }
}

/** Canonical prepared world shared by authored-nest economy experiments. */
export function prepareAuthoredNestEconomy(
  seed: number,
  config: SimConfig = NEST_CONFIG
): AuthoredNestWorld {
  const built = buildAuthoredNestWorld(seed, undefined, config);
  stockSteadyFood(built.world);
  primeFoodCarrier(built.world);
  return built;
}

export function carriedFoodEnergy(ants: readonly Ant[]): number {
  return ants.reduce(
    (sum, ant) => sum + (ant.carrying === Material.FOOD ? ant.spoilLoads * ENERGY.foodEnergy : 0),
    0
  );
}

export function workerEnergy(world: World): number {
  return world.ants.reduce((sum, ant) => sum + ant.energy, 0);
}

export function broodEnergy(world: World): number {
  return world.eggs.reduce((sum, egg) => sum + egg.energy + egg.fedProgress, 0);
}

export function storedFoodEnergy(world: World): number {
  return world.storedFood.size * ENERGY.foodEnergy;
}

/** Conserved colony-owned energy; uncollected external food is excluded. */
export function totalColonyEnergy(world: World, colony: Colony): number {
  return (
    workerEnergy(world) +
    colony.stockpile +
    storedFoodEnergy(world) +
    carriedFoodEnergy(world.ants) +
    broodEnergy(world)
  );
}

export function cachedFoodCount(world: World): number {
  let count = 0;
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
    if (y <= world.surfaceMap[z * world.grid.sizeX + x]) count += 1;
  }
  return count;
}

import { type Ant } from "./ant";
import { maxEnergy } from "./energy";
import { getVoxelSafe, inBounds, voxelIndex } from "./grid";
import { Material, type MaterialId } from "./materials";
import { headingToDirection } from "./movement";
import { depositScent } from "./scent";
import { DIG, ENERGY, PHEROMONE_DEPOSIT_MAX } from "./tunables";
import { mutateVoxel, type World } from "./world";

function facedVoxel(ant: Ant): { x: number; y: number; z: number } {
  const { dx, dz } = headingToDirection(ant.heading);
  return { x: ant.x + dx, y: ant.y, z: ant.z + dz };
}

/** Eat the faced or underfoot FOOD voxel (design spec §4: eat-anything). */
export function tryEat(world: World, ant: Ant): void {
  const faced = facedVoxel(ant);
  const candidates = [faced, { x: ant.x, y: ant.y - 1, z: ant.z }];
  for (const pos of candidates) {
    if (
      inBounds(world.grid, pos.x, pos.y, pos.z) &&
      getVoxelSafe(world.grid, pos.x, pos.y, pos.z) === Material.FOOD
    ) {
      mutateVoxel(world, pos.x, pos.y, pos.z, Material.AIR);
      ant.energy = Math.min(maxEnergy(ant), ant.energy + ENERGY.foodEnergy);
      return;
    }
  }
}

function digCost(material: MaterialId): number | null {
  switch (material) {
    case Material.TOPSOIL:
      return DIG.cost.topsoil;
    case Material.CLAY:
      return DIG.cost.clay;
    case Material.LOOSE_FILL:
      return DIG.cost.looseFill;
    default:
      return null;
  }
}

/**
 * One terrain channel (design spec §5.4): dig the faced solid voxel when
 * unburdened; deposit carried spoil as LOOSE_FILL into the faced air voxel
 * when carrying. Spoil is conserved.
 */
export function tryDig(world: World, ant: Ant): void {
  const target = facedVoxel(ant);
  if (!inBounds(world.grid, target.x, target.y, target.z)) {
    return;
  }
  const material = getVoxelSafe(world.grid, target.x, target.y, target.z);

  if (ant.carrying === null) {
    const cost = digCost(material);
    if (cost === null) {
      return;
    }
    mutateVoxel(world, target.x, target.y, target.z, Material.AIR);
    ant.carrying = material;
    ant.carryLoad = 1;
    ant.energy -= cost;
    return;
  }

  if (material === Material.AIR) {
    mutateVoxel(world, target.x, target.y, target.z, Material.LOOSE_FILL);
    ant.carrying = null;
    ant.carryLoad = 0;
    ant.energy -= DIG.depositCost;
  }
}

/** Energy-costed pheromone deposition at the ant's own voxel. */
export function depositPheromones(world: World, ant: Ant, amountA: number, amountB: number): void {
  const index = voxelIndex(world.grid, ant.x, ant.y, ant.z);
  if (amountA > 0) {
    depositScent(world.pheromoneA, index, amountA * PHEROMONE_DEPOSIT_MAX);
    ant.energy -= amountA * ENERGY.depositCostPerUnit;
  }
  if (amountB > 0) {
    depositScent(world.pheromoneB, index, amountB * PHEROMONE_DEPOSIT_MAX);
    ant.energy -= amountB * ENERGY.depositCostPerUnit;
  }
}

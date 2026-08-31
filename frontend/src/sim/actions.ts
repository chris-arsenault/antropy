import { type Ant } from "./ant";
import { creditDelivery } from "./colony";
import { removeEgg } from "./eggs";
import { maxEnergy } from "./energy";
import { getVoxelSafe, inBounds, voxelIndex } from "./grid";
import { Material, type MaterialId } from "./materials";
import { headingToDirection } from "./movement";
import { depositScent } from "./scent";
import { COLONY, DIG, ENERGY, PHEROMONE_DEPOSIT_MAX } from "./tunables";
import { mutateVoxel, type World } from "./world";

function facedVoxel(ant: Ant): { x: number; y: number; z: number } {
  const { dx, dz } = headingToDirection(ant.heading);
  return { x: ant.x + dx, y: ant.y, z: ant.z + dz };
}

/**
 * A meal: colony tax first (the MVP delivery mechanic — merit and stockpile
 * credit for the eater's patriline), juvenile growth, then energy.
 */
function consume(world: World, ant: Ant, amount: number): void {
  const tax = creditDelivery(world, ant.lineageId, ant.patrilineId, amount);
  ant.deliveries += 1;
  if (ant.bodyScale < ant.traits.bodyScale) {
    ant.bodyScale = Math.min(ant.traits.bodyScale, ant.bodyScale + COLONY.growthPerMeal);
  }
  ant.energy = Math.min(maxEnergy(ant), ant.energy + (amount - tax));
}

/**
 * Eat whatever is at the mandibles (design spec §4: food or egg — cannibalism
 * and egg-policing are in the possibility space by construction).
 */
export function tryEat(world: World, ant: Ant): void {
  const faced = facedVoxel(ant);
  const candidates = [faced, { x: ant.x, y: ant.y - 1, z: ant.z }];
  for (const pos of candidates) {
    if (!inBounds(world.grid, pos.x, pos.y, pos.z)) {
      continue;
    }
    if (getVoxelSafe(world.grid, pos.x, pos.y, pos.z) === Material.FOOD) {
      mutateVoxel(world, pos.x, pos.y, pos.z, Material.AIR);
      consume(world, ant, ENERGY.foodEnergy);
      return;
    }
    const egg = world.eggIndex.get(voxelIndex(world.grid, pos.x, pos.y, pos.z));
    if (egg) {
      removeEgg(world, egg);
      consume(world, ant, egg.energy);
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

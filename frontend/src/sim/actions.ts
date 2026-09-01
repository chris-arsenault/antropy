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

// Single-threaded scratch — valid until the next digTargets call.
const DIG_TARGET_SCRATCH = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
];

/**
 * Dig target candidates in preference order, steered by vertical bias like
 * movement: biased down digs forward-down then straight down (shafts are
 * possible from flat ground), biased up digs forward-up first, neutral digs
 * the faced voxel then the forward step-down.
 */
function digTargets(ant: Ant, verticalBias: number): number {
  const { dx, dz } = headingToDirection(ant.heading);
  const set = (i: number, x: number, y: number, z: number) => {
    DIG_TARGET_SCRATCH[i].x = x;
    DIG_TARGET_SCRATCH[i].y = y;
    DIG_TARGET_SCRATCH[i].z = z;
  };
  if (verticalBias < -0.33) {
    set(0, ant.x + dx, ant.y - 1, ant.z + dz);
    set(1, ant.x, ant.y - 1, ant.z);
    set(2, ant.x + dx, ant.y, ant.z + dz);
    return 3;
  }
  if (verticalBias > 0.33) {
    set(0, ant.x + dx, ant.y + 1, ant.z + dz);
    set(1, ant.x + dx, ant.y, ant.z + dz);
    return 2;
  }
  set(0, ant.x + dx, ant.y, ant.z + dz);
  set(1, ant.x + dx, ant.y - 1, ant.z + dz);
  return 2;
}

/** Spoil loads an ant can hold — body size buys carry capacity (spec §3.2). */
export function spoilCapacity(ant: Ant): number {
  return Math.max(1, Math.round(ant.traits.bodyScale * 2));
}

/**
 * Deposit target candidates, deliberately ordered differently from dig
 * targets: level and upward-forward first, downward last — so spoil is
 * pushed aside or up, never straight back into a freshly dug hole.
 */
function depositTargets(ant: Ant): number {
  const { dx, dz } = headingToDirection(ant.heading);
  DIG_TARGET_SCRATCH[0].x = ant.x + dx;
  DIG_TARGET_SCRATCH[0].y = ant.y;
  DIG_TARGET_SCRATCH[0].z = ant.z + dz;
  DIG_TARGET_SCRATCH[1].x = ant.x + dx;
  DIG_TARGET_SCRATCH[1].y = ant.y + 1;
  DIG_TARGET_SCRATCH[1].z = ant.z + dz;
  DIG_TARGET_SCRATCH[2].x = ant.x + dx;
  DIG_TARGET_SCRATCH[2].y = ant.y - 1;
  DIG_TARGET_SCRATCH[2].z = ant.z + dz;
  return 3;
}

function digAt(world: World, ant: Ant, x: number, y: number, z: number): boolean {
  const cost = digCost(getVoxelSafe(world.grid, x, y, z));
  if (cost === null) {
    return false;
  }
  ant.carrying = getVoxelSafe(world.grid, x, y, z);
  ant.spoilLoads += 1;
  ant.carryLoad = ant.spoilLoads / spoilCapacity(ant);
  ant.energy -= cost;
  mutateVoxel(world, x, y, z, Material.AIR);
  return true;
}

function tryDeposit(world: World, ant: Ant): void {
  const count = depositTargets(ant);
  for (let i = 0; i < count; i++) {
    const { x, y, z } = DIG_TARGET_SCRATCH[i];
    if (inBounds(world.grid, x, y, z) && getVoxelSafe(world.grid, x, y, z) === Material.AIR) {
      mutateVoxel(world, x, y, z, Material.LOOSE_FILL);
      ant.spoilLoads -= 1;
      ant.carryLoad = ant.spoilLoads / spoilCapacity(ant);
      if (ant.spoilLoads === 0) {
        ant.carrying = null;
      }
      ant.energy -= DIG.depositCost;
      return;
    }
  }
}

/**
 * One terrain channel (design spec §5.4): below capacity, dig the first
 * diggable candidate; at capacity (or with nothing diggable while loaded),
 * deposit one spoil load as LOOSE_FILL. Spoil is conserved.
 */
export function tryDig(world: World, ant: Ant, verticalBias: number): void {
  if (ant.spoilLoads < spoilCapacity(ant)) {
    const count = digTargets(ant, verticalBias);
    for (let i = 0; i < count; i++) {
      const { x, y, z } = DIG_TARGET_SCRATCH[i];
      if (inBounds(world.grid, x, y, z) && digAt(world, ant, x, y, z)) {
        return;
      }
    }
    if (ant.spoilLoads === 0) {
      return;
    }
  }
  tryDeposit(world, ant);
}

/** Energy-costed, colony-tagged pheromone deposition at the ant's voxel. */
export function depositPheromones(world: World, ant: Ant, amountA: number, amountB: number): void {
  const index = voxelIndex(world.grid, ant.x, ant.y, ant.z);
  if (amountA > 0) {
    depositScent(world.pheromoneA, index, amountA * PHEROMONE_DEPOSIT_MAX, ant.lineageId);
    ant.energy -= amountA * ENERGY.depositCostPerUnit;
  }
  if (amountB > 0) {
    depositScent(world.pheromoneB, index, amountB * PHEROMONE_DEPOSIT_MAX, ant.lineageId);
    ant.energy -= amountB * ENERGY.depositCostPerUnit;
  }
}

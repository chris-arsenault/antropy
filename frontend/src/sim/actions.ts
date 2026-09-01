import { SEX_FEMALE, SEX_MALE, type Ant } from "./ant";
import { creditDelivery } from "./colony";
import { addEgg, findEggSpot, removeEgg } from "./eggs";
import { maxEnergy } from "./energy";
import { getVoxelSafe, inBounds, voxelIndex } from "./grid";
import { Material, type MaterialId } from "./materials";
import { headingToDirection } from "./movement";
import { depositScent } from "./scent";
import { COLONY, DIG, ENERGY, MALE, PHEROMONE_DEPOSIT_MAX } from "./tunables";
import { mutateVoxel, type World } from "./world";

function facedVoxel(ant: Ant): { x: number; y: number; z: number } {
  const { dx, dz } = headingToDirection(ant.heading);
  return { x: ant.x + dx, y: ant.y, z: ant.z + dz };
}

/** A meal: juvenile growth, then energy. Delivery credit comes only from
 * physically depositing food at the queen (ADR-0006). */
function consume(_world: World, ant: Ant, amount: number): void {
  if (ant.bodyScale < ant.traits.bodyScale) {
    ant.bodyScale = Math.min(ant.traits.bodyScale, ant.bodyScale + COLONY.growthPerMeal);
  }
  ant.energy = Math.min(maxEnergy(ant), ant.energy + amount);
}

/**
 * Eat whatever is at the mandibles (design spec §4: food or egg — cannibalism
 * and egg-policing are in the possibility space by construction). Satiation
 * gates ingestion physically: a nearly full ant cannot absorb a meal, so the
 * food stays in the world for pickup and transport instead of vanishing.
 */
export function tryEat(world: World, ant: Ant): void {
  if (ant.energy > maxEnergy(ant) - ENERGY.foodEnergy / 2) {
    return;
  }
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

/**
 * Load one unit from the target voxel. Loads are type-exclusive: spoil and
 * food never mix in one carry. FOOD pickup is the transport path (ADR-0006).
 */
function pickUpAt(world: World, ant: Ant, x: number, y: number, z: number): boolean {
  const material = getVoxelSafe(world.grid, x, y, z);
  const isFood = material === Material.FOOD;
  const cost = isFood ? DIG.cost.foodPickup : digCost(material);
  if (cost === null) {
    return false;
  }
  if (ant.carrying !== null && (ant.carrying === Material.FOOD) !== isFood) {
    return false;
  }
  ant.carrying = material;
  ant.spoilLoads += 1;
  ant.carryLoad = ant.spoilLoads / spoilCapacity(ant);
  ant.energy -= cost;
  mutateVoxel(world, x, y, z, Material.AIR);
  return true;
}

/** Chebyshev distance from the ant to its own colony's queen, or Infinity. */
function distanceToOwnQueen(world: World, ant: Ant): number {
  const colony = world.colonies.find((c) => c.id === ant.lineageId);
  if (!colony) {
    return Infinity;
  }
  return Math.max(
    Math.abs(ant.x - colony.x),
    Math.abs(ant.y - colony.y),
    Math.abs(ant.z - colony.z)
  );
}

function unload(ant: Ant): void {
  ant.spoilLoads -= 1;
  ant.carryLoad = ant.spoilLoads / spoilCapacity(ant);
  if (ant.spoilLoads === 0) {
    ant.carrying = null;
  }
  ant.energy -= DIG.depositCost;
}

function tryDeposit(world: World, ant: Ant): void {
  // Food deposited at the queen becomes stockpile + patriline merit; this is
  // the delivery event (design spec §7.1 merit signal).
  if (ant.carrying === Material.FOOD && distanceToOwnQueen(world, ant) <= COLONY.deliveryRadius) {
    creditDelivery(world, ant.lineageId, ant.patrilineId, ENERGY.foodEnergy);
    ant.deliveries += 1;
    unload(ant);
    return;
  }
  const count = depositTargets(ant);
  for (let i = 0; i < count; i++) {
    const { x, y, z } = DIG_TARGET_SCRATCH[i];
    if (inBounds(world.grid, x, y, z) && getVoxelSafe(world.grid, x, y, z) === Material.AIR) {
      mutateVoxel(world, x, y, z, ant.carrying === Material.FOOD ? Material.FOOD : Material.LOOSE_FILL);
      unload(ant);
      return;
    }
  }
}

/**
 * One terrain channel (design spec §5.4): below capacity, dig or pick up the
 * first workable candidate; at capacity (or with nothing workable while
 * loaded), deposit one load — spoil as LOOSE_FILL, food as a FOOD voxel or,
 * at the queen, as a delivery. Matter is conserved.
 */
export function tryDig(world: World, ant: Ant, verticalBias: number): void {
  if (ant.spoilLoads < spoilCapacity(ant)) {
    const count = digTargets(ant, verticalBias);
    for (let i = 0; i < count; i++) {
      const { x, y, z } = DIG_TARGET_SCRATCH[i];
      if (inBounds(world.grid, x, y, z) && pickUpAt(world, ant, x, y, z)) {
        return;
      }
    }
    if (ant.spoilLoads === 0) {
      return;
    }
  }
  tryDeposit(world, ant);
}

/**
 * A worker laying unmated (design spec §7.1 channel 2): a haploid male egg
 * paid from her own energy. Egg-policing is the eat-egg mechanic, not a rule.
 */
export function tryLayEgg(world: World, ant: Ant): void {
  if (ant.sex !== SEX_FEMALE) {
    return;
  }
  const endowment = ant.traits.eggEndowment;
  if (ant.energy < endowment + COLONY.eggLayCost + MALE.layReserve) {
    return;
  }
  const spot = findEggSpot(world, ant.x, ant.y, ant.z);
  if (spot === null) {
    return;
  }
  ant.energy -= endowment + COLONY.eggLayCost;
  addEgg(world, {
    id: world.nextAntId * 1_000_000 + world.tick,
    x: spot.x,
    y: spot.y,
    z: spot.z,
    genome: world.controller.haploidOffspring(ant.genome, world.rng),
    energy: endowment,
    incubationRemaining: COLONY.incubationTicks,
    sex: SEX_MALE,
    lineageId: ant.lineageId,
    patrilineId: ant.patrilineId,
    motherId: ant.id,
    fatherId: 0,
  });
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

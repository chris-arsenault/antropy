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
function eatAt(world: World, ant: Ant, x: number, y: number, z: number): boolean {
  if (getVoxelSafe(world.grid, x, y, z) === Material.FOOD) {
    mutateVoxel(world, x, y, z, Material.AIR);
    consume(world, ant, ENERGY.foodEnergy);
    return true;
  }
  const egg = world.eggIndex.get(voxelIndex(world.grid, x, y, z));
  if (egg) {
    if (egg.queenDestined === 1) {
      world.queenEggsEaten += 1;
    }
    removeEgg(world, egg);
    consume(world, ant, egg.energy);
    return true;
  }
  return false;
}

export function tryEat(world: World, ant: Ant): void {
  if (ant.energy > maxEnergy(ant) - ENERGY.foodEnergy / 2) {
    return;
  }
  const faced = facedVoxel(ant);
  const candidates = [faced, { x: ant.x, y: ant.y - 1, z: ant.z }];
  for (const pos of candidates) {
    if (inBounds(world.grid, pos.x, pos.y, pos.z) && eatAt(world, ant, pos.x, pos.y, pos.z)) {
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

/**
 * Whether the ant stands within its own colony's nest reach: the chamber,
 * the shaft, and the entrance depression. The scripted queen's receiving
 * surface is the nest structure (trophallaxis chains abstracted, ADR-0006) —
 * a forager crossing the entrance can unload without descending.
 */
function inNestReach(world: World, ant: Ant): boolean {
  const colony = world.colonies.find((c) => c.id === ant.lineageId);
  if (!colony) {
    return false;
  }
  if (Math.abs(ant.x - colony.x) > COLONY.deliveryRadius) {
    return false;
  }
  if (Math.abs(ant.z - colony.z) > COLONY.deliveryRadius) {
    return false;
  }
  const surface = world.surfaceMap[colony.z * world.grid.sizeX + colony.x];
  return ant.y >= colony.y - 1 && ant.y <= surface + 1;
}

/**
 * Scripted bidirectional trophallaxis (spec §7.2 — the queen is
 * special-cased): a fed female worker beside her queen passes surplus energy
 * to the stockpile (earning delivery merit); a hungry worker is fed from it.
 * The stockpile is the colony's energy buffer, not a one-way sink.
 */
export function tryTrophallaxis(world: World, ant: Ant): void {
  if (ant.sex !== SEX_FEMALE) {
    return;
  }
  const colony = world.colonies.find((c) => c.id === ant.lineageId);
  if (!colony || !inNestReach(world, ant)) {
    return;
  }
  if (ant.energy > COLONY.trophallaxisThreshold && colony.stockpile < COLONY.stockpileSatiation) {
    const amount = Math.min(COLONY.trophallaxisRate, ant.energy - COLONY.trophallaxisThreshold);
    ant.energy -= amount;
    creditDelivery(world, ant.lineageId, ant.patrilineId, amount);
    ant.deliveries += amount;
    return;
  }
  if (ant.energy < COLONY.feedThreshold && colony.stockpile > COLONY.queenReserve) {
    const amount = Math.min(
      COLONY.feedRate,
      COLONY.feedThreshold - ant.energy,
      colony.stockpile - COLONY.queenReserve
    );
    colony.stockpile -= amount;
    ant.energy += amount;
  }
}

function unload(ant: Ant): void {
  ant.spoilLoads -= 1;
  ant.carryLoad = ant.spoilLoads / spoilCapacity(ant);
  if (ant.spoilLoads === 0) {
    ant.carrying = null;
  }
  ant.energy -= DIG.depositCost;
}

function isOccupied(world: World, x: number, y: number, z: number): boolean {
  const index = voxelIndex(world.grid, x, y, z);
  if (world.eggIndex.has(index)) {
    return true;
  }
  for (const other of world.ants) {
    if (other.alive && other.x === x && other.y === y && other.z === z) {
      return true;
    }
  }
  return false;
}

function cropHasRoom(world: World, ant: Ant): boolean {
  const colony = world.colonies.find((c) => c.id === ant.lineageId);
  return colony !== undefined && colony.stockpile < COLONY.stockpileSatiation;
}

function tryDeposit(world: World, ant: Ant): void {
  // Food deposited at the queen becomes stockpile + patriline merit; this
  // is the delivery event (design spec §7.1 merit signal). A full crop
  // absorbs nothing (§B.3 R2 colony sink): surplus falls through to
  // physical placement, so hoards beyond the crop are FOOD voxels whose
  // location the rain liability prices (§B.7.3 storage insurance).
  if (ant.carrying === Material.FOOD && inNestReach(world, ant) && cropHasRoom(world, ant)) {
    creditDelivery(world, ant.lineageId, ant.patrilineId, ENERGY.foodEnergy);
    ant.deliveries += 1;
    unload(ant);
    return;
  }
  const count = depositTargets(ant);
  for (let i = 0; i < count; i++) {
    const { x, y, z } = DIG_TARGET_SCRATCH[i];
    if (
      inBounds(world.grid, x, y, z) &&
      getVoxelSafe(world.grid, x, y, z) === Material.AIR &&
      !isOccupied(world, x, y, z)
    ) {
      mutateVoxel(
        world,
        x,
        y,
        z,
        ant.carrying === Material.FOOD ? Material.FOOD : Material.LOOSE_FILL
      );
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
    id: world.nextEggId++,
    x: spot.x,
    y: spot.y,
    z: spot.z,
    genome: world.controller.haploidOffspring(ant.genome, world.rng),
    energy: endowment,
    incubationRemaining: COLONY.incubationTicks,
    sex: SEX_MALE,
    queenDestined: 0,
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

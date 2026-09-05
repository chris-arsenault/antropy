import { SEX_FEMALE, SEX_MALE, type Ant } from "./ant";
import { offspringIdentity, recordGeneticDeath } from "./ancestry";
import { eggCarryCapacity, spoilCapacity } from "./capacity";
import { addEgg, carryEgg, findEggSpot, placeCarriedEgg, removeEgg, STAGE_EGG } from "./eggs";
import {
  creditNetEnergyMerit,
  isAboveSurface,
  maxEnergy,
  recordFoodPickup,
  spendEnergy,
  transferToStockpile,
} from "./energy";
import { getVoxelSafe, inBounds, voxelIndex } from "./grid";
import { recordFoodDeposit } from "./foodDeposit";
import { haploidOffspring } from "./genetics";
import { dropUnsupportedOneVoxel } from "./locomotion";
import { Material, type MaterialId } from "./materials";
import { sampleMaterialScent } from "./materialScent";
import { depositScent } from "./scent";
import { mandibleTargetBand, type TargetBand } from "./targeting";
import { COLONY, COLONY_ODOR, DIG, ENERGY, MALE, PHEROMONE_DEPOSIT_MAX } from "./tunables";
import { mutateVoxel, type World } from "./world";

export { eggCarryCapacity, spoilCapacity } from "./capacity";

/** A meal: juvenile growth, then energy. Delivery credit comes only from
 * physically depositing food at the queen (ADR-0006). */
function consume(ant: Ant, amount: number): number {
  const before = ant.energy;
  if (ant.bodyScale < ant.traits.bodyScale) {
    ant.bodyScale = Math.min(ant.traits.bodyScale, ant.bodyScale + COLONY.growthPerMeal);
  }
  ant.energy = Math.min(maxEnergy(ant), ant.energy + amount);
  return ant.energy - before;
}

/**
 * Eat whatever is at the mandibles (design spec §4: food or egg — cannibalism
 * and egg-policing are in the possibility space by construction). Satiation
 * gates ingestion physically: a nearly full ant cannot absorb a meal, so the
 * food stays in the world for pickup and transport instead of vanishing.
 */
function eatAt(world: World, ant: Ant, x: number, y: number, z: number): boolean {
  if (getVoxelSafe(world.grid, x, y, z) === Material.FOOD) {
    const index = voxelIndex(world.grid, x, y, z);
    const alreadyStored = world.storedFood.has(index);
    const recycled = world.recycledFood.has(index);
    mutateVoxel(world, x, y, z, Material.AIR);
    const absorbed = consume(ant, ENERGY.foodEnergy);
    world.metrics.foodEaten += 1;
    world.metrics.foodEnergyConsumed += absorbed;
    if (recycled) {
      world.metrics.recycledFoodEnergyRecovered += absorbed;
    } else if (!alreadyStored && isAboveSurface(world, x, y, z)) {
      world.metrics.surfaceFoodEnergyGathered += absorbed;
    }
    return true;
  }
  const egg = world.eggIndex.get(voxelIndex(world.grid, x, y, z));
  if (egg) {
    if (egg.queenDestined === 1) {
      world.queenEggsEaten += 1;
    }
    const birthTick = world.geneticRecords.get(egg.geneticId)?.birthTick ?? world.tick;
    recordGeneticDeath(world, egg.geneticId, world.tick - birthTick);
    removeEgg(world, egg);
    consume(ant, egg.energy);
    return true;
  }
  return false;
}

export function tryEat(world: World, ant: Ant): void {
  if (ant.energy > maxEnergy(ant) - ENERGY.foodEnergy) {
    return;
  }
  const band = mandibleTargetBand(ant, ant.verticalAttention);
  for (let index = 0; index < band.count; index++) {
    const pos = band.targets[index];
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

function pickupCost(world: World, material: MaterialId): number | null {
  if (material === Material.FOOD) return DIG.cost.foodPickup;
  if (!world.config.terrainDigging) return null;
  return digCost(material);
}

function discardUnhauledSpoil(
  world: World,
  ant: Ant,
  x: number,
  y: number,
  z: number,
  material: MaterialId,
  cost: number
): boolean {
  if (material === Material.FOOD || world.config.spoilHauling) return false;
  spendEnergy(world, ant, cost);
  mutateVoxel(world, x, y, z, Material.AIR);
  dropLoadBearingOccupant(world, ant, x, y, z);
  return true;
}

function retainContactOdor(world: World, ant: Ant, materialIndex: number): void {
  if (!world.config.contactFoodOdor) return;
  const retained = sampleMaterialScent(world.materialColonyScent, materialIndex, ant.lineageId);
  ant.carriedColonyScentOwner = ant.lineageId;
  ant.carriedColonyScent = Math.max(retained, COLONY_ODOR.contactTransfer);
}

/**
 * Load one unit from the target voxel. Loads are type-exclusive: spoil and
 * food never mix in one carry. FOOD pickup is the transport path (ADR-0006).
 */
function pickUpAt(world: World, ant: Ant, x: number, y: number, z: number): boolean {
  if (ant.carriedEggIds.length > 0) return false;
  const material = getVoxelSafe(world.grid, x, y, z);
  const isFood = material === Material.FOOD;
  const cost = pickupCost(world, material);
  if (cost === null) return false;
  // Spoil hauling off: excavation clears the voxel outright and the soil
  // vanishes — the ant pays the dig cost but carries nothing. Food
  // transport is unaffected (it is how food reaches the nest).
  if (discardUnhauledSpoil(world, ant, x, y, z, material, cost)) return true;
  if (ant.carrying !== null && (ant.carrying === Material.FOOD) !== isFood) return false;
  const materialIndex = voxelIndex(world.grid, x, y, z);
  if (isFood) retainContactOdor(world, ant, materialIndex);
  ant.carrying = material;
  ant.spoilLoads += 1;
  ant.carryLoad = ant.spoilLoads / spoilCapacity(ant, world.config);
  spendEnergy(world, ant, cost);
  if (recordFoodPickup(world, material, x, y, z)) ant.uncreditedFoodLoads += 1;
  mutateVoxel(world, x, y, z, Material.AIR);
  dropLoadBearingOccupant(world, ant, x, y, z);
  return true;
}

function standsOn(ant: Ant, x: number, y: number, z: number): boolean {
  return ant.x === x && ant.y === y + 1 && ant.z === z;
}

/**
 * Only an occupant directly above the excavated voxel bears on that voxel.
 * The usual down-dig is the excavator's own floor and avoids a population
 * scan; lateral excavation scans only for the exceptional other occupant.
 */
function dropLoadBearingOccupant(
  world: World,
  excavator: Ant,
  x: number,
  y: number,
  z: number
): void {
  if (standsOn(excavator, x, y, z)) {
    dropUnsupportedOneVoxel(world.grid, excavator);
    return;
  }
  for (const occupant of world.ants) {
    if (occupant.alive && standsOn(occupant, x, y, z)) {
      dropUnsupportedOneVoxel(world.grid, occupant);
      return;
    }
  }
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
 * to the stockpile; a hungry worker is fed from it. Internal transfers earn
 * no germ-line merit. The stockpile is a buffer, not a one-way sink.
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
    transferToStockpile(world, ant.lineageId, amount);
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

function unload(world: World, ant: Ant): boolean {
  const uncreditedExternal = ant.carrying === Material.FOOD && ant.uncreditedFoodLoads > 0;
  if (uncreditedExternal) ant.uncreditedFoodLoads -= 1;
  ant.spoilLoads -= 1;
  ant.carryLoad = ant.spoilLoads / spoilCapacity(ant, world.config);
  if (ant.spoilLoads === 0) {
    ant.carrying = null;
    ant.carriedColonyScentOwner = 0;
    ant.carriedColonyScent = 0;
  }
  spendEnergy(world, ant, DIG.depositCost);
  return uncreditedExternal;
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

function depositAt(world: World, ant: Ant, x: number, y: number, z: number): boolean {
  if (
    !inBounds(world.grid, x, y, z) ||
    getVoxelSafe(world.grid, x, y, z) !== Material.AIR ||
    isOccupied(world, x, y, z)
  ) {
    return false;
  }
  const food = ant.carrying === Material.FOOD;
  const uncreditedExternal = food && ant.uncreditedFoodLoads > 0;
  mutateVoxel(world, x, y, z, food ? Material.FOOD : Material.LOOSE_FILL);
  if (food) {
    recordFoodDeposit(world, ant, x, y, z, uncreditedExternal);
  }
  unload(world, ant);
  return true;
}

function tryDeposit(world: World, ant: Ant, band: TargetBand): boolean {
  // Food deposited at the queen becomes stockpile; uncredited external food
  // also earns patriline merit. A full crop
  // absorbs nothing (§B.3 R2 colony sink): surplus falls through to
  // physical placement, so hoards beyond the crop are FOOD voxels whose
  // location the rain liability prices (§B.7.3 storage insurance).
  if (ant.carrying === Material.FOOD && inNestReach(world, ant) && cropHasRoom(world, ant)) {
    transferToStockpile(world, ant.lineageId, ENERGY.foodEnergy);
    if (ant.uncreditedFoodLoads > 0) creditNetEnergyMerit(world, ant, ENERGY.foodEnergy);
    world.metrics.foodDelivered += 1;
    unload(world, ant);
    return true;
  }
  for (let i = 0; i < band.count; i++) {
    const { x, y, z } = band.targets[i];
    if (depositAt(world, ant, x, y, z)) {
      return true;
    }
  }
  return false;
}

function depositSpoilInTargetBand(world: World, ant: Ant, band: TargetBand): boolean {
  for (let i = 0; i < band.count; i++) {
    const { x, y, z } = band.targets[i];
    if (depositAt(world, ant, x, y, z)) {
      return true;
    }
  }
  return false;
}

function pickUpEggInTargetBand(world: World, ant: Ant, band: TargetBand): boolean {
  if (ant.carrying !== null || ant.carriedEggIds.length >= eggCarryCapacity(ant, world.config)) {
    return false;
  }
  for (let i = 0; i < band.count; i++) {
    const { x, y, z } = band.targets[i];
    if (!inBounds(world.grid, x, y, z)) {
      continue;
    }
    const egg = world.eggIndex.get(voxelIndex(world.grid, x, y, z));
    if (egg && carryEgg(world, ant, egg)) {
      spendEnergy(world, ant, DIG.cost.foodPickup);
      return true;
    }
  }
  return false;
}

function placeEggInTargetBand(world: World, ant: Ant, band: TargetBand): boolean {
  const eggId = ant.carriedEggIds[0];
  if (eggId === undefined) {
    return false;
  }
  for (let i = 0; i < band.count; i++) {
    const { x, y, z } = band.targets[i];
    if (
      inBounds(world.grid, x, y, z) &&
      getVoxelSafe(world.grid, x, y, z) === Material.AIR &&
      !isOccupied(world, x, y, z) &&
      placeCarriedEgg(world, ant, eggId, x, y, z)
    ) {
      spendEnergy(world, ant, DIG.depositCost);
      return true;
    }
  }
  return false;
}

/** Resolve the brood-specific DIG preconditions; true consumes the intent. */
function tryBroodTransport(world: World, ant: Ant, band: TargetBand): boolean {
  if (!world.config.broodTransport) {
    return false;
  }
  if (pickUpEggInTargetBand(world, ant, band)) {
    return true;
  }
  if (ant.carriedEggIds.length === 0) {
    return false;
  }
  if (!placeEggInTargetBand(world, ant, band)) {
    spendEnergy(world, ant, DIG.depositCost);
  }
  return true;
}

function pickUpInTargetBand(world: World, ant: Ant, band: TargetBand): boolean {
  for (let i = 0; i < band.count; i++) {
    const { x, y, z } = band.targets[i];
    if (inBounds(world.grid, x, y, z) && pickUpAt(world, ant, x, y, z)) {
      return true;
    }
  }
  return false;
}

/**
 * One terrain channel (design spec §5.4): resolve the vertical-bias target
 * candidates in order. A loaded spoil carrier deposits into a targeted AIR
 * voxel; otherwise an ant below capacity digs or picks up the first workable
 * target. FOOD retains its queen-delivery path. An intent with no legal
 * effect pays the same token cost as placing one load.
 */
export function tryDig(world: World, ant: Ant, verticalBias: number): void {
  const band = mandibleTargetBand(ant, verticalBias);
  if (tryBroodTransport(world, ant, band)) {
    return;
  }
  const carryingSpoil = ant.carrying !== null && ant.carrying !== Material.FOOD;
  const hasCapacity = ant.spoilLoads < spoilCapacity(ant, world.config);
  if (carryingSpoil && depositSpoilInTargetBand(world, ant, band)) {
    // Deposit mode is selected by the carried load plus an AIR target. Scan
    // the active v1 band for air before considering further excavation, so
    // a multi-load carrier does not immediately re-dig the pile it placed.
    return;
  }
  if (hasCapacity && pickUpInTargetBand(world, ant, band)) {
    return;
  }
  if (ant.carrying === Material.FOOD && tryDeposit(world, ant, band)) {
    return;
  }
  spendEnergy(world, ant, DIG.depositCost);
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
  world.metrics.eggEnergyInvested += endowment;
  world.metrics.energyBurned += COLONY.eggLayCost;
  const genome = haploidOffspring(world, ant.genome);
  const identity = offspringIdentity(world, ant.founderLineId);
  addEgg(world, {
    id: world.nextEggId++,
    x: spot.x,
    y: spot.y,
    z: spot.z,
    carrierId: null,
    genome,
    energy: endowment,
    incubationRemaining: COLONY.incubationTicks,
    stage: STAGE_EGG,
    fedProgress: 0,
    hungerTicks: 0,
    sex: SEX_MALE,
    geneticId: identity.geneticId,
    founderLineId: identity.founderLineId,
    queenDestined: 0,
    lineageId: ant.lineageId,
    patrilineId: ant.patrilineId,
    motherId: ant.geneticId,
    fatherId: 0,
  });
}

/** Energy-costed, colony-tagged pheromone deposition at the ant's voxel. */
export function depositPheromones(world: World, ant: Ant, amountA: number, amountB: number): void {
  const index = voxelIndex(world.grid, ant.x, ant.y, ant.z);
  if (amountA > 0) {
    depositScent(world.pheromoneA, index, amountA * PHEROMONE_DEPOSIT_MAX, ant.lineageId);
    spendEnergy(world, ant, amountA * ENERGY.depositCostPerUnit);
  }
  if (amountB > 0) {
    depositScent(world.pheromoneB, index, amountB * PHEROMONE_DEPOSIT_MAX, ant.lineageId);
    spendEnergy(world, ant, amountB * ENERGY.depositCostPerUnit);
  }
}

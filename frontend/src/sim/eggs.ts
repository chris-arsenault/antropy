import { SEX_FEMALE, type Ant } from "./ant";
import { foundFromQueenEgg } from "./colony";
import { type Genome } from "./controller/contract";
import { dropFoodAt } from "./energy";
import { getVoxel, voxelIndex } from "./grid";
import { Material } from "./materials";
import { COLONY, EGG_EXPOSURE, LARVA, RAIN } from "./tunables";
import { microclimateMultiplier } from "./weather";
import { spawnAnt, type World } from "./world";

export const STAGE_EGG = 0;
export const STAGE_LARVA = 1;

/**
 * Brood is a physical world object (design spec §7.3): it sits in an air
 * voxel, carries its genome from lay time, and is edible by any ant. An
 * egg incubates into a larva; the larva is reared on stockpile feedings
 * (brood-as-capital, ADR-0011) and pupates into an adult — or perishes
 * into FOOD when starved or exposed.
 */
export interface Egg {
  id: number;
  x: number;
  y: number;
  z: number;
  /** Carrier ant id, or null while the brood occupies an indexed voxel. */
  carrierId: number | null;
  genome: Genome;
  /** Maternal energy transferred at lay time; the hatchling's start energy. */
  energy: number;
  incubationRemaining: number;
  /** STAGE_EGG until incubation completes, then STAGE_LARVA. */
  stage: number;
  /** Stockpile energy absorbed while a larva (pupates at rearingCost). */
  fedProgress: number;
  /** Consecutive unfed larva ticks (perishes past the grace window). */
  hungerTicks: number;
  /** SEX_FEMALE (fertilized) or SEX_MALE (unfertilized, haploid). */
  sex: number;
  /** 1 for a queen-destined egg (founds on hatch), else 0. */
  queenDestined: number;
  lineageId: number;
  patrilineId: number;
  motherId: number;
  fatherId: number;
}

export function eggKey(world: World, egg: Egg): number {
  return voxelIndex(world.grid, egg.x, egg.y, egg.z);
}

export function addEgg(world: World, egg: Egg): void {
  egg.carrierId = null;
  world.eggs.push(egg);
  world.eggIndex.set(eggKey(world, egg), egg);
  world.eggsLaid += 1;
}

/** Removal is by object identity, and the index entry is deleted only if
 * it maps to this egg — a shared-id or shared-voxel mixup must never
 * orphan a ghost index entry (that once fed ants phantom energy). */
export function removeEgg(world: World, egg: Egg): void {
  world.eggs = world.eggs.filter((e) => e !== egg);
  if (egg.carrierId != null) {
    const carrier = world.ants.find((ant) => ant.id === egg.carrierId);
    if (carrier) {
      carrier.carriedEggIds = carrier.carriedEggIds.filter((id) => id !== egg.id);
    }
    egg.carrierId = null;
  }
  if (world.eggIndex.get(eggKey(world, egg)) === egg) {
    world.eggIndex.delete(eggKey(world, egg));
  }
}

/** Remove a grounded egg from the voxel index and attach it to an ant. */
export function carryEgg(world: World, ant: Ant, egg: Egg): boolean {
  if (egg.carrierId != null || ant.carriedEggIds.includes(egg.id)) {
    return false;
  }
  const key = eggKey(world, egg);
  if (world.eggIndex.get(key) !== egg) {
    return false;
  }
  world.eggIndex.delete(key);
  egg.carrierId = ant.id;
  egg.x = ant.x;
  egg.y = ant.y;
  egg.z = ant.z;
  ant.carriedEggIds.push(egg.id);
  return true;
}

/** Place one of an ant's carried eggs into an already-validated AIR voxel. */
export function placeCarriedEgg(
  world: World,
  ant: Ant,
  eggId: number,
  x: number,
  y: number,
  z: number
): boolean {
  const carriedIndex = ant.carriedEggIds.indexOf(eggId);
  const egg = world.eggs.find((candidate) => candidate.id === eggId);
  if (carriedIndex < 0 || !egg || egg.carrierId !== ant.id) {
    return false;
  }
  ant.carriedEggIds.splice(carriedIndex, 1);
  egg.x = x;
  egg.y = y;
  egg.z = z;
  egg.carrierId = null;
  world.eggIndex.set(eggKey(world, egg), egg);
  return true;
}

/** Keep live carried brood at each carrier's current microclimate position. */
export function syncCarriedEggs(world: World): void {
  if (!world.eggs.some((egg) => egg.carrierId !== null)) {
    return;
  }
  const carriers = new Map(
    world.ants
      .filter((ant) => ant.alive && ant.carriedEggIds.length > 0)
      .map((ant) => [ant.id, ant] as const)
  );
  for (const egg of world.eggs) {
    if (egg.carrierId === null) {
      continue;
    }
    const carrier = carriers.get(egg.carrierId);
    if (!carrier) {
      throw new Error(`egg ${egg.id} has missing live carrier ${egg.carrierId}`);
    }
    egg.x = carrier.x;
    egg.y = carrier.y;
    egg.z = carrier.z;
  }
}

/** First egg-free air voxel within the radius at (·, y, ·), or null. */
export function findEggSpot(
  world: World,
  cx: number,
  cy: number,
  cz: number,
  radius = 1
): { x: number; y: number; z: number } | null {
  for (let dz = -radius; dz <= radius; dz++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      const z = cz + dz;
      const key = voxelIndex(world.grid, x, cy, z);
      if (getVoxel(world.grid, x, cy, z) === Material.AIR && !world.eggIndex.has(key)) {
        return { x, y: cy, z };
      }
    }
  }
  return null;
}

function hatch(world: World, egg: Egg): void {
  removeEgg(world, egg);
  if (egg.queenDestined === 1) {
    foundFromQueenEgg(world, egg);
    return;
  }
  const traits = world.controller.physical(egg.genome);
  const ant = spawnAnt(world, {
    x: egg.x,
    y: egg.y,
    z: egg.z,
    heading: world.rng.next() * Math.PI * 2,
    energy: egg.energy,
    sex: egg.sex ?? SEX_FEMALE,
    lineageId: egg.lineageId,
    patrilineId: egg.patrilineId,
    motherId: egg.motherId,
    fatherId: egg.fatherId,
    genome: egg.genome,
    controllerState: world.controller.createState(),
    traits,
  });
  world.metrics.workerBirths += 1;
  // Hatchlings are juveniles growing toward the genetic target (spec §7.3).
  ant.bodyScale = traits.bodyScale * COLONY.juvenileFraction;
}

/**
 * Per-tick death chance for an egg: scales with how far the local stress
 * multiplier exceeds the safe band (climate-keyed — depth shelters brood
 * exactly as it shelters adults); storms multiply it (Rule 5). Zero in a
 * stable microclimate, and no rng draw is spent there.
 */
export function eggExposureHazard(world: World, egg: Pick<Egg, "x" | "y" | "z">): number {
  const excess = microclimateMultiplier(world, egg) - EGG_EXPOSURE.safeMultiplier;
  if (excess <= 0) {
    return 0;
  }
  const rainFactor = world.rainRemaining > 0 ? RAIN.eggExposureMultiplier : 1;
  return EGG_EXPOSURE.deathChancePerTick * excess * rainFactor;
}

/** Rear a larva from its colony's stockpile; true while it is being fed. */
function feedLarva(world: World, larva: Egg): boolean {
  const colony = world.colonies.find((c) => c.id === larva.lineageId);
  if (!colony || colony.stockpile <= COLONY.queenReserve) {
    return false;
  }
  const draw = Math.min(LARVA.feedPerTick, colony.stockpile - COLONY.queenReserve);
  colony.stockpile -= draw;
  larva.fedProgress += draw;
  return true;
}

/** A larva's tick: rearing, starvation, pupation-readiness. */
function stepLarva(world: World, larva: Egg): "alive" | "ripe" | "perished" {
  if (feedLarva(world, larva)) {
    larva.hungerTicks = 0;
  } else {
    larva.hungerTicks += 1;
    if (larva.hungerTicks > LARVA.starvationGraceTicks) {
      world.metrics.broodStarved += 1;
      return "perished";
    }
  }
  return larva.fedProgress >= LARVA.rearingCost ? "ripe" : "alive";
}

/**
 * Advance the brood pipeline (brood-as-capital, ADR-0011): eggs incubate
 * into larvae; larvae are reared on stockpile feedings and pupate at
 * rearingCost, or perish when starved past the grace window. The climate
 * exposure hazard applies to both stages; casualties become FOOD — a
 * partial, lossy recycle of the invested capital. Ripe brood hatches in
 * order.
 */
function matureEgg(world: World, egg: Egg): "alive" | "ripe" {
  if (egg.queenDestined === 1 && !world.config.colonyFounding) {
    return "alive";
  }
  if (!world.config.larvalRearing) {
    return "ripe";
  }
  egg.stage = STAGE_LARVA;
  return "alive";
}

/** One brood tick: hazard roll, then incubation or rearing. */
function stepBroodOne(world: World, egg: Egg): "alive" | "ripe" | "perished" {
  if (world.config.eggExposure) {
    const hazard = eggExposureHazard(world, egg);
    if (hazard > 0 && world.rng.next() < hazard) {
      world.metrics.broodExposed += 1;
      return "perished";
    }
  }
  if (egg.stage === STAGE_EGG) {
    egg.incubationRemaining -= 1;
    if (egg.incubationRemaining <= 0) {
      // Phase 5 rearing gates the larval stage; without it a ripe egg
      // hatches straight to an adult (design spec §13 phase order).
      return matureEgg(world, egg);
    }
    return "alive";
  }
  return stepLarva(world, egg);
}

export function stepEggs(world: World): void {
  const ripe: Egg[] = [];
  const perished: Egg[] = [];
  for (const egg of world.eggs) {
    const outcome = stepBroodOne(world, egg);
    if (outcome === "perished") {
      perished.push(egg);
    } else if (outcome === "ripe") {
      ripe.push(egg);
    }
  }
  for (const egg of perished) {
    world.eggsPerished += 1;
    removeEgg(world, egg);
    dropFoodAt(world, egg.x, egg.y, egg.z);
  }
  for (const egg of ripe) {
    hatch(world, egg);
  }
}

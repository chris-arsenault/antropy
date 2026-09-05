import { SEX_MALE, type Ant } from "./ant";
import { recordAntDeath, recordNetEnergyDelivery } from "./ancestry";
import { getVoxelSafe, inBounds, voxelIndex } from "./grid";
import { Material, type MaterialId } from "./materials";
import { ENERGY, MALE } from "./tunables";
import { mutateVoxel, type World } from "./world";

export function maxEnergy(ant: Ant): number {
  return ENERGY.max * ant.traits.storage;
}

export function spendEnergy(world: World, ant: Ant, amount: number): void {
  ant.energy -= amount;
  world.metrics.energyBurned += amount;
}

/** Transfer ordinary internal energy to the colony without creating germ-line merit. */
export function transferToStockpile(world: World, lineageId: number, amount: number): void {
  const colony = world.colonies.find((candidate) => candidate.id === lineageId);
  if (!colony) return;
  colony.stockpile += amount;
}

/** Credit net-new external food energy after it first enters an owned colony sink. */
export function creditNetEnergyMerit(world: World, ant: Ant, amount: number): void {
  const colony = world.colonies.find((candidate) => candidate.id === ant.lineageId);
  if (!colony) return;
  colony.patrilineMerit.set(
    ant.patrilineId,
    (colony.patrilineMerit.get(ant.patrilineId) ?? 0) + amount
  );
  ant.netEnergyDelivered += amount;
  recordNetEnergyDelivery(world, ant, amount);
  world.metrics.netEnergyMeritCredited += amount;
}

export function isAboveSurface(world: World, x: number, y: number, z: number): boolean {
  return y > world.surfaceMap[z * world.grid.sizeX + x];
}

export function recordFoodPickup(
  world: World,
  material: MaterialId,
  x: number,
  y: number,
  z: number
): boolean {
  if (material !== Material.FOOD) return false;
  const index = voxelIndex(world.grid, x, y, z);
  const alreadyStored = world.storedFood.has(index);
  const recycled = world.recycledFood.has(index);
  const uncreditedExternal =
    world.uncreditedExternalFood.has(index) ||
    (!alreadyStored && !recycled && isAboveSurface(world, x, y, z));
  world.metrics.foodPickedUp += 1;
  if (recycled) {
    world.metrics.recycledFoodEnergyRecovered += ENERGY.foodEnergy;
  } else if (!alreadyStored && isAboveSurface(world, x, y, z)) {
    world.metrics.surfaceFoodEnergyGathered += ENERGY.foodEnergy;
  }
  return uncreditedExternal;
}

/**
 * Per-tick fixed drains (design spec §6): size-scaled basal metabolism,
 * sensor upkeep scaling with the square of sensor gain, and think cost.
 * The climate multiplier (Rule 5 microclimate) scales basal maintenance;
 * sensing and thinking are climate-indifferent.
 */
export function applyBasalDrain(world: World, ant: Ant, thinkCost: number, climate = 1): void {
  const basal = ENERGY.basalPerTick * Math.pow(ant.bodyScale, ENERGY.basalScaleExponent);
  const upkeep = ENERGY.sensorUpkeep * ant.traits.sensorGain * ant.traits.sensorGain;
  const cost = basal * climate + upkeep + thinkCost * ENERGY.thinkCostScale;
  ant.energy -= cost;
  world.metrics.energyBurned += cost;
}

/**
 * Movement cost for the distance moved this tick: leg length buys speed but
 * raises per-step cost; a fuller, larger store slows movement (spec §3.2).
 */
export function applyStepCost(world: World, ant: Ant): void {
  const moved = ant.x !== ant.prevX || ant.y !== ant.prevY || ant.z !== ant.prevZ;
  if (!moved) {
    return;
  }
  const fullness = Math.max(0, ant.energy) / maxEnergy(ant);
  const storagePenalty = 1 + 0.3 * fullness * Math.max(0, ant.traits.storage - 1);
  const base = ENERGY.stepCost * ant.traits.legLength * storagePenalty;
  const cost = base + ENERGY.carryStepCost * (ant.spoilLoads + ant.carriedEggIds.length);
  ant.energy -= cost;
  world.metrics.energyBurned += cost;
}

/**
 * Death check (design spec §6): energy exhaustion or age past the genetic
 * lifespan cap. The corpse persists as edible energy — a FOOD voxel at the
 * death site when it is air.
 */
const DROP_OFFSETS = [
  [0, 0, 0],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1],
  [0, -1, 0],
  [0, 1, 0],
] as const;

/**
 * Place a dropped voxel (corpse, perished brood, a dead ant's carried
 * load) at the first unoccupied AIR spot at or beside the site — never
 * entombing a living ant or an egg inside solid matter. Returns the placed
 * voxel index, or null when there is nowhere to put it.
 */
export function dropMaterialAt(
  world: World,
  x: number,
  y: number,
  z: number,
  material: MaterialId
): number | null {
  for (const [dx, dy, dz] of DROP_OFFSETS) {
    const tx = x + dx;
    const ty = y + dy;
    const tz = z + dz;
    if (getVoxelSafe(world.grid, tx, ty, tz) !== Material.AIR) {
      continue;
    }
    const occupied =
      world.eggIndex.has(voxelIndex(world.grid, tx, ty, tz)) ||
      world.ants.some((a) => a.alive && a.x === tx && a.y === ty && a.z === tz);
    if (!occupied) {
      mutateVoxel(world, tx, ty, tz, material);
      return voxelIndex(world.grid, tx, ty, tz);
    }
  }
  return null;
}

/** Place dropped biomass (corpse, perished brood) as a FOOD voxel. */
export function dropFoodAt(world: World, x: number, y: number, z: number): void {
  const index = dropMaterialAt(world, x, y, z, Material.FOOD);
  if (index !== null) world.recycledFood.add(index);
}

function isEggReleaseSpot(world: World, x: number, y: number, z: number): boolean {
  if (!inBounds(world.grid, x, y, z) || getVoxelSafe(world.grid, x, y, z) !== Material.AIR) {
    return false;
  }
  if (world.eggIndex.has(voxelIndex(world.grid, x, y, z))) {
    return false;
  }
  return !world.ants.some((ant) => ant.alive && ant.x === x && ant.y === y && ant.z === z);
}

function isEggReleaseCandidate(
  world: World,
  spot: { x: number; y: number; z: number },
  dx: number,
  dy: number,
  dz: number,
  radius: number
): boolean {
  const onShell = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) === radius;
  return onShell && isEggReleaseSpot(world, spot.x, spot.y, spot.z);
}

function eggReleaseSpotAtRadius(
  world: World,
  ant: Ant,
  radius: number
): { x: number; y: number; z: number } | null {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const spot = { x: ant.x + dx, y: ant.y + dy, z: ant.z + dz };
        if (isEggReleaseCandidate(world, spot, dx, dy, dz, radius)) {
          return spot;
        }
      }
    }
  }
  return null;
}

/** Find the nearest physical voxel for brood released by a dead carrier. */
function eggReleaseSpot(world: World, ant: Ant): { x: number; y: number; z: number } | null {
  if (isEggReleaseSpot(world, ant.x, ant.y, ant.z)) {
    return { x: ant.x, y: ant.y, z: ant.z };
  }
  for (let radius = 1; radius <= 8; radius++) {
    const spot = eggReleaseSpotAtRadius(world, ant, radius);
    if (spot) {
      return spot;
    }
  }
  return null;
}

/** Ground every live egg carried by an ant before its corpse is placed. */
function releaseCarriedEggs(world: World, ant: Ant): void {
  const ids = new Set(ant.carriedEggIds);
  ant.carriedEggIds.length = 0;
  for (const egg of world.eggs) {
    if (egg.carrierId !== ant.id) {
      continue;
    }
    if (!ids.delete(egg.id)) {
      throw new Error(`egg ${egg.id} names carrier ${ant.id} without a carrier-side link`);
    }
    const spot = eggReleaseSpot(world, ant);
    if (!spot) {
      throw new Error(`no AIR voxel can receive egg ${egg.id} from dead carrier ${ant.id}`);
    }
    egg.x = spot.x;
    egg.y = spot.y;
    egg.z = spot.z;
    egg.carrierId = null;
    world.eggIndex.set(voxelIndex(world.grid, egg.x, egg.y, egg.z), egg);
  }
  if (ids.size > 0) {
    throw new Error(`carrier ${ant.id} names missing eggs: ${[...ids].join(",")}`);
  }
}

function dropCarriedLoad(world: World, ant: Ant): void {
  const carried = ant.carrying as MaterialId | null;
  if (carried === null) return;
  for (let index = 0; index < ant.spoilLoads; index++) {
    const placed = dropMaterialAt(world, ant.x, ant.y, ant.z, carried);
    if (carried === Material.FOOD && placed !== null) {
      world.storedFood.add(placed);
      if (index < ant.uncreditedFoodLoads) world.uncreditedExternalFood.add(placed);
    }
  }
  ant.spoilLoads = 0;
  ant.carryLoad = 0;
  ant.carrying = null;
  ant.uncreditedFoodLoads = 0;
}

/**
 * Kill an ant in place: the corpse persists as edible energy (spec §6),
 * and anything it was carrying returns to the world — matter is conserved
 * across death, not silently destroyed with the carrier.
 */
export function killAnt(world: World, ant: Ant): void {
  if (!ant.alive) {
    return;
  }
  ant.alive = false;
  recordAntDeath(world, ant);
  if (ant.sex === SEX_MALE) {
    world.metrics.maleDeaths += 1;
    world.metrics.maleEnergyRemovedAtDeath += ant.energy;
  } else {
    world.metrics.workerDeaths += 1;
    world.metrics.workerEnergyRemovedAtDeath += ant.energy;
  }
  releaseCarriedEggs(world, ant);
  dropCarriedLoad(world, ant);
  dropFoodAt(world, ant.x, ant.y, ant.z);
}

export function checkDeath(world: World, ant: Ant): void {
  const lifespan =
    ant.sex === SEX_MALE
      ? Math.round(ant.traits.lifespanTicks * MALE.lifespanFraction)
      : ant.traits.lifespanTicks;
  if (ant.energy > 0 && ant.age <= lifespan) {
    return;
  }
  if (ant.sex === SEX_MALE && ant.energy <= 0) {
    world.metrics.maleEnergyDeaths += 1;
  } else if (ant.sex === SEX_MALE) {
    world.metrics.maleAgeDeaths += 1;
  } else if (ant.energy <= 0) {
    world.metrics.workerEnergyDeaths += 1;
  } else {
    world.metrics.workerAgeDeaths += 1;
  }
  killAnt(world, ant);
}

/** Remove dead ants from the active array (corpses already dropped). */
export function reapDead(world: World): void {
  if (world.ants.some((ant) => !ant.alive)) {
    world.ants = world.ants.filter((ant) => ant.alive);
  }
}

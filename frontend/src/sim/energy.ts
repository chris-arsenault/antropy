import { SEX_MALE, type Ant } from "./ant";
import { getVoxelSafe, voxelIndex } from "./grid";
import { Material } from "./materials";
import { ENERGY, MALE } from "./tunables";
import { mutateVoxel, type World } from "./world";

export function maxEnergy(ant: Ant): number {
  return ENERGY.max * ant.traits.storage;
}

/**
 * Per-tick fixed drains (design spec §6): size-scaled basal metabolism,
 * sensor upkeep scaling with the square of sensor gain, and think cost.
 * The climate multiplier (Rule 5 microclimate) scales basal maintenance;
 * sensing and thinking are climate-indifferent.
 */
export function applyBasalDrain(ant: Ant, thinkCost: number, climate = 1): void {
  const basal = ENERGY.basalPerTick * Math.pow(ant.bodyScale, ENERGY.basalScaleExponent);
  const upkeep = ENERGY.sensorUpkeep * ant.traits.sensorGain * ant.traits.sensorGain;
  ant.energy -= basal * climate + upkeep + thinkCost;
}

/**
 * Movement cost for the distance moved this tick: leg length buys speed but
 * raises per-step cost; a fuller, larger store slows movement (spec §3.2).
 */
export function applyStepCost(ant: Ant): void {
  const moved = ant.x !== ant.prevX || ant.y !== ant.prevY || ant.z !== ant.prevZ;
  if (!moved) {
    return;
  }
  const fullness = Math.max(0, ant.energy) / maxEnergy(ant);
  const storagePenalty = 1 + 0.3 * fullness * Math.max(0, ant.traits.storage - 1);
  const base = ENERGY.stepCost * ant.traits.legLength * storagePenalty;
  ant.energy -= base + ENERGY.carryStepCost * ant.spoilLoads;
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
 * Place dropped biomass (corpse, perished brood) as a FOOD voxel at the
 * first unoccupied AIR spot at or beside the site — never entombing a
 * living ant or an egg inside solid matter.
 */
export function dropFoodAt(world: World, x: number, y: number, z: number): void {
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
      mutateVoxel(world, tx, ty, tz, Material.FOOD);
      return;
    }
  }
}

/** Kill an ant in place: the corpse persists as edible energy (spec §6). */
export function killAnt(world: World, ant: Ant): void {
  ant.alive = false;
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
  killAnt(world, ant);
}

/** Remove dead ants from the active array (corpses already dropped). */
export function reapDead(world: World): void {
  if (world.ants.some((ant) => !ant.alive)) {
    world.ants = world.ants.filter((ant) => ant.alive);
  }
}

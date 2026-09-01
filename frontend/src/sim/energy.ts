import { type Ant } from "./ant";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { ENERGY } from "./tunables";
import { mutateVoxel, type World } from "./world";

export function maxEnergy(ant: Ant): number {
  return ENERGY.max * ant.traits.storage;
}

/**
 * Per-tick fixed drains (design spec §6): size-scaled basal metabolism,
 * sensor upkeep scaling with the square of sensor gain, and think cost.
 */
export function applyBasalDrain(ant: Ant, thinkCost: number): void {
  const basal = ENERGY.basalPerTick * Math.pow(ant.bodyScale, ENERGY.basalScaleExponent);
  const upkeep = ENERGY.sensorUpkeep * ant.traits.sensorGain * ant.traits.sensorGain;
  ant.energy -= basal + upkeep + thinkCost;
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
export function checkDeath(world: World, ant: Ant): void {
  if (ant.energy > 0 && ant.age <= ant.traits.lifespanTicks) {
    return;
  }
  ant.alive = false;
  if (getVoxelSafe(world.grid, ant.x, ant.y, ant.z) === Material.AIR) {
    mutateVoxel(world, ant.x, ant.y, ant.z, Material.FOOD);
  }
}

/** Remove dead ants from the active array (corpses already dropped). */
export function reapDead(world: World): void {
  if (world.ants.some((ant) => !ant.alive)) {
    world.ants = world.ants.filter((ant) => ant.alive);
  }
}

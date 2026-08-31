import { type Ant } from "./ant";
import { getVoxelSafe } from "./grid";
import { Material } from "./materials";
import { ENERGY } from "./tunables";
import { mutateVoxel, type World } from "./world";

/** Per-tick fixed drains (design spec §6): basal metabolism + sensor upkeep. */
export function applyBasalDrain(ant: Ant, thinkCost: number): void {
  const basal = ENERGY.basalPerTick * Math.pow(ant.bodyScale, ENERGY.basalScaleExponent);
  ant.energy -= basal + ENERGY.sensorUpkeep + thinkCost;
}

/** Movement cost for the distance moved this tick. */
export function applyStepCost(ant: Ant): void {
  const moved = ant.x !== ant.prevX || ant.y !== ant.prevY || ant.z !== ant.prevZ;
  if (!moved) {
    return;
  }
  ant.energy -= ENERGY.stepCost + (ant.carrying !== null ? ENERGY.carryStepCost : 0);
}

/**
 * Death check (design spec §6): energy exhaustion or age-out. The corpse
 * persists as edible energy — a FOOD voxel at the death site when it is air.
 */
export function checkDeath(world: World, ant: Ant): void {
  if (ant.energy > 0 && ant.age <= ENERGY.ageCap) {
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

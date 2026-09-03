import { SEX_MALE, type Ant } from "../ant";
import { type Colony } from "../colony";
import { Input, Output } from "../controller/contract";
import { Material } from "../materials";
import { voxelIndex } from "../grid";
import { type World } from "../world";
import { guardBrood, sensorOracle, steer, turnToward, type OraclePolicy } from "./policies";

/**
 * Tournament strategies (Appendix B §B.8): the same rung-2 forager with
 * different answers to "where do the colony's assets sit?" Surface life
 * stays survivable-but-inferior (Rule 6); the ordering rides on asset
 * placement — brood incubating in a stable microclimate, hoards out of
 * the rain — not on adult death.
 *
 * O-surface  : queen and hoard in the open (harness places the queen in
 *              the depression); brood and pile pay the exposure/rain
 *              liabilities.
 * O-shelter  : founding chamber as-is; hoards inside; retreats during
 *              extremes.
 * O-architect: identical policy — the harness extends the shaft into a
 *              deep brood vault below the chamber and the queen descends
 *              with it. Only the built asset differs (Rule 7).
 */
export type CacheSite = "surface" | "chamber";

export interface StrategyOptions {
  cacheSite: CacheSite;
  retreat: boolean;
}

/** STRESS input above which retreaters head below (multiplier ~4.2):
 * genuine extremes only — spring middays stay workable. */
const RETREAT_ABOVE = 0.35;
/** Crop level beyond which carried food goes to the hoard. Sits at the
 * queen's worker-egg affordability floor (~2.2) so surplus splits between
 * brood and stores instead of brood eating all of it. */
const CACHE_AFTER = 2;
/** Ants pick food up for the hoard above this energy once the crop is full. */
const HOARD_PICKUP_ABOVE = 0.6;

function withVertical(outputs: Float32Array, bias: number): Float32Array {
  outputs[Output.VERTICAL_BIAS] = bias;
  return outputs;
}

/** Distance-scaled approach: slow near the target so exact tiles converge. */
function approach(ant: Ant, x: number, z: number): Float32Array {
  const dist = Math.max(Math.abs(ant.x - x), Math.abs(ant.z - z));
  const forward = Math.min(1, Math.max(0.15, dist / 6));
  return steer(turnToward(ant, x, z), forward);
}

function airBelow(world: World, ant: Ant): boolean {
  return (
    ant.y > 1 && world.grid.data[voxelIndex(world.grid, ant.x, ant.y - 1, ant.z)] === Material.AIR
  );
}

function underground(world: World, ant: Ant): boolean {
  return ant.y < world.surfaceMap[ant.z * world.grid.sizeX + ant.x];
}

/** Climb out of any workings: converge on the entrance column, ascend. */
function surfaceMove(ant: Ant, colony: Colony): Float32Array {
  return withVertical(steer(turnToward(ant, colony.x, colony.z), 0.4), 1);
}

interface CacheSpot {
  x: number;
  z: number;
  descend: boolean;
}

function cacheSpot(site: CacheSite, colony: Colony): CacheSpot {
  if (site === "surface") {
    return { x: colony.x + 5, z: colony.z, descend: false };
  }
  return { x: colony.x, z: colony.z, descend: true };
}

function atSpot(ant: Ant, spot: CacheSpot): boolean {
  return Math.abs(ant.x - spot.x) <= 1 && Math.abs(ant.z - spot.z) <= 1;
}

/**
 * Travel to the hoard spot, descend if it is underground, and deposit the
 * carried food (upward stance so tryDig cannot pick anything up and falls
 * through to depositing; inside nest reach the crop absorbs it first).
 */
function hoardTrip(world: World, ant: Ant, spot: CacheSpot): Float32Array {
  if (!atSpot(ant, spot)) {
    return withVertical(approach(ant, spot.x, spot.z), spot.descend ? -1 : 0);
  }
  if (spot.descend && airBelow(world, ant)) {
    return withVertical(steer(0, 0.3), -1);
  }
  const outputs = steer(0.4, 0.2);
  outputs[Output.VERTICAL_BIAS] = 1;
  outputs[Output.DIG] = 1;
  return outputs;
}

/** Wait out an extreme below: converge on the queen, where crop feeding
 * reaches; idle (eating from any adjacent hoard) at the bottom. */
function retreatMove(world: World, ant: Ant, colony: Colony, inputs: Float32Array): Float32Array {
  if (Math.max(Math.abs(ant.x - colony.x), Math.abs(ant.z - colony.z)) > 1) {
    return withVertical(approach(ant, colony.x, colony.z), -1);
  }
  if (airBelow(world, ant)) {
    return withVertical(steer(0, 0.3), -1);
  }
  const outputs = steer(0, 0);
  outputs[Output.EAT] = 1;
  return guardBrood(inputs, outputs);
}

/** Hoard logistics: carry surplus to the cache, or pick surplus up for
 * it. Null when neither applies. */
function hoardBehavior(
  world: World,
  ant: Ant,
  inputs: Float32Array,
  colony: Colony,
  spot: CacheSpot
): Float32Array | null {
  if (colony.stockpile <= CACHE_AFTER) {
    return null;
  }
  if (ant.carrying === Material.FOOD) {
    return hoardTrip(world, ant, spot);
  }
  if (ant.carrying === null && ant.energy > HOARD_PICKUP_ABOVE && inputs[Input.CONTACT_FOOD] > 0) {
    const outputs = steer(0, 0.1);
    outputs[Output.DIG] = 1; // pick the meal up for the hoard instead
    return outputs;
  }
  return null;
}

export function makeStrategy(opts: StrategyOptions): OraclePolicy {
  return (world, ant, inputs) => {
    if (ant.sex === SEX_MALE) {
      return steer(0.2, 0.5);
    }
    const colony = world.colonies.find((c) => c.id === ant.lineageId);
    if (!colony) {
      return sensorOracle(world, ant, inputs);
    }
    const spot = cacheSpot(opts.cacheSite, colony);
    const hoarding = hoardBehavior(world, ant, inputs, colony, spot);
    if (hoarding !== null) {
      return hoarding;
    }
    const blindAndHot =
      inputs[Input.TEMPERATURE] > RETREAT_ABOVE &&
      inputs[Input.FOOD_SCENT_LEFT] + inputs[Input.FOOD_SCENT_RIGHT] < 0.05;
    if (opts.retreat && blindAndHot) {
      return retreatMove(world, ant, colony, inputs);
    }
    if (underground(world, ant)) {
      // Blind foraging cannot climb out of workings; surface first.
      return surfaceMove(ant, colony);
    }
    return sensorOracle(world, ant, inputs);
  };
}

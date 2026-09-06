import { type Ant } from "../ant";
import { Output, OUTPUT_COUNT } from "../controller/contract";
import { getVoxelSafe, voxelIndex } from "../grid";
import { Material } from "../materials";
import { headingToDirection, verticalBandOffset } from "../movement";
import { type World } from "../world";
import {
  coordinates,
  foodField,
  HORIZONTAL_DIRECTIONS,
  nextMove,
  plannerFor,
  refreshPlanner,
  type PathPoint,
  type PlannedMove,
  type Planner,
} from "./omniscientPlanner";

const OUT = new Float32Array(OUTPUT_COUNT);

function aligned(ant: Ant, dx: number, dz: number): boolean {
  if (dx === 0 && dz === 0) return true;
  const facing = headingToDirection(ant.heading);
  return facing.dx === dx && facing.dz === dz;
}

function desiredBand(dx: number, dy: number, dz: number): -1 | 0 | 1 {
  if (dx === 0 && dz === 0) return dy < 0 ? -1 : 1;
  if (dy > 0) return 1;
  return 0;
}

function pointToward(ant: Ant, dx: number, dz: number): void {
  if (dx === 0 && dz === 0) return;
  let relative = Math.atan2(dz, dx) - ant.heading;
  relative = ((relative + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (relative < -Math.PI) relative += 2 * Math.PI;
  OUT[Output.TURN] = Math.max(-1, Math.min(1, relative / (Math.PI / 4)));
}

function issueMove(ant: Ant, move: PlannedMove): void {
  const { dx, dz, band } = move;
  OUT[Output.VERTICAL_BIAS] = band;
  pointToward(ant, dx, dz);
  if (aligned(ant, dx, dz) && verticalBandOffset(ant.verticalAttention) === band) {
    // Charge exactly one lattice step. Full thrust can leave a fast ant with
    // another whole step banked, which carries it past the planned waypoint
    // on the following tick even after the oracle has stopped thrusting.
    OUT[Output.FORWARD] = Math.min(1, 1 / ant.traits.legLength);
  }
}

function faceFood(world: World, ant: Ant, food: number): boolean {
  if (world.grid.data[food] !== Material.FOOD) return false;
  const point = coordinates(world, food);
  const dx = point.x - ant.x;
  const dy = point.y - ant.y;
  const dz = point.z - ant.z;
  const band = desiredBand(dx, dy, dz);
  OUT[Output.VERTICAL_BIAS] = band;
  pointToward(ant, dx, dz);
  if (!aligned(ant, dx, dz) || verticalBandOffset(ant.verticalAttention) !== band) return true;
  OUT[Output.DIG] = 1;
  return true;
}

function seekFood(world: World, ant: Ant, planner: Planner): void {
  let field = foodField(world, planner);
  const current = voxelIndex(world.grid, ant.x, ant.y, ant.z);
  if (field.distance[current] === 0) {
    if (!faceFood(world, ant, field.target[current])) planner.externalFood = null;
    return;
  }
  let move = nextMove(world, field, current);
  if (move === null && refreshPlanner(world, planner)) {
    field = foodField(world, planner);
    move = nextMove(world, field, current);
  }
  if (move !== null) issueMove(ant, move);
}

function availableDepositTarget(world: World, ant: Ant, x: number, y: number, z: number): boolean {
  if (getVoxelSafe(world.grid, x, y, z) !== Material.AIR) return false;
  const index = voxelIndex(world.grid, x, y, z);
  if (world.eggIndex.has(index)) return false;
  return !world.ants.some(
    (other) => other.id !== ant.id && other.alive && other.x === x && other.y === y && other.z === z
  );
}

function depositAtHome(world: World, ant: Ant): boolean {
  // Keep the target stable while the ant turns. Including the tick here makes
  // the target orbit the ant faster than its heading can converge.
  const start = ant.id % HORIZONTAL_DIRECTIONS.length;
  for (let offset = 0; offset < HORIZONTAL_DIRECTIONS.length; offset++) {
    const [dx, dz] = HORIZONTAL_DIRECTIONS[(start + offset) % HORIZONTAL_DIRECTIONS.length];
    // Use the chamber volume above the walking plane. Horizontal rings turn
    // FOOD into an eight-voxel cage around the depositor; an upper cache
    // preserves a traversable floor and lets throughput continue.
    if (!availableDepositTarget(world, ant, ant.x + dx, ant.y + 1, ant.z + dz)) continue;
    OUT[Output.VERTICAL_BIAS] = 1;
    pointToward(ant, dx, dz);
    if (aligned(ant, dx, dz) && verticalBandOffset(ant.verticalAttention) === 1) {
      OUT[Output.DIG] = 1;
    }
    return true;
  }
  return false;
}

function actAtHome(world: World, ant: Ant): void {
  if (depositAtHome(world, ant)) return;
  OUT[Output.TURN] = ant.id % 2 === 0 ? 0.8 : -0.8;
  OUT[Output.FORWARD] = 1;
  OUT[Output.VERTICAL_BIAS] = 0;
}

function carryHome(world: World, ant: Ant, planner: Planner): void {
  refreshPlanner(world, planner);
  const current = voxelIndex(world.grid, ant.x, ant.y, ant.z);
  if (planner.home.distance[current] === 0) {
    actAtHome(world, ant);
    return;
  }
  let move = nextMove(world, planner.home, current);
  if (move === null && refreshPlanner(world, planner)) {
    if (planner.home.distance[current] === 0) {
      actAtHome(world, ant);
      return;
    }
    move = nextMove(world, planner.home, current);
  }
  if (move !== null) issueMove(ant, move);
}

export interface OmniscientForagerOptions {
  /** Legal stances inside the nest from which the ant may deposit food. */
  readonly homeGoals: readonly PathPoint[];
}

export type OmniscientForagerPolicy = (
  world: World,
  ant: Ant,
  inputs: Float32Array
) => Float32Array;

/**
 * A deliberately privileged diagnostic. It reads every food coordinate and
 * the complete traversable topology, then drives the ordinary turn, thrust,
 * vertical-band, and mandible outputs one planned lattice step at a time.
 */
export function makeOmniscientForager(
  options: OmniscientForagerOptions | null = null
): OmniscientForagerPolicy {
  return (world, ant) => {
    OUT.fill(0);
    const planner = plannerFor(world, options?.homeGoals);
    if (ant.carrying === Material.FOOD) carryHome(world, ant, planner);
    else seekFood(world, ant, planner);
    return OUT;
  };
}

/** Historical harness ceiling: defaults to the open surface receiving area. */
export const pathingCeilingOracle = makeOmniscientForager();

import { type Ant } from "../ant";
import { type Colony, type Sperm } from "../colony";
import { Output } from "../controller/contract";
import { getVoxelSafe } from "../grid";
import { Material } from "../materials";
import { headingToDirection } from "../movement";
import { COLONY } from "../tunables";
import { type World } from "../world";
import { steer, turnToward, type OraclePolicy } from "./policies";

export interface BroodPosition {
  x: number;
  y: number;
  z: number;
}

export interface BroodCarrierOptions {
  /** O-layer destination policy. It may inspect the world but never mutates it. */
  destination: BroodPosition | ((world: World, ant: Ant, eggId: number) => BroodPosition | null);
  /** Exact transit cells traversed in order while seeking grounded brood. */
  unloadedWaypoints: readonly BroodPosition[];
  /** Exact transit cells traversed in order while loaded. */
  loadedWaypoints: readonly BroodPosition[];
}

/** O-layer placement for Appendix D step 10a; no terrain is authored here. */
export function placeQueenInNest(world: World, x: number, y: number, z: number): Colony {
  if (getVoxelSafe(world.grid, x, y, z) !== Material.AIR) {
    throw new Error(`queen placement is not AIR at (${x},${y},${z})`);
  }
  const sperm: Sperm[] = [];
  for (let i = 0; i < COLONY.spermCount; i++) {
    sperm.push({ genome: world.controller.seed(world.rng), patrilineId: i + 1 });
  }
  const colony: Colony = {
    id: world.nextColonyId++,
    x,
    y,
    z,
    queenGenome: world.controller.seed(world.rng),
    queenAge: 0,
    queenLifespanTicks: COLONY.queenLifespanTicks,
    sperm,
    stockpile: COLONY.foundingStockpile,
    patrilineDeliveries: new Map(),
    nextPatrilineId: sperm.length + 1,
    lastEggTick: 0,
    lastQueenEggTick: 0,
    starvingSince: -1,
  };
  world.colonies.push(colony);
  return colony;
}

function distance(ant: Ant, target: BroodPosition): number {
  return Math.max(
    Math.abs(ant.x - target.x),
    Math.abs(ant.y - target.y),
    Math.abs(ant.z - target.z)
  );
}

function atPosition(ant: Ant, target: BroodPosition): boolean {
  return ant.x === target.x && ant.y === target.y && ant.z === target.z;
}

function moveTo(ant: Ant, target: BroodPosition): Float32Array {
  if (ant.x === target.x && ant.z === target.z && ant.y !== target.y) {
    const outputs = steer(0, 0.7);
    outputs[Output.VERTICAL_BIAS] = target.y > ant.y ? 1 : -1;
    return outputs;
  }
  return steer(turnToward(ant, target.x, target.z), 0.7);
}

function isFaced(ant: Ant, target: BroodPosition): boolean {
  const { dx, dz } = headingToDirection(ant.heading);
  return ant.x + dx === target.x && ant.y === target.y && ant.z + dz === target.z;
}

function approachForMandibles(ant: Ant, target: BroodPosition): Float32Array {
  if (ant.x === target.x && ant.z === target.z && target.y === ant.y - 1) {
    const outputs = steer(0, 0);
    outputs[Output.VERTICAL_BIAS] = -1;
    outputs[Output.DIG] = 1;
    return outputs;
  }
  if (ant.y !== target.y) {
    return moveTo(ant, target);
  }
  const adjacent = distance(ant, target) === 1;
  const outputs = steer(turnToward(ant, target.x, target.z), adjacent ? 0 : 0.7);
  if (adjacent && isFaced(ant, target)) {
    outputs[Output.DIG] = 1;
  }
  return outputs;
}

function nearestGroundedEgg(world: World, ant: Ant, delivered: ReadonlySet<number>) {
  return world.eggs
    .filter((egg) => egg.carrierId === null && !delivered.has(egg.id))
    .sort((a, b) => distance(ant, a) - distance(ant, b) || a.id - b.id)[0];
}

function destinationFor(
  options: BroodCarrierOptions,
  world: World,
  ant: Ant,
  eggId: number
): BroodPosition | null {
  return typeof options.destination === "function"
    ? options.destination(world, ant, eggId)
    : options.destination;
}

interface BroodOracleState {
  delivered: Set<number>;
  cargoByAnt: Map<number, number>;
  loadedWaypointByAnt: Map<number, number>;
  unloadedWaypointByAnt: Map<number, number>;
}

function nextWaypoint(
  ant: Ant,
  waypoints: readonly BroodPosition[],
  progress: Map<number, number>
): BroodPosition | null {
  let index = progress.get(ant.id) ?? 0;
  while (index < waypoints.length && atPosition(ant, waypoints[index])) {
    index += 1;
  }
  progress.set(ant.id, index);
  return waypoints[index] ?? null;
}

function seekBrood(
  options: BroodCarrierOptions,
  state: BroodOracleState,
  world: World,
  ant: Ant
): Float32Array {
  const previousCargo = state.cargoByAnt.get(ant.id);
  if (previousCargo !== undefined) {
    state.delivered.add(previousCargo);
    state.cargoByAnt.delete(ant.id);
    state.unloadedWaypointByAnt.set(ant.id, 0);
  }
  const waypoint = nextWaypoint(ant, options.unloadedWaypoints, state.unloadedWaypointByAnt);
  if (waypoint) {
    return moveTo(ant, waypoint);
  }
  const egg = nearestGroundedEgg(world, ant, state.delivered);
  return egg ? approachForMandibles(ant, egg) : steer(0, 0);
}

function carryBrood(
  options: BroodCarrierOptions,
  state: BroodOracleState,
  world: World,
  ant: Ant,
  eggId: number
): Float32Array {
  if (state.cargoByAnt.get(ant.id) !== eggId) {
    state.cargoByAnt.set(ant.id, eggId);
    state.loadedWaypointByAnt.set(ant.id, 0);
  }
  const waypoint = nextWaypoint(ant, options.loadedWaypoints, state.loadedWaypointByAnt);
  if (waypoint) {
    return moveTo(ant, waypoint);
  }
  const destination = destinationFor(options, world, ant, eggId);
  return destination ? approachForMandibles(ant, destination) : steer(0, 0);
}

/**
 * Appendix D step-10c transport oracle. Coordinates choose intent in the
 * O-layer; movement and the shared DIG actuator perform every world change.
 */
export function makeBroodCarrier(options: BroodCarrierOptions): OraclePolicy {
  const state: BroodOracleState = {
    delivered: new Set(),
    cargoByAnt: new Map(),
    loadedWaypointByAnt: new Map(),
    unloadedWaypointByAnt: new Map(),
  };
  return (world, ant) => {
    const eggId = ant.carriedEggIds[0];
    return eggId === undefined
      ? seekBrood(options, state, world, ant)
      : carryBrood(options, state, world, ant, eggId);
  };
}

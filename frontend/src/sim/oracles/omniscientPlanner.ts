import { getVoxelSafe, inBounds, voxelIndex } from "../grid";
import { Material } from "../materials";
import { isLegalPosition, stepCandidates } from "../movement";
import { COLONY } from "../tunables";
import { type World } from "../world";

export interface PathPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface PathField {
  readonly distance: Int32Array;
  readonly target: Int32Array;
}

export interface Planner {
  legal: Uint8Array;
  home: PathField;
  externalFood: PathField | null;
  externalFoodCount: number;
  storedFoodCount: number;
  readonly homeGoals: readonly PathPoint[];
}

export type MotorBand = -1 | 0 | 1;

export interface PlannedMove {
  readonly dx: number;
  readonly dz: number;
  readonly band: MotorBand;
  readonly distance: number;
}

const PLANNERS = new WeakMap<World, Planner>();
const OFFSETS: readonly (readonly [number, number, number])[] = (() => {
  const result: [number, number, number][] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 || dy !== 0 || dz !== 0) result.push([dx, dy, dz]);
      }
    }
  }
  return result;
})();
export const HORIZONTAL_DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];
const MOTOR_BANDS: readonly MotorBand[] = [-1, 0, 1];

export function coordinates(world: World, index: number): { x: number; y: number; z: number } {
  const x = index % world.grid.sizeX;
  const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
  const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
  return { x, y, z };
}

export function legalMaskFor(world: World): Uint8Array {
  const legal = new Uint8Array(world.grid.data.length);
  for (let y = 0; y < world.grid.sizeY; y++) {
    for (let z = 0; z < world.grid.sizeZ; z++) {
      for (let x = 0; x < world.grid.sizeX; x++) {
        if (isLegalPosition(world.grid, x, y, z)) {
          legal[voxelIndex(world.grid, x, y, z)] = 1;
        }
      }
    }
  }
  return legal;
}

function addGoal(
  field: PathField,
  queue: Int32Array,
  write: number,
  at: number,
  target: number
): number {
  if (field.distance[at] >= 0) return write;
  field.distance[at] = 0;
  field.target[at] = target;
  queue[write] = at;
  return write + 1;
}

function motorDestination(
  world: World,
  current: { x: number; y: number; z: number },
  dx: number,
  dz: number,
  band: MotorBand
): number | null {
  const heading = Math.atan2(dz, dx);
  for (const candidate of stepCandidates(heading, band)) {
    const x = current.x + candidate.dx;
    const y = current.y + candidate.dy;
    const z = current.z + candidate.dz;
    if (isLegalPosition(world.grid, x, y, z)) {
      return voxelIndex(world.grid, x, y, z);
    }
  }
  return null;
}

/** Resolve the lattice destination chosen by a planned motor command. */
export function destinationForMove(
  world: World,
  current: number,
  move: Pick<PlannedMove, "dx" | "dz" | "band">
): number | null {
  return motorDestination(world, coordinates(world, current), move.dx, move.dz, move.band);
}

function canMotorReach(
  world: World,
  point: { x: number; y: number; z: number },
  target: number
): boolean {
  for (const [dx, dz] of HORIZONTAL_DIRECTIONS) {
    for (const band of MOTOR_BANDS) {
      if (motorDestination(world, point, dx, dz, band) === target) return true;
    }
  }
  return false;
}

function visitNeighbors(
  world: World,
  legal: Uint8Array,
  field: PathField,
  queue: Int32Array,
  current: number,
  write: number
): number {
  const point = coordinates(world, current);
  for (const [dx, dy, dz] of OFFSETS) {
    const x = point.x + dx;
    const y = point.y + dy;
    const z = point.z + dz;
    if (!inBounds(world.grid, x, y, z)) continue;
    const next = voxelIndex(world.grid, x, y, z);
    if (legal[next] === 0 || field.distance[next] >= 0) continue;
    if (!canMotorReach(world, { x, y, z }, current)) continue;
    field.distance[next] = field.distance[current] + 1;
    field.target[next] = field.target[current];
    queue[write++] = next;
  }
  return write;
}

function fillField(
  world: World,
  legal: Uint8Array,
  field: PathField,
  queue: Int32Array,
  write: number
): void {
  let read = 0;
  while (read < write) {
    write = visitNeighbors(world, legal, field, queue, queue[read++], write);
  }
}

function emptyField(world: World): PathField {
  const distance = new Int32Array(world.grid.data.length);
  const target = new Int32Array(world.grid.data.length);
  distance.fill(-1);
  target.fill(-1);
  return { distance, target };
}

function addNavigationGoals(
  world: World,
  legal: Uint8Array,
  field: PathField,
  queue: Int32Array,
  goals: readonly PathPoint[]
): number {
  let write = 0;
  for (const goal of goals) {
    if (!inBounds(world.grid, goal.x, goal.y, goal.z)) continue;
    const at = voxelIndex(world.grid, goal.x, goal.y, goal.z);
    if (legal[at] !== 0) write = addGoal(field, queue, write, at, at);
  }
  return write;
}

/** Build a legal-motor distance field for an authored physical carrier. */
export function pathFieldForGoals(
  world: World,
  legal: Uint8Array,
  goals: readonly PathPoint[]
): PathField {
  const field = emptyField(world);
  const queue = new Int32Array(world.grid.data.length);
  const write = addNavigationGoals(world, legal, field, queue, goals);
  fillField(world, legal, field, queue, write);
  return field;
}

function horizontalAirCount(world: World, x: number, y: number, z: number): number {
  let count = 0;
  for (const [dx, dz] of HORIZONTAL_DIRECTIONS) {
    if (getVoxelSafe(world.grid, x + dx, y, z + dz) === Material.AIR) count += 1;
  }
  return count;
}

function openHomeGoal(world: World, legal: Uint8Array, x: number, y: number, z: number): number {
  if (!inBounds(world.grid, x, y, z)) return -1;
  const at = voxelIndex(world.grid, x, y, z);
  return legal[at] !== 0 && horizontalAirCount(world, x, y, z) >= 3 ? at : -1;
}

function addHomeGoals(
  world: World,
  legal: Uint8Array,
  field: PathField,
  queue: Int32Array,
  goals: readonly PathPoint[]
): number {
  let write = 0;
  for (const goal of goals) {
    const at = openHomeGoal(world, legal, goal.x, goal.y, goal.z);
    if (at >= 0 && hasDepositSpace(world, goal)) write = addGoal(field, queue, write, at, at);
  }
  return write;
}

function hasDepositSpace(world: World, goal: PathPoint): boolean {
  return HORIZONTAL_DIRECTIONS.some(([dx, dz]) => {
    const x = goal.x + dx;
    const y = goal.y + 1;
    const z = goal.z + dz;
    if (getVoxelSafe(world.grid, x, y, z) !== Material.AIR) return false;
    const at = voxelIndex(world.grid, x, y, z);
    return (
      !world.eggIndex.has(at) &&
      !world.ants.some((ant) => ant.x === x && ant.y === y && ant.z === z)
    );
  });
}

function surfaceHomeGoals(world: World): PathPoint[] {
  const colony = world.colonies[0];
  if (!colony) return [];
  const surface = world.surfaceMap[colony.z * world.grid.sizeX + colony.x];
  const goals: PathPoint[] = [];
  for (let z = colony.z - COLONY.restockRadius; z <= colony.z + COLONY.restockRadius; z++) {
    for (let x = colony.x - COLONY.restockRadius; x <= colony.x + COLONY.restockRadius; x++) {
      goals.push({ x, y: surface + 1, z });
    }
  }
  return goals;
}

function buildHomeField(
  world: World,
  legal: Uint8Array,
  homeGoals: readonly PathPoint[]
): PathField {
  const field = emptyField(world);
  const queue = new Int32Array(world.grid.data.length);
  const write = addHomeGoals(world, legal, field, queue, homeGoals);
  fillField(world, legal, field, queue, write);
  return field;
}

function targetableFoodNeighbor(dx: number, dy: number, dz: number): boolean {
  if (dy > 0 && dx === 0 && dz === 0) return false;
  return dx !== 0 || dz !== 0 || dy < 0;
}

function addFoodNeighbors(
  world: World,
  legal: Uint8Array,
  field: PathField,
  queue: Int32Array,
  write: number,
  food: number
): number {
  const point = coordinates(world, food);
  for (const [dx, dy, dz] of OFFSETS) {
    if (!targetableFoodNeighbor(-dx, -dy, -dz)) continue;
    const x = point.x + dx;
    const y = point.y + dy;
    const z = point.z + dz;
    if (!inBounds(world.grid, x, y, z)) continue;
    const at = voxelIndex(world.grid, x, y, z);
    if (legal[at] !== 0) write = addGoal(field, queue, write, at, food);
  }
  return write;
}

export function pathFieldForFood(
  world: World,
  legal: Uint8Array,
  foods: ReadonlySet<number>
): PathField {
  const field = emptyField(world);
  const queue = new Int32Array(world.grid.data.length);
  let write = 0;
  for (const food of foods) {
    if (world.storedFood.has(food)) continue;
    write = addFoodNeighbors(world, legal, field, queue, write, food);
  }
  fillField(world, legal, field, queue, write);
  return field;
}

function buildFoodField(world: World, legal: Uint8Array): PathField {
  return pathFieldForFood(world, legal, world.foodSources);
}

function externalFoodCount(world: World): number {
  return world.foodSources.size - world.storedFood.size;
}

export function plannerFor(world: World, requestedGoals?: readonly PathPoint[]): Planner {
  const existing = PLANNERS.get(world);
  if (existing) return existing;
  const legal = legalMaskFor(world);
  const homeGoals = requestedGoals ?? surfaceHomeGoals(world);
  const planner = {
    legal,
    home: buildHomeField(world, legal, homeGoals),
    externalFood: null,
    externalFoodCount: externalFoodCount(world),
    storedFoodCount: world.storedFood.size,
    homeGoals,
  };
  PLANNERS.set(world, planner);
  return planner;
}

export function refreshPlanner(world: World, planner: Planner): boolean {
  if (planner.storedFoodCount === world.storedFood.size) return false;
  planner.legal = legalMaskFor(world);
  planner.home = buildHomeField(world, planner.legal, planner.homeGoals);
  planner.externalFood = null;
  planner.externalFoodCount = externalFoodCount(world);
  planner.storedFoodCount = world.storedFood.size;
  return true;
}

export function foodField(world: World, planner: Planner): PathField {
  const count = externalFoodCount(world);
  if (planner.externalFood && planner.externalFoodCount === count) return planner.externalFood;
  const built = buildFoodField(world, planner.legal);
  planner.externalFood = built;
  planner.externalFoodCount = count;
  return built;
}

function closerMove(
  world: World,
  field: PathField,
  point: { x: number; y: number; z: number },
  move: Omit<PlannedMove, "distance">,
  currentDistance: number,
  best: PlannedMove | null
): PlannedMove | null {
  const destination = motorDestination(world, point, move.dx, move.dz, move.band);
  if (destination === null) return best;
  const distance = field.distance[destination];
  if (distance < 0 || distance >= currentDistance || (best !== null && distance >= best.distance)) {
    return best;
  }
  return { ...move, distance };
}

export function nextMove(world: World, field: PathField, current: number): PlannedMove | null {
  const currentDistance = field.distance[current];
  if (currentDistance <= 0) return null;
  const point = coordinates(world, current);
  let best: PlannedMove | null = null;
  for (const [dx, dz] of HORIZONTAL_DIRECTIONS) {
    for (const band of MOTOR_BANDS) {
      best = closerMove(world, field, point, { dx, dz, band }, currentDistance, best);
    }
  }
  return best;
}

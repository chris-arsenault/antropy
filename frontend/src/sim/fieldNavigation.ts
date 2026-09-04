import { type Ant } from "./ant";
import { getVoxel, inBounds, voxelIndex, type VoxelGrid } from "./grid";
import { Material } from "./materials";
import { isLegalPosition } from "./movement";
import { sampleScent, scentResponse, type ScentField } from "./scent";
import { type World } from "./world";

const FACE_NEIGHBORS = new Int32Array(6);
const ANT_OFFSETS: readonly (readonly [number, number, number])[] = (() => {
  const offsets: [number, number, number][] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 || dy !== 0 || dz !== 0) offsets.push([dx, dy, dz]);
      }
    }
  }
  return offsets;
})();

export interface FieldNavigationFailure {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly reason: "unreachable" | "zero-signal" | "local-maximum";
  readonly value: number;
  readonly bestNeighborValue: number;
  readonly shortestDistance: number;
}

export interface FieldNavigationReport {
  readonly candidates: number;
  readonly reachable: number;
  readonly successful: number;
  readonly successRate: number;
  readonly failures: readonly FieldNavigationFailure[];
  readonly failureCounts: Record<FieldNavigationFailure["reason"], number>;
}

type GradientStep =
  | { readonly ok: true; readonly next: number }
  | { readonly ok: false; readonly reason: FieldNavigationFailure["reason"] };

type GradientResult =
  | { readonly success: true; readonly index: number }
  | {
      readonly success: false;
      readonly index: number;
      readonly reason: FieldNavigationFailure["reason"];
    };

function coordinates(grid: VoxelGrid, index: number): { x: number; y: number; z: number } {
  const x = index % grid.sizeX;
  const z = Math.floor(index / grid.sizeX) % grid.sizeZ;
  const y = Math.floor(index / (grid.sizeX * grid.sizeZ));
  return { x, y, z };
}

function faceNeighbors(grid: VoxelGrid, index: number): number {
  const { x, y, z } = coordinates(grid, index);
  const slab = grid.sizeX * grid.sizeZ;
  let count = 0;
  if (x > 0) FACE_NEIGHBORS[count++] = index - 1;
  if (x < grid.sizeX - 1) FACE_NEIGHBORS[count++] = index + 1;
  if (z > 0) FACE_NEIGHBORS[count++] = index - grid.sizeX;
  if (z < grid.sizeZ - 1) FACE_NEIGHBORS[count++] = index + grid.sizeX;
  if (y > 0) FACE_NEIGHBORS[count++] = index - slab;
  if (y < grid.sizeY - 1) FACE_NEIGHBORS[count++] = index + slab;
  return count;
}

/** Six-face shortest-path distances through the same air graph used by diffusion. */
export function airDistancesFrom(grid: VoxelGrid, goal: number): Int32Array {
  const distances = new Int32Array(grid.data.length);
  distances.fill(-1);
  const queue = new Int32Array(grid.data.length);
  let read = 0;
  let write = 0;
  distances[goal] = 0;
  queue[write++] = goal;
  while (read < write) {
    const current = queue[read++];
    const count = faceNeighbors(grid, current);
    for (let offset = 0; offset < count; offset++) {
      const next = FACE_NEIGHBORS[offset];
      if (distances[next] >= 0 || grid.data[next] !== Material.AIR) continue;
      distances[next] = distances[current] + 1;
      queue[write++] = next;
    }
  }
  return distances;
}

function surfaceStart(
  world: World,
  entrance: { x: number; y: number; z: number },
  surfaceRadius: number,
  dx: number,
  dz: number
): number | null {
  if (dx * dx + dz * dz > surfaceRadius * surfaceRadius) return null;
  const x = entrance.x + dx;
  const z = entrance.z + dz;
  if (x < 0 || x >= world.grid.sizeX || z < 0 || z >= world.grid.sizeZ) return null;
  const y = world.surfaceMap[z * world.grid.sizeX + x] + 1;
  return getVoxel(world.grid, x, y, z) === Material.AIR ? voxelIndex(world.grid, x, y, z) : null;
}

/** Authored cavity voxels plus surface positions in a circular entrance radius. */
export function fieldNavigationStarts(
  world: World,
  entrance: { x: number; y: number; z: number },
  surfaceRadius: number
): number[] {
  const starts = new Set(
    [...world.cavities].filter((index) => world.grid.data[index] === Material.AIR)
  );
  for (let dz = -surfaceRadius; dz <= surfaceRadius; dz++) {
    for (let dx = -surfaceRadius; dx <= surfaceRadius; dx++) {
      const index = surfaceStart(world, entrance, surfaceRadius, dx, dz);
      if (index !== null) starts.add(index);
    }
  }
  return [...starts];
}

function sensedValue(field: ScentField, index: number, owner: number, gain: number): number {
  return scentResponse(sampleScent(field, index, owner), gain);
}

function bestNeighborValue(
  grid: VoxelGrid,
  field: ScentField,
  index: number,
  owner: number,
  gain: number
): number {
  const count = faceNeighbors(grid, index);
  let best = 0;
  for (let offset = 0; offset < count; offset++) {
    const candidate = FACE_NEIGHBORS[offset];
    if (grid.data[candidate] === Material.AIR) {
      best = Math.max(best, sensedValue(field, candidate, owner, gain));
    }
  }
  return best;
}

function nextGreedyStep(
  grid: VoxelGrid,
  field: ScentField,
  distances: Int32Array,
  current: number,
  owner: number,
  gain: number
): GradientStep {
  const currentValue = sensedValue(field, current, owner, gain);
  const count = faceNeighbors(grid, current);
  let bestValue = -1;
  let next = -1;
  for (let offset = 0; offset < count; offset++) {
    const candidate = FACE_NEIGHBORS[offset];
    if (grid.data[candidate] !== Material.AIR) continue;
    const value = sensedValue(field, candidate, owner, gain);
    if (value > bestValue + 1e-7) {
      bestValue = value;
      next = candidate;
    }
  }
  if (bestValue <= currentValue + 1e-7) {
    return {
      ok: false,
      reason: bestValue <= 1e-7 ? "zero-signal" : "local-maximum",
    };
  }
  return { ok: true, next };
}

function followGradient(
  grid: VoxelGrid,
  field: ScentField,
  distances: Int32Array,
  start: number,
  goal: number,
  owner: number,
  gain: number
): GradientResult {
  if (distances[start] < 0) return { success: false, index: start, reason: "unreachable" };
  let current = start;
  while (current !== goal) {
    const step = nextGreedyStep(grid, field, distances, current, owner, gain);
    if (!step.ok) return { success: false, index: current, reason: step.reason };
    current = step.next;
  }
  return { success: true, index: goal };
}

/** Prove whether effective sensor values form a strict path to the source. */
export function analyzeFieldNavigation(
  world: World,
  field: ScentField,
  starts: readonly number[],
  goal: number,
  owner: number,
  gain = 1
): FieldNavigationReport {
  const distances = airDistancesFrom(world.grid, goal);
  const failureCounts = {
    unreachable: 0,
    "zero-signal": 0,
    "local-maximum": 0,
  };
  const failures: FieldNavigationFailure[] = [];
  let successful = 0;
  let reachable = 0;
  for (const start of starts) {
    if (distances[start] >= 0) reachable += 1;
    const result = followGradient(world.grid, field, distances, start, goal, owner, gain);
    if (result.success) {
      successful += 1;
      continue;
    }
    const reason = result.reason;
    failureCounts[reason] += 1;
    if (failures.length >= 20) continue;
    const point = coordinates(world.grid, result.index);
    failures.push({
      ...point,
      reason,
      value: sensedValue(field, result.index, owner, gain),
      bestNeighborValue: bestNeighborValue(world.grid, field, result.index, owner, gain),
      shortestDistance: distances[result.index],
    });
  }
  return {
    candidates: starts.length,
    reachable,
    successful,
    successRate: starts.length === 0 ? 0 : successful / starts.length,
    failures,
    failureCounts,
  };
}

/** Shortest physically legal ant steps from a position into any authored cavity. */
function unseenLegalNeighbor(
  world: World,
  seen: ReadonlySet<number>,
  x: number,
  y: number,
  z: number
): number | null {
  if (!inBounds(world.grid, x, y, z) || !isLegalPosition(world.grid, x, y, z)) return null;
  const index = voxelIndex(world.grid, x, y, z);
  return seen.has(index) ? null : index;
}

export function shortestAntPathToNest(world: World, ant: Ant): number | null {
  const start = voxelIndex(world.grid, ant.x, ant.y, ant.z);
  if (world.cavities.has(start)) return 0;
  const queue = [start];
  const steps = [0];
  const seen = new Set<number>([start]);
  for (let read = 0; read < queue.length; read++) {
    const current = coordinates(world.grid, queue[read]);
    for (const [dx, dy, dz] of ANT_OFFSETS) {
      const x = current.x + dx;
      const y = current.y + dy;
      const z = current.z + dz;
      const next = unseenLegalNeighbor(world, seen, x, y, z);
      if (next === null) continue;
      if (world.cavities.has(next)) return steps[read] + 1;
      seen.add(next);
      queue.push(next);
      steps.push(steps[read] + 1);
    }
  }
  return null;
}

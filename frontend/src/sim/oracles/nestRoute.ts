import { getVoxelSafe, inBounds, voxelIndex } from "../grid";
import { Material } from "../materials";
import { type World } from "../world";
import { type FoodPosition } from "./food";

const LATERALS = [
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
  { dx: 0, dz: -1 },
] as const;

export interface CacheAccess {
  mouth: FoodPosition;
  path: FoodPosition[];
  stance: FoodPosition;
  destination: FoodPosition;
}

function position(world: World, index: number): FoodPosition {
  const slab = world.grid.sizeX * world.grid.sizeZ;
  return {
    x: index % world.grid.sizeX,
    y: Math.floor(index / slab),
    z: Math.floor(index / world.grid.sizeX) % world.grid.sizeZ,
  };
}

function adjacentPositions(origin: FoodPosition): FoodPosition[] {
  return [
    ...LATERALS.map(({ dx, dz }) => ({ x: origin.x + dx, y: origin.y, z: origin.z + dz })),
    { x: origin.x, y: origin.y + 1, z: origin.z },
    { x: origin.x, y: origin.y - 1, z: origin.z },
  ];
}

function entranceCells(world: World): FoodPosition[] {
  return [...world.cavities]
    .map((index) => position(world, index))
    .filter(({ x, y, z }) => {
      const surface = world.surfaceMap[z * world.grid.sizeX + x];
      return y === surface && getVoxelSafe(world.grid, x, y + 1, z) === Material.AIR;
    });
}

function reconstructPath(world: World, parents: Map<number, number | null>, end: number) {
  const path: FoodPosition[] = [];
  let current: number | null = end;
  while (current !== null) {
    path.unshift(position(world, current));
    current = parents.get(current) ?? null;
  }
  return path;
}

interface CavityNeighbor {
  position: FoodPosition;
  index: number;
}

function cavityNeighbors(world: World, origin: FoodPosition): CavityNeighbor[] {
  return adjacentPositions(origin)
    .filter(({ x, y, z }) => inBounds(world.grid, x, y, z))
    .map((neighbor) => ({
      position: neighbor,
      index: voxelIndex(world.grid, neighbor.x, neighbor.y, neighbor.z),
    }))
    .filter(({ index }) => world.cavities.has(index));
}

interface LateralCandidate {
  stance: number;
  destination: number;
  depth: number;
}

function deeperLateral(
  world: World,
  stance: number,
  stancePosition: FoodPosition,
  neighbor: CavityNeighbor,
  best: LateralCandidate | null
): LateralCandidate | null {
  if (neighbor.position.y !== stancePosition.y) {
    return best;
  }
  const { x, y, z } = neighbor.position;
  const depth = world.surfaceMap[z * world.grid.sizeX + x] - y;
  return depth > 0 && (best === null || depth > best.depth)
    ? { stance, destination: neighbor.index, depth }
    : best;
}

function routeFrom(world: World, entrance: FoodPosition): CacheAccess | null {
  const start = voxelIndex(world.grid, entrance.x, entrance.y, entrance.z);
  const parents = new Map<number, number | null>([[start, null]]);
  const queue = [start];
  let best: LateralCandidate | null = null;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const stance = queue[cursor];
    const stancePosition = position(world, stance);
    for (const neighbor of cavityNeighbors(world, stancePosition)) {
      if (!parents.has(neighbor.index)) {
        parents.set(neighbor.index, stance);
        queue.push(neighbor.index);
      }
      best = deeperLateral(world, stance, stancePosition, neighbor, best);
    }
  }
  if (best === null) {
    return null;
  }
  return {
    mouth: { x: entrance.x, y: entrance.y + 1, z: entrance.z },
    path: reconstructPath(world, parents, best.stance),
    stance: position(world, best.stance),
    destination: position(world, best.destination),
  };
}

export function cacheAccess(world: World): CacheAccess | null {
  let best: CacheAccess | null = null;
  for (const entrance of entranceCells(world)) {
    const route = routeFrom(world, entrance);
    if (route && (best === null || route.destination.y < best.destination.y)) {
      best = route;
    }
  }
  return best;
}

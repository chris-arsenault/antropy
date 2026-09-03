import { inBounds, voxelIndex } from "./grid";
import { NEST_CLASSIFIER } from "./tunables";
import { type World } from "./world";

type Cell = { x: number; y: number; z: number };

const NEIGHBORS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1],
  [0, 1, 0],
  [0, -1, 0],
] as const;

const CORRIDOR_BLOCKS = [
  [2, 2, 1],
  [2, 1, 2],
  [1, 2, 2],
] as const;

export interface VoidMetrics {
  kind: "bulge" | "chamber";
  volume: number;
  doorwayCount: number;
  minDepth: number;
  maxDepth: number;
  meanDepth: number;
}

/** Complete descriptive output of the Appendix D shared O-layer classifier. */
export interface NestMorphology {
  cavityVoxels: number;
  corridorVoxels: number;
  nonCorridorVoxels: number;
  branchVoxels: number;
  airDegreeDistribution: number[];
  networkComponentVolumes: number[];
  voids: VoidMetrics[];
}

/** Legacy summary retained for economy traces while callers migrate. */
export interface NestShape {
  volume: number;
  levels: number;
  maxWidth: number;
  branchVoxels: number;
}

export interface Site {
  x: number;
  z: number;
}

function cellFromIndex(world: World, index: number): Cell {
  const x = index % world.grid.sizeX;
  const yz = Math.floor(index / world.grid.sizeX);
  return { x, y: Math.floor(yz / world.grid.sizeZ), z: yz % world.grid.sizeZ };
}

function adjacentIndices(world: World, index: number): number[] {
  const cell = cellFromIndex(world, index);
  const adjacent: number[] = [];
  for (const [dx, dy, dz] of NEIGHBORS) {
    const x = cell.x + dx;
    const y = cell.y + dy;
    const z = cell.z + dz;
    if (inBounds(world.grid, x, y, z)) {
      adjacent.push(voxelIndex(world.grid, x, y, z));
    }
  }
  return adjacent;
}

function fullBlockAt(
  world: World,
  members: ReadonlySet<number>,
  origin: Cell,
  dimensions: readonly [number, number, number]
): boolean {
  for (let dy = 0; dy < dimensions[1]; dy++) {
    for (let dz = 0; dz < dimensions[2]; dz++) {
      for (let dx = 0; dx < dimensions[0]; dx++) {
        const x = origin.x + dx;
        const y = origin.y + dy;
        const z = origin.z + dz;
        if (!inBounds(world.grid, x, y, z) || !members.has(voxelIndex(world.grid, x, y, z))) {
          return false;
        }
      }
    }
  }
  return true;
}

function containedInBlock(
  world: World,
  members: ReadonlySet<number>,
  cell: Cell,
  dimensions: readonly [number, number, number]
): boolean {
  for (let oy = 0; oy < dimensions[1]; oy++) {
    for (let oz = 0; oz < dimensions[2]; oz++) {
      for (let ox = 0; ox < dimensions[0]; ox++) {
        const origin = { x: cell.x - ox, y: cell.y - oy, z: cell.z - oz };
        if (fullBlockAt(world, members, origin, dimensions)) {
          return true;
        }
      }
    }
  }
  return false;
}

function isCorridor(world: World, index: number): boolean {
  const cell = cellFromIndex(world, index);
  return !CORRIDOR_BLOCKS.some((shape) => containedInBlock(world, world.cavities, cell, shape));
}

function floodComponent(world: World, seed: number, unseen: Set<number>): number[] {
  const component: number[] = [];
  const stack = [seed];
  while (stack.length > 0) {
    const index = stack.pop() as number;
    component.push(index);
    for (const adjacent of adjacentIndices(world, index)) {
      if (unseen.delete(adjacent)) {
        stack.push(adjacent);
      }
    }
  }
  return component;
}

function connectedComponents(world: World, members: ReadonlySet<number>): number[][] {
  const unseen = new Set(members);
  const components: number[][] = [];
  for (const seed of members) {
    if (!unseen.delete(seed)) {
      continue;
    }
    components.push(floodComponent(world, seed, unseen));
  }
  return components;
}

function containsChamberBlock(world: World, members: ReadonlySet<number>): boolean {
  const edge = Math.max(1, Math.floor(NEST_CLASSIFIER.chamberBlockSize));
  const dimensions = [edge, edge, edge] as const;
  for (const index of members) {
    const cell = cellFromIndex(world, index);
    if (containedInBlock(world, members, cell, dimensions)) {
      return true;
    }
  }
  return false;
}

function isOriginalSurfaceVoxel(world: World, index: number): boolean {
  const { x, y, z } = cellFromIndex(world, index);
  return y === world.surfaceMap[z * world.grid.sizeX + x];
}

function inspectVoidBoundary(
  world: World,
  index: number,
  corridor: ReadonlySet<number>,
  doorways: Set<number>
): boolean {
  let touchesSurface = false;
  for (const adjacent of adjacentIndices(world, index)) {
    if (corridor.has(adjacent)) {
      doorways.add(adjacent);
    }
    if (isOriginalSurfaceVoxel(world, adjacent)) {
      touchesSurface = true;
    }
  }
  return touchesSurface;
}

function voidMetrics(
  world: World,
  component: number[],
  corridor: ReadonlySet<number>
): VoidMetrics {
  const members = new Set(component);
  const doorways = new Set<number>();
  const depths: number[] = [];
  let interior = true;
  for (const index of component) {
    const { x, y, z } = cellFromIndex(world, index);
    depths.push(world.surfaceMap[z * world.grid.sizeX + x] - y);
    if (inspectVoidBoundary(world, index, corridor, doorways)) {
      interior = false;
    }
  }
  const chamber =
    interior &&
    doorways.size <= Math.max(0, Math.floor(NEST_CLASSIFIER.maxDoorwayVoxels)) &&
    containsChamberBlock(world, members);
  return {
    kind: chamber ? "chamber" : "bulge",
    volume: component.length,
    doorwayCount: doorways.size,
    minDepth: Math.min(...depths),
    maxDepth: Math.max(...depths),
    meanDepth: depths.reduce((sum, depth) => sum + depth, 0) / depths.length,
  };
}

/** Classify only recorded subsurface excavation; ambient sky is never morphology. */
export function classifyNest(world: World): NestMorphology {
  const corridor = new Set<number>();
  const nonCorridor = new Set<number>();
  const degrees = Array.from({ length: 7 }, () => 0);
  let branchVoxels = 0;
  for (const index of world.cavities) {
    const degree = adjacentIndices(world, index).filter((key) => world.cavities.has(key)).length;
    degrees[degree] += 1;
    branchVoxels += degree >= 3 ? 1 : 0;
    (isCorridor(world, index) ? corridor : nonCorridor).add(index);
  }
  const voids = connectedComponents(world, nonCorridor).map((component) =>
    voidMetrics(world, component, corridor)
  );
  const networkComponentVolumes = connectedComponents(world, world.cavities)
    .map((component) => component.length)
    .sort((a, b) => b - a);
  return {
    cavityVoxels: world.cavities.size,
    corridorVoxels: corridor.size,
    nonCorridorVoxels: nonCorridor.size,
    branchVoxels,
    airDegreeDistribution: degrees,
    networkComponentVolumes,
    voids,
  };
}

/** Scaffolding-only Appendix D existence gate; never an evolution measure. */
export function hasSymmetryBrokenStructure(morphology: NestMorphology): boolean {
  return morphology.nonCorridorVoxels > 0 || morphology.branchVoxels > 0;
}

/** Legacy aggregate used by the existing energy and trace reports. */
export function measureNest(world: World, _site: Site, _surfaceY: number): NestShape {
  const cells = [...world.cavities].map((index) => cellFromIndex(world, index));
  const morphology = classifyNest(world);
  const byLevel = new Map<number, number>();
  for (const cell of cells) {
    byLevel.set(cell.y, (byLevel.get(cell.y) ?? 0) + 1);
  }
  return {
    volume: cells.length,
    levels: byLevel.size,
    maxWidth: byLevel.size === 0 ? 0 : Math.max(...byLevel.values()),
    branchVoxels: morphology.branchVoxels,
  };
}

/** A vertical slice through the site, for diagnostic traces. */
export function crossSection(world: World, site: Site, surfaceY: number, depth = 14): string {
  const rows: string[] = [];
  for (let y = surfaceY; y >= surfaceY - depth; y--) {
    let row = "";
    for (let x = site.x - 7; x <= site.x + 7; x++) {
      row += world.cavities.has(voxelIndex(world.grid, x, y, site.z)) ? "." : "#";
    }
    rows.push(`y=${y} ${row}`);
  }
  return rows.join("\n");
}

import { type Colony } from "./colony";
import { voxelIndex } from "./grid";
import { Material } from "./materials";
import { depositScent } from "./scent";
import { NEST_FIXTURE_SCENT, SCENT } from "./tunables";
import { type World } from "./world";

const SURFACE_AIR_LAYERS = 4;
const SOLVE_TOLERANCE = 1e-6;
const MAX_SOLVE_ITERATIONS = 512;

const OFFSETS: readonly (readonly [number, number, number])[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

function coordinates(world: World, index: number): { x: number; y: number; z: number } {
  const x = index % world.grid.sizeX;
  const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
  const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
  return { x, y, z };
}

function neighborIndex(world: World, x: number, y: number, z: number): number | null {
  if (x < 0 || x >= world.grid.sizeX) return null;
  if (y < 0 || y >= world.grid.sizeY) return null;
  if (z < 0 || z >= world.grid.sizeZ) return null;
  return voxelIndex(world.grid, x, y, z);
}

function airDistances(
  world: World,
  startPoint: { readonly x: number; readonly y: number; readonly z: number }
): Int32Array {
  const start = voxelIndex(world.grid, startPoint.x, startPoint.y, startPoint.z);
  const distances = new Int32Array(world.grid.data.length);
  distances.fill(-1);
  const queue = new Int32Array(world.grid.data.length);
  let read = 0;
  let write = 0;
  distances[start] = 0;
  queue[write++] = start;
  while (read < write) {
    const index = queue[read++];
    const { x, y, z } = coordinates(world, index);
    for (const [dx, dy, dz] of OFFSETS) {
      const next = neighborIndex(world, x + dx, y + dy, z + dz);
      if (next === null || distances[next] >= 0 || world.grid.data[next] !== Material.AIR) continue;
      distances[next] = distances[index] + 1;
      queue[write++] = next;
    }
  }
  return distances;
}

function addSurfaceColumn(
  world: World,
  colony: Colony,
  voxels: Set<number>,
  dx: number,
  dz: number
): void {
  const radius = NEST_FIXTURE_SCENT.surfaceRadius;
  if (dx * dx + dz * dz > radius * radius) return;
  const x = colony.entranceX + dx;
  const z = colony.entranceZ + dz;
  if (x < 0 || x >= world.grid.sizeX || z < 0 || z >= world.grid.sizeZ) return;
  const surface = world.surfaceMap[z * world.grid.sizeX + x];
  for (let y = surface + 1; y <= surface + SURFACE_AIR_LAYERS; y++) {
    const index = neighborIndex(world, x, y, z);
    if (index !== null && world.grid.data[index] === Material.AIR) voxels.add(index);
  }
}

function addSurfaceCarrier(world: World, colony: Colony, voxels: Set<number>): void {
  const radius = NEST_FIXTURE_SCENT.surfaceRadius;
  for (let dz = -radius; dz <= radius; dz++) {
    for (let dx = -radius; dx <= radius; dx++) {
      addSurfaceColumn(world, colony, voxels, dx, dz);
    }
  }
}

function nextTowardEntrance(world: World, distances: Int32Array, index: number): number | null {
  const distance = distances[index];
  const { x, y, z } = coordinates(world, index);
  for (const [dx, dy, dz] of OFFSETS) {
    const next = neighborIndex(world, x + dx, y + dy, z + dz);
    if (next !== null && distances[next] === distance - 1) return next;
  }
  return null;
}

function connectCarrierPaths(world: World, distances: Int32Array, voxels: Set<number>): void {
  for (const start of [...voxels]) {
    let current: number | null = start;
    while (current !== null && distances[current] > 0) {
      voxels.add(current);
      current = nextTowardEntrance(world, distances, current);
    }
  }
}

interface SteadySystem {
  readonly indices: readonly number[];
  readonly neighbors: Int32Array;
  readonly diagonal: Float64Array;
  readonly source: Float64Array;
  readonly neighborScale: number;
}

interface SteadySystemBuild {
  readonly world: World;
  readonly sourceIndex: number;
  readonly indices: readonly number[];
  readonly localOf: Int32Array;
  readonly neighbors: Int32Array;
  readonly diagonal: Float64Array;
  readonly sourceTerms: Float64Array;
}

function writeSteadyRow(build: SteadySystemBuild, local: number): void {
  const { world, sourceIndex, indices, localOf, neighbors, diagonal, sourceTerms } = build;
  const { diffusionRate, evaporation } = world.nestScent.physics;
  const index = indices[local];
  const { x, y, z } = coordinates(world, index);
  let airDegree = 0;
  let write = local * OFFSETS.length;
  for (const [dx, dy, dz] of OFFSETS) {
    const next = neighborIndex(world, x + dx, y + dy, z + dz);
    if (next === null || world.grid.data[next] !== Material.AIR) continue;
    airDegree += 1;
    const neighborLocal = localOf[next];
    if (neighborLocal >= 0) neighbors[write++] = neighborLocal;
  }
  const retained = 1 - (diffusionRate * airDegree) / 6;
  diagonal[local] = 1 - evaporation * retained;
  if (index === sourceIndex) sourceTerms[local] = SCENT.nestSourceStrength;
}

function steadySystem(world: World, domain: ReadonlySet<number>, source: number): SteadySystem {
  const indices = [...domain];
  const localOf = new Int32Array(world.grid.data.length);
  localOf.fill(-1);
  for (let local = 0; local < indices.length; local++) localOf[indices[local]] = local;
  const neighbors = new Int32Array(indices.length * OFFSETS.length);
  neighbors.fill(-1);
  const diagonal = new Float64Array(indices.length);
  const sourceTerms = new Float64Array(indices.length);
  const build = { world, sourceIndex: source, indices, localOf, neighbors, diagonal, sourceTerms };
  for (let local = 0; local < indices.length; local++) writeSteadyRow(build, local);
  return {
    indices,
    neighbors,
    diagonal,
    source: sourceTerms,
    neighborScale:
      (world.nestScent.physics.evaporation * world.nestScent.physics.diffusionRate) / 6,
  };
}

function applySteadyOperator(system: SteadySystem, input: Float64Array, out: Float64Array): void {
  for (let local = 0; local < system.indices.length; local++) {
    let value = system.diagonal[local] * input[local];
    const start = local * OFFSETS.length;
    for (let offset = 0; offset < OFFSETS.length; offset++) {
      const neighbor = system.neighbors[start + offset];
      if (neighbor >= 0) value -= system.neighborScale * input[neighbor];
    }
    out[local] = value;
  }
}

function dot(left: Float64Array, right: Float64Array): number {
  let result = 0;
  for (let index = 0; index < left.length; index++) result += left[index] * right[index];
  return result;
}

function initializeSolve(
  system: SteadySystem,
  values: Float64Array,
  residual: Float64Array,
  conditioned: Float64Array,
  direction: Float64Array,
  product: Float64Array
): number {
  applySteadyOperator(system, values, product);
  for (let index = 0; index < values.length; index++) {
    residual[index] = system.source[index] - product[index];
    conditioned[index] = residual[index] / system.diagonal[index];
    direction[index] = conditioned[index];
  }
  return dot(residual, conditioned);
}

function updateResidual(
  values: Float64Array,
  residual: Float64Array,
  direction: Float64Array,
  product: Float64Array,
  residualProduct: number
): number {
  const scale = residualProduct / dot(direction, product);
  let maximum = 0;
  for (let index = 0; index < values.length; index++) {
    values[index] += scale * direction[index];
    residual[index] -= scale * product[index];
    maximum = Math.max(maximum, Math.abs(residual[index]));
  }
  return maximum;
}

function turnDirection(
  system: SteadySystem,
  residual: Float64Array,
  conditioned: Float64Array,
  direction: Float64Array,
  residualProduct: number
): number {
  for (let index = 0; index < residual.length; index++) {
    conditioned[index] = residual[index] / system.diagonal[index];
  }
  const nextProduct = dot(residual, conditioned);
  const turn = nextProduct / residualProduct;
  for (let index = 0; index < residual.length; index++) {
    direction[index] = conditioned[index] + turn * direction[index];
  }
  return nextProduct;
}

function solveSteadyState(world: World, domain: ReadonlySet<number>, source: number): void {
  const system = steadySystem(world, domain, source);
  const values = Float64Array.from(system.indices, (index) => world.nestScent.values[index]);
  const residual = new Float64Array(values.length);
  const conditioned = new Float64Array(values.length);
  const direction = new Float64Array(values.length);
  const product = new Float64Array(values.length);
  let residualProduct = initializeSolve(system, values, residual, conditioned, direction, product);
  let converged = false;
  for (let iteration = 0; iteration < MAX_SOLVE_ITERATIONS; iteration++) {
    applySteadyOperator(system, direction, product);
    if (updateResidual(values, residual, direction, product, residualProduct) < SOLVE_TOLERANCE) {
      converged = true;
      break;
    }
    residualProduct = turnDirection(system, residual, conditioned, direction, residualProduct);
  }
  if (!converged) throw new Error("authored nest scent steady-state solve did not converge");
  for (let local = 0; local < system.indices.length; local++) {
    world.nestScent.values[system.indices[local]] = Math.max(0, values[local]);
  }
}

/**
 * Seed the mature authored nest with its standing colony odor. Breadth-first
 * air distance approximates a long-settled diffused field without thousands
 * of setup passes. Authored cavities and nearby surface air receive the same
 * air-distance falloff; normal runtime emission and diffusion take over.
 */
export function primeAuthoredNestScent(world: World, colony: Colony): void {
  const entranceDistances = airDistances(world, {
    x: colony.entranceX,
    y: colony.entranceY,
    z: colony.entranceZ,
  });
  const sourceDistances = airDistances(world, colony);
  const voxels = new Set(world.cavities);
  addSurfaceCarrier(world, colony, voxels);
  connectCarrierPaths(world, entranceDistances, voxels);
  const source = voxelIndex(world.grid, colony.x, colony.y, colony.z);
  voxels.add(source);
  for (const index of voxels) {
    const distance = sourceDistances[index];
    if (distance < 0 || world.grid.data[index] !== Material.AIR) continue;
    const value =
      NEST_FIXTURE_SCENT.sourceStrength * Math.exp(-distance / NEST_FIXTURE_SCENT.distanceScale);
    depositScent(world.nestScent, index, value, colony.id);
  }
  solveSteadyState(world, voxels, source);
}

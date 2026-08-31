import { type VoxelGrid } from "./grid";
import { Material } from "./materials";
import { SCENT } from "./tunables";

/**
 * A diffusing scent field over air voxels (design spec §5.5): dense values
 * plus an active set so stepping costs scale with occupied volume, not world
 * volume. Iteration is in ascending voxel index order — deterministic.
 */
export interface ScentField {
  values: Float32Array;
  /** Voxel indices with non-negligible value. */
  active: Set<number>;
}

export function createScentField(grid: VoxelGrid): ScentField {
  return { values: new Float32Array(grid.data.length), active: new Set() };
}

export function depositScent(field: ScentField, voxelIndex: number, amount: number): void {
  field.values[voxelIndex] += amount;
  field.active.add(voxelIndex);
}

export function sampleScent(field: ScentField, voxelIndex: number): number {
  return field.values[voxelIndex];
}

/**
 * Air neighbors of a voxel index along the six faces, with explicit
 * coordinate bounds so linear offsets never wrap across row seams.
 */
function airNeighbors(grid: VoxelGrid, index: number): number[] {
  const x = index % grid.sizeX;
  const z = Math.floor(index / grid.sizeX) % grid.sizeZ;
  const y = Math.floor(index / (grid.sizeX * grid.sizeZ));
  const slab = grid.sizeX * grid.sizeZ;
  const neighbors: number[] = [];
  if (x > 0) neighbors.push(index - 1);
  if (x < grid.sizeX - 1) neighbors.push(index + 1);
  if (z > 0) neighbors.push(index - grid.sizeX);
  if (z < grid.sizeZ - 1) neighbors.push(index + grid.sizeX);
  if (y > 0) neighbors.push(index - slab);
  if (y < grid.sizeY - 1) neighbors.push(index + slab);
  return neighbors.filter((n) => grid.data[n] === Material.AIR);
}

/**
 * One diffusion + evaporation pass. Runs on a cadence (SCENT.stepInterval
 * ticks), not every tick. Set iteration is insertion-ordered, so identical
 * histories produce identical fields — no sorting needed for determinism.
 */
export function stepScentField(grid: VoxelGrid, field: ScentField): void {
  const gained = new Map<number, number>();

  for (const index of field.active) {
    const neighbors = airNeighbors(grid, index);
    if (neighbors.length === 0) {
      continue;
    }
    const share = (field.values[index] * SCENT.diffusionRate) / 6;
    for (const neighbor of neighbors) {
      gained.set(neighbor, (gained.get(neighbor) ?? 0) + share);
    }
    field.values[index] -= share * neighbors.length;
  }
  for (const [index, amount] of gained) {
    field.values[index] += amount;
    field.active.add(index);
  }
  for (const index of Array.from(field.active)) {
    const next = field.values[index] * SCENT.evaporation;
    if (next < SCENT.epsilon) {
      field.values[index] = 0;
      field.active.delete(index);
    } else {
      field.values[index] = next;
    }
  }
}

/** Continuous emission from FOOD voxels into the food-scent field. */
export function emitFoodScent(grid: VoxelGrid, field: ScentField, foodSources: Set<number>): void {
  for (const source of foodSources) {
    for (const neighbor of airNeighbors(grid, source)) {
      depositScent(field, neighbor, SCENT.foodSourceStrength);
    }
  }
}

/** Rebuild a food-source set by scanning the grid (used on load/creation). */
export function scanFoodSources(grid: VoxelGrid): Set<number> {
  const sources = new Set<number>();
  for (let i = 0; i < grid.data.length; i++) {
    if (grid.data[i] === Material.FOOD) {
      sources.add(i);
    }
  }
  return sources;
}

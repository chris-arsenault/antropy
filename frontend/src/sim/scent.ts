import { type VoxelGrid } from "./grid";
import { Material } from "./materials";
import { SCENT } from "./tunables";

/**
 * A diffusing scent field over air voxels (design spec §5.5), held in flat
 * fixed-shape arrays with no hot-path allocation: dense values, an insertion-
 * ordered active list with membership flags, and a full-grid gain scratch.
 * Iteration order is the active list order — deterministic for identical
 * histories.
 */
export interface ScentField {
  values: Float32Array;
  /** Active voxel indices, insertion-ordered; only [0, activeCount) is live. */
  activeList: Int32Array;
  activeCount: number;
  /** 1 where the voxel is in the active list. */
  activeFlags: Uint8Array;
  /** Diffusion gain scratch, zeroed outside a pass. */
  gained: Float32Array;
  /** Indices with nonzero gain this pass; only [0, touchedCount) is live. */
  touchedList: Int32Array;
  touchedCount: number;
}

const INITIAL_ACTIVE_CAPACITY = 4096;

export function createScentField(grid: VoxelGrid): ScentField {
  const size = grid.data.length;
  return {
    values: new Float32Array(size),
    activeList: new Int32Array(INITIAL_ACTIVE_CAPACITY),
    activeCount: 0,
    activeFlags: new Uint8Array(size),
    gained: new Float32Array(size),
    touchedList: new Int32Array(INITIAL_ACTIVE_CAPACITY),
    touchedCount: 0,
  };
}

function grow(list: Int32Array): Int32Array {
  const next = new Int32Array(list.length * 2);
  next.set(list);
  return next;
}

function addActive(field: ScentField, voxelIndex: number): void {
  if (field.activeFlags[voxelIndex] === 1) {
    return;
  }
  field.activeFlags[voxelIndex] = 1;
  if (field.activeCount === field.activeList.length) {
    field.activeList = grow(field.activeList);
  }
  field.activeList[field.activeCount++] = voxelIndex;
}

export function depositScent(field: ScentField, voxelIndex: number, amount: number): void {
  field.values[voxelIndex] += amount;
  addActive(field, voxelIndex);
}

export function sampleScent(field: ScentField, voxelIndex: number): number {
  return field.values[voxelIndex];
}

export function scentActiveCount(field: ScentField): number {
  return field.activeCount;
}

/** Live active indices in order — for checkpointing and tests. */
export function scentActiveIndices(field: ScentField): number[] {
  return Array.from(field.activeList.subarray(0, field.activeCount));
}

/** Restore a field from checkpoint data (values + ordered active list). */
export function restoreScentField(field: ScentField, values: Float32Array, active: number[]): void {
  field.values.set(values);
  field.activeFlags.fill(0);
  field.activeCount = 0;
  for (const index of active) {
    addActive(field, index);
  }
}

// Neighbor scratch — single-threaded reuse, valid until the next call.
const NEIGHBOR_SCRATCH = new Int32Array(6);

/** Air neighbors along the six faces, bounds-checked; returns the count. */
function airNeighbors(grid: VoxelGrid, index: number): number {
  const x = index % grid.sizeX;
  const z = Math.floor(index / grid.sizeX) % grid.sizeZ;
  const y = Math.floor(index / (grid.sizeX * grid.sizeZ));
  const slab = grid.sizeX * grid.sizeZ;
  let count = 0;
  if (x > 0) NEIGHBOR_SCRATCH[count++] = index - 1;
  if (x < grid.sizeX - 1) NEIGHBOR_SCRATCH[count++] = index + 1;
  if (z > 0) NEIGHBOR_SCRATCH[count++] = index - grid.sizeX;
  if (z < grid.sizeZ - 1) NEIGHBOR_SCRATCH[count++] = index + grid.sizeX;
  if (y > 0) NEIGHBOR_SCRATCH[count++] = index - slab;
  if (y < grid.sizeY - 1) NEIGHBOR_SCRATCH[count++] = index + slab;
  let write = 0;
  for (let i = 0; i < count; i++) {
    if (grid.data[NEIGHBOR_SCRATCH[i]] === Material.AIR) {
      NEIGHBOR_SCRATCH[write++] = NEIGHBOR_SCRATCH[i];
    }
  }
  return write;
}

function recordGain(field: ScentField, voxelIndex: number, amount: number): void {
  if (field.gained[voxelIndex] === 0) {
    if (field.touchedCount === field.touchedList.length) {
      field.touchedList = grow(field.touchedList);
    }
    field.touchedList[field.touchedCount++] = voxelIndex;
  }
  field.gained[voxelIndex] += amount;
}

function diffuse(grid: VoxelGrid, field: ScentField): void {
  for (let i = 0; i < field.activeCount; i++) {
    const index = field.activeList[i];
    const neighborCount = airNeighbors(grid, index);
    if (neighborCount === 0) {
      continue;
    }
    const share = (field.values[index] * SCENT.diffusionRate) / 6;
    for (let n = 0; n < neighborCount; n++) {
      recordGain(field, NEIGHBOR_SCRATCH[n], share);
    }
    field.values[index] -= share * neighborCount;
  }
  for (let j = 0; j < field.touchedCount; j++) {
    const index = field.touchedList[j];
    field.values[index] += field.gained[index];
    field.gained[index] = 0;
    addActive(field, index);
  }
  field.touchedCount = 0;
}

function evaporateAndCompact(field: ScentField): void {
  let write = 0;
  for (let i = 0; i < field.activeCount; i++) {
    const index = field.activeList[i];
    const next = field.values[index] * SCENT.evaporation;
    if (next < SCENT.epsilon) {
      field.values[index] = 0;
      field.activeFlags[index] = 0;
    } else {
      field.values[index] = next;
      field.activeList[write++] = index;
    }
  }
  field.activeCount = write;
}

/**
 * One diffusion + evaporation pass. Runs on a cadence (SCENT.stepInterval
 * ticks), not every tick. Allocation-free at steady state.
 */
export function stepScentField(grid: VoxelGrid, field: ScentField): void {
  diffuse(grid, field);
  evaporateAndCompact(field);
}

/** Continuous emission from FOOD voxels into the food-scent field. */
export function emitFoodScent(grid: VoxelGrid, field: ScentField, foodSources: Set<number>): void {
  for (const source of foodSources) {
    const neighborCount = airNeighbors(grid, source);
    for (let n = 0; n < neighborCount; n++) {
      depositScent(field, NEIGHBOR_SCRATCH[n], SCENT.foodSourceStrength);
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

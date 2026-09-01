import { type VoxelGrid } from "./grid";
import { Material } from "./materials";
import { BEACON_PHYSICS, SCENT } from "./tunables";

/** Per-field diffusion/evaporation parameters (trail vs beacon roles). */
export interface ScentPhysics {
  readonly diffusionRate: number;
  readonly evaporation: number;
  readonly epsilon: number;
}

/**
 * A diffusing scent field over air voxels (design spec §5.5), held in flat
 * fixed-shape arrays with no hot-path allocation. Deposits are owner-tagged
 * (ADR-0005): each voxel carries the colony id of its last depositor and
 * sampling filters by owner, so colonies never read each other's signals.
 * Owner 0 is the neutral channel (food scent, colony-less ants).
 * Iteration order is the active list order — deterministic.
 */
export interface ScentField {
  values: Float32Array;
  /** Colony id owning each voxel's scent (0 = neutral). */
  owners: Uint8Array;
  /** Active voxel indices, insertion-ordered; only [0, activeCount) is live. */
  activeList: Int32Array;
  activeCount: number;
  /** 1 where the voxel is in the active list. */
  activeFlags: Uint8Array;
  physics: ScentPhysics;
}

const INITIAL_ACTIVE_CAPACITY = 4096;

// Diffusion scratch shared across fields (passes run sequentially on one
// thread): per-voxel gain, gain owner, and the touched-index list.
let gainScratch = new Float32Array(0);
let gainOwnerScratch = new Uint8Array(0);
let touchedScratch: Int32Array = new Int32Array(INITIAL_ACTIVE_CAPACITY);
let touchedCount = 0;

function ensureScratch(size: number): void {
  if (gainScratch.length < size) {
    gainScratch = new Float32Array(size);
    gainOwnerScratch = new Uint8Array(size);
  }
}

export function createScentField(
  grid: VoxelGrid,
  physics: ScentPhysics = BEACON_PHYSICS
): ScentField {
  const size = grid.data.length;
  ensureScratch(size);
  return {
    values: new Float32Array(size),
    owners: new Uint8Array(size),
    activeList: new Int32Array(INITIAL_ACTIVE_CAPACITY),
    activeCount: 0,
    activeFlags: new Uint8Array(size),
    physics,
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

/** Deposit stamps the owner: last writer claims the voxel (ADR-0005). */
export function depositScent(
  field: ScentField,
  voxelIndex: number,
  amount: number,
  owner = 0
): void {
  field.values[voxelIndex] += amount;
  field.owners[voxelIndex] = owner;
  addActive(field, voxelIndex);
}

/** Sampling filters by owner: foreign scent reads as zero. */
export function sampleScent(field: ScentField, voxelIndex: number, owner = 0): number {
  return field.owners[voxelIndex] === owner ? field.values[voxelIndex] : 0;
}

export function scentActiveCount(field: ScentField): number {
  return field.activeCount;
}

/** Live active indices in order — for checkpointing and tests. */
export function scentActiveIndices(field: ScentField): number[] {
  return Array.from(field.activeList.subarray(0, field.activeCount));
}

/** Restore a field from checkpoint data (values + owners + active order). */
export function restoreScentField(
  field: ScentField,
  values: Float32Array,
  owners: Uint8Array,
  active: number[]
): void {
  field.values.set(values);
  field.owners.set(owners);
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

function recordGain(voxelIndex: number, amount: number, owner: number): void {
  if (gainScratch[voxelIndex] === 0) {
    if (touchedCount === touchedScratch.length) {
      touchedScratch = grow(touchedScratch);
    }
    touchedScratch[touchedCount++] = voxelIndex;
    gainOwnerScratch[voxelIndex] = owner;
  }
  gainScratch[voxelIndex] += amount;
}

function diffuse(grid: VoxelGrid, field: ScentField): void {
  for (let i = 0; i < field.activeCount; i++) {
    const index = field.activeList[i];
    const neighborCount = airNeighbors(grid, index);
    if (neighborCount === 0) {
      continue;
    }
    const share = (field.values[index] * field.physics.diffusionRate) / 6;
    // Mass conservation at the fringe: shares too small to survive the
    // epsilon cull stay put instead of bleeding away tick by tick.
    if (share < field.physics.epsilon) {
      continue;
    }
    const owner = field.owners[index];
    for (let n = 0; n < neighborCount; n++) {
      recordGain(NEIGHBOR_SCRATCH[n], share, owner);
    }
    field.values[index] -= share * neighborCount;
  }
  for (let j = 0; j < touchedCount; j++) {
    const index = touchedScratch[j];
    // A voxel with no standing scent takes the gain's owner; an owned voxel
    // keeps its owner (first-writer-per-pass, then last-depositor).
    if (field.values[index] === 0) {
      field.owners[index] = gainOwnerScratch[index];
    }
    field.values[index] += gainScratch[index];
    gainScratch[index] = 0;
    addActive(field, index);
  }
  touchedCount = 0;
}

function evaporateAndCompact(field: ScentField): void {
  let write = 0;
  for (let i = 0; i < field.activeCount; i++) {
    const index = field.activeList[i];
    const next = field.values[index] * field.physics.evaporation;
    if (next < field.physics.epsilon) {
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

/** Continuous neutral emission from FOOD voxels into the food-scent field. */
export function emitFoodScent(grid: VoxelGrid, field: ScentField, foodSources: Set<number>): void {
  for (const source of foodSources) {
    const neighborCount = airNeighbors(grid, source);
    for (let n = 0; n < neighborCount; n++) {
      depositScent(field, NEIGHBOR_SCRATCH[n], SCENT.foodSourceStrength, 0);
    }
  }
}

/** Colony-tagged emission from a queen's position (ADR-0006 nest scent). */
export function emitNestScent(
  grid: VoxelGrid,
  field: ScentField,
  voxelIndex: number,
  owner: number
): void {
  depositScent(field, voxelIndex, SCENT.nestSourceStrength, owner);
  const neighborCount = airNeighbors(grid, voxelIndex);
  for (let n = 0; n < neighborCount; n++) {
    depositScent(field, NEIGHBOR_SCRATCH[n], SCENT.nestSourceStrength, owner);
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

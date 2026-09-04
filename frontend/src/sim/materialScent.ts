import { type VoxelGrid } from "./grid";
import { Material } from "./materials";
import { depositScent, type ScentField } from "./scent";
import { COLONY_ODOR } from "./tunables";

/** Colony odor held by solid material and transferred by physical contact. */
export interface MaterialScentField {
  values: Float32Array;
  owners: Uint8Array;
  activeList: Int32Array;
  activeFlags: Uint8Array;
  activeCount: number;
}

const INITIAL_ACTIVE_CAPACITY = 4096;
const NEIGHBORS = new Int32Array(6);

export function createMaterialScentField(grid: VoxelGrid): MaterialScentField {
  const size = grid.data.length;
  return {
    values: new Float32Array(size),
    owners: new Uint8Array(size),
    activeList: new Int32Array(INITIAL_ACTIVE_CAPACITY),
    activeFlags: new Uint8Array(size),
    activeCount: 0,
  };
}

function grow(list: Int32Array): Int32Array {
  const next = new Int32Array(list.length * 2);
  next.set(list);
  return next;
}

function addActive(field: MaterialScentField, index: number): void {
  if (field.activeFlags[index] !== 0) return;
  field.activeFlags[index] = 1;
  if (field.activeCount === field.activeList.length) field.activeList = grow(field.activeList);
  field.activeList[field.activeCount++] = index;
}

export function setMaterialScent(
  field: MaterialScentField,
  index: number,
  amount: number,
  owner: number
): void {
  field.values[index] = Math.max(0, Math.min(COLONY_ODOR.saturation, amount));
  field.owners[index] = owner;
  if (field.values[index] > 0) addActive(field, index);
}

export function clearMaterialScent(field: MaterialScentField, index: number): void {
  field.values[index] = 0;
  field.owners[index] = 0;
}

export function sampleMaterialScent(
  field: MaterialScentField,
  index: number,
  owner: number
): number {
  return field.owners[index] === owner ? field.values[index] : 0;
}

function faceNeighbors(grid: VoxelGrid, index: number): number {
  const x = index % grid.sizeX;
  const z = Math.floor(index / grid.sizeX) % grid.sizeZ;
  const y = Math.floor(index / (grid.sizeX * grid.sizeZ));
  const slab = grid.sizeX * grid.sizeZ;
  let count = 0;
  if (x > 0) NEIGHBORS[count++] = index - 1;
  if (x < grid.sizeX - 1) NEIGHBORS[count++] = index + 1;
  if (z > 0) NEIGHBORS[count++] = index - grid.sizeX;
  if (z < grid.sizeZ - 1) NEIGHBORS[count++] = index + grid.sizeX;
  if (y > 0) NEIGHBORS[count++] = index - slab;
  if (y < grid.sizeY - 1) NEIGHBORS[count++] = index + slab;
  return count;
}

function reemitAndFade(grid: VoxelGrid, air: ScentField, material: MaterialScentField): void {
  const priorCount = material.activeCount;
  let write = 0;
  for (let offset = 0; offset < priorCount; offset++) {
    const index = material.activeList[offset];
    const retained = material.values[index] * COLONY_ODOR.retention;
    if (grid.data[index] === Material.AIR || retained < COLONY_ODOR.epsilon) {
      clearMaterialScent(material, index);
      material.activeFlags[index] = 0;
      continue;
    }
    material.values[index] = retained;
    material.activeList[write++] = index;
    const count = faceNeighbors(grid, index);
    for (let neighbor = 0; neighbor < count; neighbor++) {
      const target = NEIGHBORS[neighbor];
      if (grid.data[target] === Material.AIR) {
        depositScent(air, target, retained * COLONY_ODOR.reemissionRate, material.owners[index]);
      }
    }
  }
  material.activeCount = write;
}

function absorbAt(
  material: MaterialScentField,
  index: number,
  amount: number,
  owner: number
): void {
  const current = material.owners[index] === owner ? material.values[index] : 0;
  const available = 1 - current / COLONY_ODOR.saturation;
  setMaterialScent(material, index, current + amount * Math.max(0, available), owner);
}

function absorbNeighbors(
  grid: VoxelGrid,
  material: MaterialScentField,
  source: number,
  amount: number,
  owner: number
): void {
  const count = faceNeighbors(grid, source);
  for (let neighbor = 0; neighbor < count; neighbor++) {
    const target = NEIGHBORS[neighbor];
    if (grid.data[target] !== Material.AIR && grid.data[target] !== Material.FOOD) {
      absorbAt(material, target, amount, owner);
    }
  }
}

function absorbFromAir(grid: VoxelGrid, air: ScentField, material: MaterialScentField): void {
  const airCount = air.activeCount;
  for (let offset = 0; offset < airCount; offset++) {
    const source = air.activeList[offset];
    const value = air.values[source];
    if (value < COLONY_ODOR.absorptionFloor) continue;
    const owner = air.owners[source];
    if (owner === 0) continue;
    absorbNeighbors(grid, material, source, value * COLONY_ODOR.absorptionRate, owner);
  }
}

/** One physical exchange pass: marked material re-emits, then nearby air is absorbed. */
export function exchangeMaterialScent(
  grid: VoxelGrid,
  air: ScentField,
  material: MaterialScentField
): void {
  reemitAndFade(grid, air, material);
  absorbFromAir(grid, air, material);
}

/** Mature authored cavities begin with colony odor held by their wall fabric. */
export function primeAuthoredMaterialScent(
  grid: VoxelGrid,
  cavities: ReadonlySet<number>,
  material: MaterialScentField,
  owner: number
): void {
  for (const cavity of cavities) {
    const count = faceNeighbors(grid, cavity);
    for (let neighbor = 0; neighbor < count; neighbor++) {
      const index = NEIGHBORS[neighbor];
      if (grid.data[index] !== Material.AIR) {
        setMaterialScent(material, index, COLONY_ODOR.fixtureSaturation, owner);
      }
    }
  }
}

export function materialScentActiveIndices(field: MaterialScentField): number[] {
  return Array.from(field.activeList.subarray(0, field.activeCount));
}

export function restoreMaterialScentField(
  field: MaterialScentField,
  values: Float32Array,
  owners: Uint8Array,
  active: readonly number[]
): void {
  field.values.set(values);
  field.owners.set(owners);
  field.activeFlags.fill(0);
  field.activeCount = 0;
  for (const index of active) addActive(field, index);
}

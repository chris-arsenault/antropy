import { CHEMISTRY } from "./config";
import { cellIndex, pointAt, type Grid } from "./grid";
import { DIRECTIONS } from "./geometry";
import { isAir, isWalkable } from "./terrain";
export { isWalkable } from "./terrain";

export interface FieldPhysics {
  readonly diffusion: number;
  readonly evaporation: number;
  readonly epsilon: number;
}

export interface ChemicalField {
  readonly values: Float32Array;
  activeList: Int32Array<ArrayBufferLike>;
  activeCount: number;
  readonly activeFlags: Uint8Array;
  readonly physics: FieldPhysics;
  readonly surfaceBound: boolean;
}

const INITIAL_ACTIVE_CAPACITY = 4_096;
let gainScratch = new Float32Array(0);
let touchedScratch: Int32Array<ArrayBufferLike> = new Int32Array(INITIAL_ACTIVE_CAPACITY);
let touchedFlags = new Uint8Array(0);
let touchedCount = 0;

function ensureScratch(size: number): void {
  if (gainScratch.length >= size) return;
  gainScratch = new Float32Array(size);
  touchedFlags = new Uint8Array(size);
}

function grow(values: Int32Array): Int32Array {
  const next = new Int32Array(values.length * 2);
  next.set(values);
  return next;
}

export function createChemicalField(
  grid: Grid,
  physics: FieldPhysics = CHEMISTRY.odor,
  surfaceBound = false
): ChemicalField {
  ensureScratch(grid.cells.length);
  return {
    values: new Float32Array(grid.cells.length),
    activeList: new Int32Array(INITIAL_ACTIVE_CAPACITY),
    activeCount: 0,
    activeFlags: new Uint8Array(grid.cells.length),
    physics,
    surfaceBound,
  };
}

function addActive(field: ChemicalField, index: number): void {
  if (field.activeFlags[index] === 1) return;
  field.activeFlags[index] = 1;
  if (field.activeCount === field.activeList.length) field.activeList = grow(field.activeList);
  field.activeList[field.activeCount++] = index;
}

export function depositChemical(field: ChemicalField, index: number, amount: number): void {
  if (index < 0 || index >= field.values.length || amount <= 0) return;
  field.values[index] += amount;
  addActive(field, index);
}

export function chemicalResponse(value: number): number {
  const positive = Math.max(0, value);
  return positive / (1 + positive);
}

function walkableNeighbors(grid: Grid, index: number, surfaceBound = true): number[] {
  const point = pointAt(grid, index);
  const neighbors: number[] = [];
  for (const direction of DIRECTIONS) {
    const x = point.x + direction.x;
    const y = point.y + direction.y;
    if (surfaceBound ? isWalkable(grid, x, y) : isAir(grid, x, y))
      neighbors.push(cellIndex(grid, x, y));
  }
  return neighbors;
}

function recordGain(index: number, amount: number): void {
  if (touchedFlags[index] === 0) {
    touchedFlags[index] = 1;
    if (touchedCount === touchedScratch.length) touchedScratch = grow(touchedScratch);
    touchedScratch[touchedCount++] = index;
  }
  gainScratch[index] += amount;
}

function diffuse(grid: Grid, field: ChemicalField): void {
  for (let offset = 0; offset < field.activeCount; offset++) {
    const index = field.activeList[offset];
    if (!validSource(grid, field, index)) {
      field.values[index] = 0;
      continue;
    }
    const neighbors = walkableNeighbors(grid, index, field.surfaceBound);
    if (neighbors.length === 0) continue;
    const share = (field.values[index] * field.physics.diffusion) / DIRECTIONS.length;
    if (share < field.physics.epsilon) continue;
    field.values[index] -= share * neighbors.length;
    for (const neighbor of neighbors) recordGain(neighbor, share);
  }
  for (let offset = 0; offset < touchedCount; offset++) {
    const index = touchedScratch[offset];
    field.values[index] += gainScratch[index];
    gainScratch[index] = 0;
    touchedFlags[index] = 0;
    addActive(field, index);
  }
  touchedCount = 0;
}

function validSource(grid: Grid, field: ChemicalField, index: number): boolean {
  const point = pointAt(grid, index);
  return field.surfaceBound ? isWalkable(grid, point.x, point.y) : isAir(grid, point.x, point.y);
}

function evaporate(field: ChemicalField): void {
  let write = 0;
  for (let offset = 0; offset < field.activeCount; offset++) {
    const index = field.activeList[offset];
    const next = field.values[index] * field.physics.evaporation;
    if (next < field.physics.epsilon) {
      field.values[index] = 0;
      field.activeFlags[index] = 0;
      continue;
    }
    field.values[index] = next;
    field.activeList[write++] = index;
  }
  field.activeCount = write;
}

export function stepChemical(grid: Grid, field: ChemicalField): void {
  diffuse(grid, field);
  evaporate(field);
}

export function emitFromSources(
  grid: Grid,
  field: ChemicalField,
  sources: ReadonlySet<number>,
  amount: number
): void {
  for (const source of sources) {
    for (const neighbor of walkableNeighbors(grid, source, field.surfaceBound)) {
      depositChemical(field, neighbor, amount);
    }
  }
}

interface EquilibriumGraph {
  readonly cells: number[];
  readonly fixed: Uint8Array;
  readonly adjacency: readonly number[][];
}

function equilibriumStarts(
  grid: Grid,
  sources: ReadonlySet<number>,
  surfaceBound: boolean
): { readonly cells: number[]; readonly fixed: Uint8Array; readonly seen: Uint8Array } {
  const cells: number[] = [];
  const fixed = new Uint8Array(grid.cells.length);
  const seen = new Uint8Array(grid.cells.length);
  for (const source of sources) {
    const point = pointAt(grid, source);
    const traversable = surfaceBound
      ? isWalkable(grid, point.x, point.y)
      : isAir(grid, point.x, point.y);
    const starts = traversable ? [source] : walkableNeighbors(grid, source, surfaceBound);
    for (const neighbor of starts) {
      fixed[neighbor] = 1;
      if (seen[neighbor] === 1) continue;
      seen[neighbor] = 1;
      cells.push(neighbor);
    }
  }
  return { cells, fixed, seen };
}

function buildEquilibriumGraph(
  grid: Grid,
  sources: ReadonlySet<number>,
  surfaceBound: boolean
): EquilibriumGraph {
  const { cells, fixed, seen } = equilibriumStarts(grid, sources, surfaceBound);
  for (let read = 0; read < cells.length; read++) {
    for (const neighbor of walkableNeighbors(grid, cells[read], surfaceBound)) {
      if (seen[neighbor] === 1) continue;
      seen[neighbor] = 1;
      cells.push(neighbor);
    }
  }
  return {
    cells,
    fixed,
    adjacency: cells.map((index) => walkableNeighbors(grid, index, surfaceBound)),
  };
}

function relaxCell(
  field: ChemicalField,
  graph: EquilibriumGraph,
  offset: number,
  sourceValue: number,
  retention: number
): number {
  const index = graph.cells[offset];
  if (graph.fixed[index] === 1) {
    const change = Math.abs(field.values[index] - sourceValue);
    field.values[index] = sourceValue;
    return change;
  }
  const neighbors = graph.adjacency[offset];
  if (neighbors.length === 0) return 0;
  let total = 0;
  for (const neighbor of neighbors) total += field.values[neighbor];
  const next = (total / neighbors.length) * retention;
  const change = Math.abs(field.values[index] - next);
  field.values[index] = next;
  return change;
}

function relaxToEquilibrium(
  field: ChemicalField,
  graph: EquilibriumGraph,
  sourceValue: number,
  retention: number,
  maximumPasses: number
): void {
  for (let pass = 0; pass < maximumPasses; pass++) {
    let largestChange = 0;
    const reverse = pass % 2 === 1;
    for (let offset = 0; offset < graph.cells.length; offset++) {
      const relaxationOffset = reverse ? graph.cells.length - 1 - offset : offset;
      const change = relaxCell(field, graph, relaxationOffset, sourceValue, retention);
      largestChange = Math.max(largestChange, change);
    }
    if (largestChange < field.physics.epsilon) break;
  }
}

export function equilibrateFromSources(
  grid: Grid,
  field: ChemicalField,
  sources: ReadonlySet<number>,
  sourceValue: number,
  retention: number,
  maximumPasses: number,
  surfaceBound = field.surfaceBound
): void {
  const graph = buildEquilibriumGraph(grid, sources, surfaceBound);
  relaxToEquilibrium(field, graph, sourceValue, retention, maximumPasses);
  for (const index of graph.cells) {
    if (field.values[index] >= field.physics.epsilon) addActive(field, index);
  }
}

export function restoreChemical(
  field: ChemicalField,
  values: readonly number[],
  active: readonly number[]
): void {
  if (values.length !== active.length) throw new Error("chemical checkpoint mismatch");
  field.values.fill(0);
  field.activeFlags.fill(0);
  field.activeCount = 0;
  for (let offset = 0; offset < active.length; offset++) {
    const index = active[offset];
    field.values[index] = values[offset];
    addActive(field, index);
  }
}

export function activeIndices(field: ChemicalField): number[] {
  return Array.from(field.activeList.subarray(0, field.activeCount));
}

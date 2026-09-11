import { type World } from "../sim/types";

export const FAMILY_GENERATIONS = 4;
interface Branch {
  generation: number;
  family: number;
}
const indexes = new WeakMap<World, Map<number, Branch>>();

function indexFor(world: World) {
  let index = indexes.get(world);
  if (!index) {
    index = new Map();
    indexes.set(world, index);
  }
  return index;
}

function addBranch(world: World, index: Map<number, Branch>, id: number) {
  const parent = world.ancestry.get(id)!.parent;
  const previous = parent === null ? null : index.get(parent)!;
  const generation = previous === null ? 0 : previous.generation + 1;
  const family = generation % FAMILY_GENERATIONS === 0 ? id : previous!.family;
  index.set(id, { generation, family });
}

export function branch(world: World, id: number): Branch {
  const index = indexFor(world);
  const path: number[] = [];
  let cursor: number | null = id;
  while (cursor !== null && !index.has(cursor)) {
    path.push(cursor);
    const record = world.ancestry.get(cursor);
    if (!record) throw new Error(`Missing ancestor ${cursor}`);
    cursor = record.parent;
  }
  while (path.length) addBranch(world, index, path.pop()!);
  return index.get(id)!;
}

export function relatedness(world: World, a: number, b: number) {
  if (!world.ancestry.has(a) || !world.ancestry.has(b)) return null;
  let left: number | null = a,
    right: number | null = b;
  let leftDepth = branch(world, a).generation,
    rightDepth = branch(world, b).generation;
  let links = 0;
  while (left !== null && right !== null) {
    if (left === right) return { ancestor: left, links };
    if (leftDepth >= rightDepth) {
      left = world.ancestry.get(left)!.parent;
      leftDepth--;
    } else {
      right = world.ancestry.get(right)!.parent;
      rightDepth--;
    }
    links++;
  }
  return null;
}

export function familyCounts(world: World): [number, number][] {
  const counts = new Map<number, number>();
  for (const cell of world.cells) {
    const id = branch(world, cell.id).family;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
}
export function familyOrigin(world: World, id: number) {
  const root = world.ancestry.get(id)!;
  return {
    born: root.born,
    generation: branch(world, id).generation,
    parent: root.parent === null ? null : branch(world, root.parent).family,
  };
}
export function continuesThroughChildren(world: World, id: number): boolean {
  return world.cells.some((cell) => relatedness(world, id, cell.id)?.ancestor === id);
}

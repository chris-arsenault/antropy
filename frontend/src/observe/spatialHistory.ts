import { type Cell, type Point, type World } from "../sim/types";
import { traitValues } from "./traits";
import { groupCenter, spatialGroups } from "./spatialGroups";

export interface PopulationRegion extends Point {
  id: number;
  born: number;
  established: number | null;
  members: number[];
  origins: number[];
  lineages: [number, number][];
  foodA: number;
}
export interface SpatialEvent extends Point {
  tick: number;
  kind: "appearance" | "founding" | "split" | "merge" | "migration" | "dissolved";
  population: number;
  others: number[];
  cells: number;
}
export interface RegionSample extends Point {
  id: number;
  count: number;
  foodA: number;
}
export interface SpatialFrame {
  tick: number;
  population: number;
  births: number;
  deaths: number;
  dispersers: number;
  regions: RegionSample[];
}
export interface SpatialHistory {
  schemaVersion: 1;
  tick: number;
  nextId: number;
  regions: PopulationRegion[];
  origins: [number, number][];
  events: SpatialEvent[];
  frames: SpatialFrame[];
  eventsDropped: number;
}
const histories = new WeakMap<World, SpatialHistory>();
export const emptySpatialHistory = (): SpatialHistory => ({
  schemaVersion: 1,
  tick: -1,
  nextId: 1,
  regions: [],
  origins: [],
  events: [],
  frames: [],
  eventsDropped: 0,
});
export function spatialHistory(world: World): SpatialHistory {
  let history = histories.get(world);
  if (!history) {
    history = emptySpatialHistory();
    histories.set(world, history);
  }
  return history;
}
export function restoreSpatialHistory(world: World, history: SpatialHistory): void {
  histories.set(world, structuredClone(history));
}

function previousOrigin(
  world: World,
  id: number,
  origins: Map<number, number>
): number | undefined {
  let cursor: number | null = id;
  while (cursor !== null) {
    const origin = origins.get(cursor);
    if (origin !== undefined) return origin;
    cursor = world.ancestry.get(cursor)?.parent ?? null;
  }
  return undefined;
}
function region(
  world: World,
  cells: Cell[],
  id: number,
  old: PopulationRegion | undefined,
  origins: number[]
): PopulationRegion {
  const lineages = new Map<number, number>();
  for (const cell of cells) lineages.set(cell.lineage, (lineages.get(cell.lineage) ?? 0) + 1);
  return {
    ...groupCenter(world, cells),
    id,
    born: old?.born ?? world.tick,
    established: old?.established ?? null,
    members: cells.map((c) => c.id),
    origins: old?.origins ?? origins,
    lineages: [...lineages],
    foodA: cells.reduce((s, c) => s + traitValues(world, c.genome).foodA, 0) / cells.length,
  };
}
function addEvent(
  h: SpatialHistory,
  world: World,
  r: PopulationRegion,
  kind: SpatialEvent["kind"],
  others: number[] = [],
  cells = r.members.length
): void {
  h.events.push({ tick: world.tick, kind, population: r.id, others, cells, x: r.x, y: r.y });
}

/** Observe at a fixed tick cadence; persistence and rendering never advance this history. */
export function observeSpatial(world: World, force = false): SpatialHistory {
  const h = spatialHistory(world);
  if (h.tick === world.tick || (!force && h.tick >= 0 && world.tick - h.tick < 25)) return h;
  const origins = new Map(h.origins);
  const groups = spatialGroups(world);
  const votes = groups.map((cells) => {
    const counts = new Map<number, number>();
    for (const cell of cells) {
      const old = previousOrigin(world, cell.id, origins);
      if (old !== undefined) counts.set(old, (counts.get(old) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  });
  const previous = new Map(h.regions.map((r) => [r.id, r]));
  const matches = matchRegions(votes, previous);
  const regions = groups.map((cells, i) => {
    const id = matches.get(i) ?? h.nextId++;
    const r = region(
      world,
      cells,
      id,
      previous.get(id),
      votes[i].map(([origin]) => origin)
    );
    recordChanges(h, world, r, cells, previous, origins, votes[i]);
    return r;
  });
  const represented = new Set(votes.flatMap((entries) => entries.map(([id]) => id)));
  for (const old of h.regions) if (!represented.has(old.id)) addEvent(h, world, old, "dissolved");
  finishSample(h, world, regions, origins);
  return h;
}

function matchRegions(votes: [number, number][][], previous: Map<number, PopulationRegion>) {
  const pairs = votes
    .flatMap((entries, group) => entries.map(([id, count]) => ({ group, id, count })))
    .filter((p) => previous.has(p.id))
    .sort((a, b) => b.count - a.count || a.id - b.id || a.group - b.group);
  const matches = new Map<number, number>(),
    used = new Set<number>();
  for (const p of pairs)
    if (!matches.has(p.group) && !used.has(p.id)) {
      matches.set(p.group, p.id);
      used.add(p.id);
    }
  return matches;
}
function recordChanges(
  h: SpatialHistory,
  world: World,
  r: PopulationRegion,
  cells: Cell[],
  previous: Map<number, PopulationRegion>,
  origins: Map<number, number>,
  votes: [number, number][]
): void {
  const other = votes.map(([id]) => id).filter((id) => id !== r.id);
  if (!previous.has(r.id))
    addEvent(h, world, r, other.some((id) => previous.has(id)) ? "split" : "appearance", other);
  if (votes.filter(([id]) => previous.has(id)).length > 1) addEvent(h, world, r, "merge", other);
  if (r.established === null && cells.some((c) => c.parent !== null && c.born >= r.born)) {
    r.established = world.tick;
    addEvent(h, world, r, "founding", r.origins);
  }
  const migrants = previous.has(r.id) ? votes.filter(([id]) => id !== r.id) : [];
  for (const [id, count] of migrants) addEvent(h, world, r, "migration", [id], count);
  for (const cell of cells) origins.set(cell.id, r.id);
}
function finishSample(
  h: SpatialHistory,
  world: World,
  regions: PopulationRegion[],
  origins: Map<number, number>
) {
  h.origins = world.cells.flatMap((c) => {
    const origin = previousOrigin(world, c.id, origins);
    return origin === undefined ? [] : [[c.id, origin] as [number, number]];
  });
  h.regions = regions;
  h.tick = world.tick;
  if (h.events.length > 2048) {
    h.eventsDropped += h.events.length - 2048;
    h.events = h.events.slice(-2048);
  }
  const frame: SpatialFrame = {
    tick: world.tick,
    population: world.cells.length,
    births: world.ledger.births,
    deaths: world.ledger.deaths,
    dispersers: world.cells.length - regions.reduce((n, r) => n + r.members.length, 0),
    regions: regions.map((r) => ({
      id: r.id,
      x: r.x,
      y: r.y,
      count: r.members.length,
      foodA: r.foodA,
    })),
  };
  h.frames.push(frame);
  if (h.frames.length > 240)
    h.frames = h.frames.filter((_, i) => i % 2 === 0 || i === h.frames.length - 1);
}

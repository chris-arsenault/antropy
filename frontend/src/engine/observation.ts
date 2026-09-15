import { type EngineWorld } from "./client";
import { type PopulationSample, type Region, type SpatialState, type SpatialEvent } from "./types";

interface Group extends Pick<Region, "x" | "y" | "membraneX" | "members" | "lineages"> {
  votes: [number, number][];
  youngestDescendant: number | null;
}
interface Census {
  tick: number;
  regions: Group[];
  origins: [number, number][];
  population: PopulationSample;
}
export const emptySpatial = (): SpatialState => ({
  tick: -1,
  nextId: 1,
  regions: [],
  origins: [],
  events: [],
  dropped: 0,
});

function matches(groups: Group[], previous: Map<number, Region>) {
  const pairs = groups
    .flatMap((g, group) => g.votes.map(([id, count]) => ({ group, id, count })))
    .filter((p) => previous.has(p.id))
    .sort((a, b) => b.count - a.count || a.id - b.id || a.group - b.group);
  const result = new Map<number, number>(),
    used = new Set<number>();
  for (const p of pairs)
    if (!result.has(p.group) && !used.has(p.id)) {
      result.set(p.group, p.id);
      used.add(p.id);
    }
  return result;
}
function event(
  h: SpatialState,
  tick: number,
  r: Region,
  kind: SpatialEvent["kind"],
  others: number[] = [],
  cells = r.members.length
) {
  h.events.push({ tick, population: r.id, kind, x: r.x, y: r.y, cells, others });
}
function changes(
  h: SpatialState,
  tick: number,
  r: Region,
  group: Group,
  previous: Map<number, Region>
) {
  const other = group.votes.map(([id]) => id).filter((id) => id !== r.id);
  if (!previous.has(r.id))
    event(h, tick, r, other.some((id) => previous.has(id)) ? "split" : "appearance", other);
  if (group.votes.filter(([id]) => previous.has(id)).length > 1) event(h, tick, r, "merge", other);
  if (
    r.established === null &&
    group.youngestDescendant !== null &&
    group.youngestDescendant >= r.born
  ) {
    r.established = tick;
    event(h, tick, r, "founding", r.origins);
  }
  const migrants = previous.has(r.id) ? group.votes.filter(([id]) => id !== r.id) : [];
  for (const [id, count] of migrants) event(h, tick, r, "migration", [id], count);
}
/** The worker receives reduced groups at tick boundaries; physical cells remain in WASM. */
export function observe(world: EngineWorld, h: SpatialState): PopulationSample {
  const census = world.command<Census>("census", { origins: h.origins });
  if (h.tick === census.tick) return census.population;
  const previous = new Map(h.regions.map((r) => [r.id, r])),
    match = matches(census.regions, previous);
  const origins = new Map(census.origins);
  const regions = census.regions.map((g, i) => {
    const id = match.get(i) ?? h.nextId++,
      old = previous.get(id);
    const r: Region = {
      x: g.x,
      y: g.y,
      members: g.members,
      lineages: g.lineages,
      membraneX: g.membraneX,
      id,
      born: old?.born ?? census.tick,
      established: old?.established ?? null,
      origins: old?.origins ?? g.votes.map(([key]) => key),
    };
    changes(h, census.tick, r, g, previous);
    for (const member of r.members) origins.set(member, r.id);
    return r;
  });
  const represented = new Set(census.regions.flatMap((g) => g.votes.map(([id]) => id)));
  for (const old of h.regions)
    if (!represented.has(old.id)) event(h, census.tick, old, "dissolved");
  h.regions = regions;
  h.origins = [...origins];
  h.tick = census.tick;
  if (h.events.length > 2048) {
    h.dropped += h.events.length - 2048;
    h.events = h.events.slice(-2048);
  }
  return census.population;
}
export function regionSummaries(h: SpatialState) {
  return h.regions.map(({ members, ...r }) => ({ ...r, count: members.length }));
}
export function currentPopulation(world: EngineWorld) {
  return world.command<Census>("census").population;
}

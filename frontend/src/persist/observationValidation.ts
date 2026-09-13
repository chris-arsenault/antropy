import {
  type SpatialHistory,
  type PopulationRegion,
  type RegionSample,
} from "../observe/spatialHistory";
import { type PopulationHistory, type PopulationPoint } from "../observe/populationHistory";
import { TRAITS, EFFORTS } from "../observe/traits";
import { CLUSTER_TRAITS } from "../observe/clusters";

function requireValue(ok: boolean, label: string): void {
  if (!ok) throw new Error(`Invalid observation ${label}`);
}
function number(value: number, min = 0, max = Number.MAX_SAFE_INTEGER): void {
  requireValue(Number.isFinite(value) && value >= min && value <= max, "number");
}
function integer(value: number, min = 0, max = Number.MAX_SAFE_INTEGER): void {
  number(value, min, max);
  requireValue(Number.isSafeInteger(value), "integer");
}
function list<T>(value: T[], cap: number): T[] {
  requireValue(Array.isArray(value) && value.length <= cap, "list");
  return value;
}
function ids(value: number[], cap = 100000): void {
  for (const id of list(value, cap)) integer(id, 1);
}
function pairs(value: [number, number][]): void {
  for (const pair of list(value, 100000)) {
    requireValue(Array.isArray(pair) && pair.length === 2, "pair");
    integer(pair[0], 1);
    integer(pair[1], 1);
  }
}
function position(value: { x: number; y: number; foodA: number }): void {
  number(value.x);
  number(value.y);
  number(value.foodA, 0, 100);
}
function region(value: PopulationRegion, h: SpatialHistory): void {
  integer(value.id, 1, h.nextId - 1);
  integer(value.born, 0, h.tick);
  if (value.established !== null) integer(value.established, value.born, h.tick);
  position(value);
  ids(value.members);
  ids(value.origins);
  pairs(value.lineages);
}
function sample(value: RegionSample, h: SpatialHistory): void {
  integer(value.id, 1, h.nextId - 1);
  integer(value.count, 1, 100000);
  position(value);
}
export function validateSpatial(h: SpatialHistory, tick: number): void {
  requireValue(!!h && h.schemaVersion === 1, "schema");
  requireValue(Number.isSafeInteger(h.tick) && h.tick >= -1 && h.tick <= tick, "clock");
  integer(h.nextId, 1);
  integer(h.eventsDropped);
  for (const r of list(h.regions, 33334)) region(r, h);
  pairs(h.origins);
  for (const e of list(h.events, 2048)) {
    requireValue(
      ["appearance", "founding", "split", "merge", "migration", "dissolved"].includes(e.kind),
      "event"
    );
    integer(e.tick, 0, h.tick);
    integer(e.population, 1, h.nextId - 1);
    integer(e.cells, 0, 100000);
    number(e.x);
    number(e.y);
    ids(e.others);
  }
  for (const frame of list(h.frames, 240)) {
    counters(frame, h.tick);
    integer(frame.dispersers, 0, frame.population);
    for (const r of list(frame.regions, 33334)) sample(r, h);
  }
}
function counters(
  value: { tick: number; population: number; births: number; deaths: number },
  tick: number
): void {
  integer(value.tick, 0, tick);
  integer(value.population, 0, 100000);
  integer(value.births);
  integer(value.deaths);
}
function traits(point: PopulationPoint): void {
  requireValue(list(point.traits, TRAITS.length).length === TRAITS.length, "traits");
  point.traits.forEach((t, i) => {
    requireValue(
      t.key === TRAITS[i].key && typeof t.label === "string" && typeof t.unit === "string",
      "trait"
    );
    number(t.ceiling);
    for (const n of list(t.bins, 10)) integer(n);
    if (t.stats)
      for (const key of ["min", "max", "mean", "p10", "median", "p90"] as const)
        number(t.stats[key]);
  });
  requireValue(list(point.efforts, EFFORTS.length).length === EFFORTS.length, "efforts");
  point.efforts.forEach((e, i) => {
    requireValue(e.key === EFFORTS[i], "effort");
    for (const n of list(e.bins, 10)) integer(n);
  });
}
export function validatePopulation(p: PopulationHistory, tick: number): void {
  requireValue(!!p, "population");
  for (const point of [...list(p.history, 240), ...list(p.recent, 21)]) {
    counters(point, tick);
    pairs(point.lineages);
    pairs(point.families);
    traits(point);
    for (const c of list(point.strategies, 3)) {
      integer(c.rank, 0, 2);
      integer(c.size, 1, 100000);
      integer(c.leftBand, 0, c.size);
      integer(c.medoid, 0, 99999);
      for (const key of CLUSTER_TRAITS) number(c.center[key]);
    }
  }
}

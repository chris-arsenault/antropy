import { type ObservationState, type Region, type SpatialEvent, type HistoryPoint } from "./types";

function check(condition: boolean): asserts condition {
  if (!condition) throw new Error("Invalid retained observation");
}
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const count = (v: unknown): v is number => finite(v) && Number.isSafeInteger(v) && v >= 0;
function list(value: unknown, limit: number): asserts value is unknown[] {
  check(Array.isArray(value) && value.length <= limit);
}
function numbers(value: unknown, limit: number) {
  list(value, limit);
  check(value.every((v) => finite(v) && v >= 0));
}
function pairs(value: unknown, limit: number) {
  list(value, limit);
  for (const p of value) {
    list(p, 2);
    check(p.length === 2 && p.every(count));
  }
}
function region(r: Region, tick: number) {
  check(!!r && count(r.id) && finite(r.x) && finite(r.y) && finite(r.membraneX));
  check(count(r.born) && r.born <= tick);
  check(
    r.established === null ||
      (count(r.established) && r.established >= r.born && r.established <= tick)
  );
  numbers(r.members, 100000);
  check(r.members.every(count));
  numbers(r.origins, 100000);
  pairs(r.lineages, 100000);
}
function event(e: SpatialEvent, tick: number) {
  check(!!e && count(e.tick) && e.tick <= tick && count(e.population) && count(e.cells));
  check(
    finite(e.x) &&
      finite(e.y) &&
      ["appearance", "split", "merge", "migration", "founding", "dissolved"].includes(e.kind)
  );
  numbers(e.others, 100000);
}
function point(p: HistoryPoint, previous: number, tick: number) {
  check(!!p && count(p.tick) && p.tick > previous && p.tick <= tick);
  check(
    [p.population, p.divisions, p.deaths, p.regionCount].every(count) &&
      finite(p.biomass) &&
      p.biomass >= 0
  );
  numbers(p.traits, 9);
  check(p.traits.length === 9);
  histogram(p.membrane, 16, p.population);
  pairs(p.families, 64);
  pairs(p.lineages, 64);
  list(p.regions, 64);
  for (const r of p.regions)
    check(!!r && count(r.id) && count(r.count) && [r.x, r.y, r.membraneX].every(finite));
}
function histogram(values: number[], length: number, population: number) {
  numbers(values, length);
  check(values.length === length && values.every(count));
  check(values.reduce((sum, n) => sum + n, 0) === population);
}
export function validateObservation(o: ObservationState, tick: number) {
  check(!!o && typeof o.runId === "string" && o.runId.length > 0 && o.runId.length <= 128);
  list(o.history, 240);
  validateRecent(o.recent, tick);
  let previous = -1;
  for (const p of o.history) {
    point(p, previous, tick);
    previous = p.tick;
  }
  validateSpatial(o.spatial, tick);
  list(o.executions, 64);
  check(o.executions.length > 0);
  previous = -1;
  for (const e of o.executions) {
    check(!!e && count(e.tick) && e.tick >= previous && e.tick <= tick);
    check(typeof e.digest === "string" && /^(?:[0-9a-f]{64}|unidentified)$/.test(e.digest));
    previous = e.tick;
  }
}
function validateRecent(recent: ObservationState["recent"], tick: number) {
  list(recent, 81);
  let previous = -1;
  for (const p of recent) {
    check(count(p.tick) && p.tick > previous && p.tick <= tick && p.tick >= tick - 2024);
    check(count(p.population));
    list(p.bins, 7);
    check(p.bins.length === 7);
    for (const bins of p.bins) {
      numbers(bins, 10);
      check(bins.length === 10 && bins.every(count));
      check(bins.reduce((sum, n) => sum + n, 0) === p.population);
    }
    previous = p.tick;
  }
}
function validateSpatial(h: ObservationState["spatial"], tick: number) {
  check(
    !!h && count(h.tick) && h.tick <= tick && count(h.nextId) && h.nextId > 0 && count(h.dropped)
  );
  list(h.regions, 33333);
  list(h.events, 2048);
  pairs(h.origins, 100000);
  for (const r of h.regions) {
    region(r, h.tick);
    check(r.id < h.nextId);
  }
  const members = h.regions.flatMap((r) => r.members);
  check(members.length <= 100000 && new Set(members).size === members.length);
  for (const e of h.events) event(e, h.tick);
}

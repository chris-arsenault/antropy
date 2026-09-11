import { type World } from "../sim/types";

export interface SourceSegment {
  tick: number;
  source: string;
}
export interface Provenance {
  version: 1;
  segments: SourceSegment[];
}
const hotData = import.meta.hot?.data;
// Preserve execution history when development hot reload replaces this module.
const histories =
  (hotData?.histories as WeakMap<World, Provenance> | undefined) ??
  new WeakMap<World, Provenance>();
if (hotData) hotData.histories = histories;

/** This is execution provenance, never an input to the organism or physical model. */
export function noteExecution(world: World, source: string): void {
  const history = histories.get(world) ?? {
    version: 1,
    segments: [{ tick: 0, source: "unknown" }],
  };
  const last = history.segments[history.segments.length - 1];
  if (last.source !== source) {
    if (last.tick === world.tick) history.segments.pop();
    history.segments.push({ tick: world.tick, source });
  }
  histories.set(world, history);
}
export function provenance(world: World): Provenance | undefined {
  const value = histories.get(world);
  return value && structuredClone(value);
}
export function restoreProvenance(world: World, value: unknown): void {
  if (value === undefined) return;
  if (!value || typeof value !== "object") throw new Error("Invalid provenance");
  const p = value as Provenance;
  if (!validHistory(p)) throw new Error("Invalid provenance history");
  let previous = -1;
  for (const s of p.segments) {
    if (!validSegment(s) || s.tick <= previous || s.tick > world.tick)
      throw new Error("Invalid provenance segment");
    previous = s.tick;
  }
  if (p.segments[0].tick !== 0) throw new Error("Missing provenance origin");
  histories.set(world, structuredClone(p));
}
function validHistory(p: Provenance): boolean {
  return p.version === 1 && Array.isArray(p.segments) && p.segments.length > 0;
}
function validSegment(s: SourceSegment): boolean {
  return (
    !!s &&
    Number.isSafeInteger(s.tick) &&
    typeof s.source === "string" &&
    s.source.length > 0 &&
    s.source.length <= 256
  );
}

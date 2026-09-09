import { BEHAVIOR_COUNTS, type BehaviorState, type BehaviorEvent } from "../sim/colony/behavior";
import { REQUESTS, RESULTS } from "../sim/colony/contract";

export function validateBehavior(
  value: BehaviorState,
  tick: number,
  width: number,
  height: number
): void {
  const integer = (v: number) => Number.isSafeInteger(v) && v >= 0;
  if (
    !value ||
    !value.counts ||
    !BEHAVIOR_COUNTS.every((k) => integer(value.counts[k])) ||
    !Array.isArray(value.recent) ||
    value.recent.length > 64
  )
    throw new Error("invalid behavior ledger");
  for (const e of value.recent) {
    validateEvent(e, tick, width, height);
  }
}

function validateEvent(e: BehaviorEvent, tick: number, width: number, height: number): void {
  const bounded = (n: number, max: number) => Number.isSafeInteger(n) && n >= 0 && n < max;
  if (
    !e ||
    !bounded(e.tick, tick + 1) ||
    !bounded(e.ant, Number.MAX_SAFE_INTEGER) ||
    !bounded(e.x, width) ||
    !bounded(e.y, height) ||
    !validFields(e)
  )
    throw new Error("invalid behavior event");
}

function validFields(e: BehaviorEvent): boolean {
  const destination = (v: number | null) => v === null || Number.isSafeInteger(v);
  return (
    BEHAVIOR_COUNTS.includes(e.kind) &&
    REQUESTS.includes(e.action) &&
    RESULTS.includes(e.result) &&
    destination(e.from) &&
    destination(e.to) &&
    [e.cargo, e.oldQuantity].every((n) => Number.isFinite(n) && n >= 0)
  );
}

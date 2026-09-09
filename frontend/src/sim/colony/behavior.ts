import { type World, type Ant } from "../types";
import { type ActionResult, type Request } from "./contract";
import { cellIndex } from "../grid";
import { isInterior } from "../terrain";

export const BEHAVIOR_COUNTS = [
  "departures",
  "loadedReturns",
  "emptyReturns",
  "collections",
  "routeChanges",
  "depletedDepartures",
  "cuts",
  "handoffs",
  "recoveries",
  "spoilPlacements",
  "focusStarts",
  "focusEnds",
  "signals",
] as const;
export type BehaviorKind = (typeof BEHAVIOR_COUNTS)[number];
export interface BehaviorEvent {
  tick: number;
  ant: number;
  kind: BehaviorKind;
  x: number;
  y: number;
  action: Request["kind"];
  result: ActionResult;
  cargo: number;
  from: number | null;
  to: number | null;
  oldQuantity: number;
}
export interface BehaviorState {
  counts: Record<BehaviorKind, number>;
  recent: BehaviorEvent[];
}
export function createBehavior(): BehaviorState {
  return {
    counts: Object.fromEntries(BEHAVIOR_COUNTS.map((k) => [k, 0])) as BehaviorState["counts"],
    recent: [],
  };
}
export function behaviorBefore(world: World, ant: Ant) {
  const destination = ant.decision.route?.destination ?? null;
  const target = world.knowledge.locations.get(destination!);
  return {
    inside: isInterior(world.grid, cellIndex(world.grid, ant.x, ant.y)),
    destination,
    targetKind: target?.kind,
    quantity: target?.quantity ?? 0,
  };
}

/** Instrumentation only. Controllers never receive these global totals or events. */
export function recordBehavior(
  world: World,
  ant: Ant,
  request: Request,
  result: ActionResult,
  before: ReturnType<typeof behaviorBefore>
): void {
  const next = ant.decision.route?.destination ?? null;
  const event = (kind: BehaviorKind) => {
    world.behavior.counts[kind]++;
    world.behavior.recent.push({
      tick: world.tick,
      ant: ant.id,
      kind,
      x: ant.x,
      y: ant.y,
      action: request.kind,
      result,
      cargo: ant.cargo,
      from: before.destination,
      to: next,
      oldQuantity: before.quantity,
    });
    if (world.behavior.recent.length > 64) world.behavior.recent.shift();
  };
  crossingEvents(world, ant, before.inside).forEach(event);
  if (before.destination !== next) {
    event("routeChanges");
    if (before.targetKind === "food" && before.quantity <= 0.25) event("depletedDepartures");
  }
  if (result !== "success") return;
  const kind = actionEvent(request.kind);
  if (kind) event(kind);
}

function crossingEvents(world: World, ant: Ant, before: boolean): BehaviorKind[] {
  const inside = isInterior(world.grid, cellIndex(world.grid, ant.x, ant.y));
  if (before === inside) return [];
  if (!inside) return ["departures"];
  return [ant.cargo > 0 ? "loadedReturns" : "emptyReturns"];
}

function actionEvent(action: Request["kind"]): BehaviorKind | null {
  const events: Partial<Record<Request["kind"], BehaviorKind>> = {
    pickup: "collections",
    dig: "cuts",
    "drop-spoil": "handoffs",
    "recover-spoil": "recoveries",
    "deposit-spoil": "spoilPlacements",
    "remember-site": "focusStarts",
    "forget-site": "focusEnds",
    "pheromone-b": "signals",
  };
  return events[action] ?? null;
}

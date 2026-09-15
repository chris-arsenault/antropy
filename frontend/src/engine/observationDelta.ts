import { type BehaviorSample, type HistoryPoint, type Inspection, type LiveStatus } from "./types";

export interface ObservationView {
  status: LiveStatus | null;
  inspection: Inspection | null;
}
interface HistoryDelta<T> {
  keep: number[];
  append: T[];
}
export interface ObservationDelta {
  status: Partial<Omit<LiveStatus, "history" | "recent">>;
  history: HistoryDelta<HistoryPoint> | null;
  recent: HistoryDelta<BehaviorSample> | null;
  inspection: { reset: boolean; patch: Partial<Inspection> | null } | null;
}

function changed<T extends object>(before: T | null, after: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(after).filter(([key, value]) => value !== before?.[key as keyof T])
  ) as Partial<T>;
}

function historyDelta<T>(before: T[], after: T[]): HistoryDelta<T> | null {
  if (before === after) return null;
  const previous = new Map(before.map((p, i) => [p, i]));
  return {
    keep: after.filter((p) => previous.has(p)).map((p) => previous.get(p)!),
    append: after.filter((p) => !previous.has(p)),
  };
}

export function observationDelta(
  before: ObservationView,
  after: ObservationView
): ObservationDelta {
  const { history, recent, ...status } = after.status!;
  const samePopulation = before.status?.population === status.population;
  const patch = changed(before.status, status);
  if (samePopulation) {
    delete patch.regions;
    delete patch.spatialEvents;
  }
  return {
    status: patch,
    history: historyDelta(before.status?.history ?? [], history),
    recent: historyDelta(before.status?.recent ?? [], recent),
    inspection: inspectionDelta(before.inspection, after.inspection),
  };
}

function inspectionDelta(before: Inspection | null, after: Inspection | null) {
  if (before === after) return null;
  const reset = before?.ancestor.id !== after?.ancestor.id;
  const previous = reset ? null : before;
  return { reset, patch: after ? changed(previous, after) : null };
}

export function applyObservation(
  before: ObservationView,
  delta: ObservationDelta
): ObservationView {
  const history = delta.history
    ? [...delta.history.keep.map((i) => before.status!.history[i]), ...delta.history.append].sort(
        (a, b) => a.tick - b.tick
      )
    : before.status!.history;
  const inspection = delta.inspection;
  const recent = delta.recent
    ? [...delta.recent.keep.map((i) => before.status!.recent[i]), ...delta.recent.append].sort(
        (a, b) => a.tick - b.tick
      )
    : before.status!.recent;
  return {
    status: { ...before.status, ...delta.status, history, recent } as LiveStatus,
    inspection: inspection ? mergeInspection(before.inspection, inspection) : before.inspection,
  };
}

function mergeInspection(
  before: Inspection | null,
  update: NonNullable<ObservationDelta["inspection"]>
) {
  if (!update.patch) return null;
  return { ...(update.reset ? null : before), ...update.patch } as Inspection;
}

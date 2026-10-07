import { type LiveStatus } from "./types";

type ObjectValue = Record<string, unknown>;
function history<T extends { tick: number }>(before: T[], patch: unknown): T[] {
  const delta = patch as { keep: number[]; append: T[] };
  if (!Array.isArray(delta.keep) || !Array.isArray(delta.append))
    throw new Error("Invalid remote history delta");
  const old = new Map(before.map((p) => [p.tick, p]));
  const kept = delta.keep.map((tick) => {
    const point = old.get(tick);
    if (!point) throw new Error("Missing remote history baseline");
    return point;
  });
  return [...kept, ...delta.append].sort((a, b) => a.tick - b.tick);
}
export function applyRemoteStatus(before: LiveStatus | null, patch: ObjectValue): LiveStatus {
  const { history: points, recent, ...status } = patch;
  const previousHistory = before?.history ?? [];
  const previousRecent = before?.recent ?? [];
  return {
    ...before,
    ...(status as Partial<LiveStatus>),
    history: points ? history(previousHistory, points) : previousHistory,
    recent: recent ? history(previousRecent, recent) : previousRecent,
  } as LiveStatus;
}

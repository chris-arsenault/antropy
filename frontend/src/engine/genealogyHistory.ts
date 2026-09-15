import { type HistoryPoint, type LiveStatus } from "./types";

export type GroupKind = "families" | "lineages";
export type SharePoint = Pick<HistoryPoint, "tick" | "population" | GroupKind>;

/** The same stable identity hues as the map's founder and family modes. */
export function identityColor(id: number) {
  const hue = (id * 0.618033988749895) % 1;
  const rgb = [0, 4, 2].map((offset) => {
    const k = (hue * 6 + offset) % 6;
    return Math.round(255 * (0.9 - 0.65 * Math.max(0, Math.min(k, 4 - k, 1))));
  });
  return `rgb(${rgb.join(",")})`;
}

/** An omitted group is zero only when the snapshot accounts for the entire population. */
export function countAt(point: SharePoint, kind: GroupKind, id: number): number | null {
  const rows = point[kind],
    found = rows.find(([key]) => key === id);
  if (found) return found[1];
  return rows.reduce((sum, [, n]) => sum + n, 0) === point.population ? 0 : null;
}
export function shareAt(point: SharePoint, kind: GroupKind, id: number): number | null {
  const count = countAt(point, kind, id);
  return count === null || point.population === 0 ? null : (100 * count) / point.population;
}
export function shareHistory(status: LiveStatus, kind: GroupKind): SharePoint[] {
  const p = status.population;
  const current: SharePoint = {
    tick: p.tick,
    population: p.traits[0].bins.reduce((sum, n) => sum + n, 0),
    families: p.families.rows,
    lineages: p.lineages.rows,
  };
  const from = kind === "families" ? current.tick - 2000 : 0;
  return [...status.history.filter((h) => h.tick >= from && h.tick < current.tick), current];
}
export function chartGroups(points: SharePoint[], kind: GroupKind): number[] {
  const peak = new Map<number, number>();
  for (const p of points)
    for (const [id, n] of p[kind])
      peak.set(id, Math.max(peak.get(id) ?? 0, n / Math.max(1, p.population)));
  const ids = new Set(points[points.length - 1][kind].slice(0, 2).map(([id]) => id));
  for (const [id] of [...peak].sort((a, b) => b[1] - a[1] || a[0] - b[0])) {
    if (ids.size >= 6) break;
    ids.add(id);
  }
  return [...ids];
}
export function sharePath(points: SharePoint[], kind: GroupKind, id: number, ceiling: number) {
  const first = points[0].tick,
    span = Math.max(1, points[points.length - 1].tick - first);
  let path = "",
    connected = false;
  for (const p of points) {
    const share = shareAt(p, kind, id);
    if (share === null) {
      connected = false;
      continue;
    }
    const x = 32 + (260 * (p.tick - first)) / span,
      y = 92 - (80 * share) / ceiling;
    path += `${connected ? "L" : "M"}${x},${y} `;
    connected = true;
  }
  return path.trim();
}

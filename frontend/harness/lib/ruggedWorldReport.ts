import { type RecognitionProfile } from "../../src/engine/bindingTypes";
import { type CellState } from "../../src/engine/types";

export interface Capability {
  recognition: RecognitionProfile;
  body: number[];
  routes: {
    slot: number;
    substrate: number;
    binding: number;
    catalytic: number;
    products: [number, number][];
  }[];
}
export interface Neighborhood {
  parent: Capability;
  children: Capability[];
}
function peakChanges(child: RecognitionProfile, parent: RecognitionProfile) {
  return child.sites.filter((r, i) =>
    r.preferred.some((v, j) => v !== parent.sites[i].preferred[j])
  ).length;
}
const quantiles = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: values.length,
    min: sorted[0],
    median: sorted[Math.floor(sorted.length / 2)],
    p90: sorted[Math.floor(0.9 * (sorted.length - 1))],
    max: sorted.at(-1),
  };
};
const dense = (profile: RecognitionProfile) =>
  profile.sites.flatMap((site) => {
    const row = Array<number>(256).fill(0);
    for (const [s, a] of site.affinities) row[s] = a;
    return row;
  });

export function neighborhoodReport(rows: Neighborhood[]) {
  const effects = rows.flatMap(({ parent, children }) => {
    const before = dense(parent.recognition);
    return children.map((child) => {
      const after = dense(child.recognition);
      const changes = after.map((a, i) => Math.abs(a - before[i]));
      const protection = child.recognition.susceptibility.map((a, s) =>
        Math.abs(a - parent.recognition.susceptibility[s])
      );
      return {
        meanAffinityChange: changes.reduce((a, b) => a + b, 0) / changes.length,
        maxAffinityChange: Math.max(...changes),
        maxProtectionChange: Math.max(...protection),
        activeSupport: child.recognition.sites.reduce((a, r) => a + r.affinities.length, 0),
        routeCount: child.routes.length,
        peakChanges: peakChanges(child.recognition, parent.recognition),
      };
    });
  });
  return {
    births: effects.length,
    effects,
    distributions: Object.fromEntries(
      Object.keys(effects[0]).map((key) => [
        key,
        quantiles(effects.map((r) => r[key as keyof typeof r])),
      ])
    ),
    limitations:
      "Per-birth effects across all compiled sites and identities; support/routes describe opportunities, not fuel or fitness",
  };
}

export interface LocalCell {
  cell: CellState;
  local: number[];
  stressLoad: number;
}
export function cosine(a: number[], b: number[]) {
  const aa = a.reduce((s, v) => s + v * v, 0),
    bb = b.reduce((s, v) => s + v * v, 0);
  return aa && bb ? a.reduce((s, v, i) => s + v * b[i], 0) / Math.sqrt(aa * bb) : null;
}
export function localPairs(cells: LocalCell[], width: number, height: number) {
  const delta = (a: number, b: number, size: number) =>
    Math.min(Math.abs(a - b), size - Math.abs(a - b));
  return cells.flatMap((a) => {
    const b = cells
      .filter((b) => a.cell.id !== b.cell.id)
      .sort(
        (b, c) =>
          Math.hypot(delta(a.cell.x, b.cell.x, width), delta(a.cell.y, b.cell.y, height)) -
          Math.hypot(delta(a.cell.x, c.cell.x, width), delta(a.cell.y, c.cell.y, height))
      )[0];
    if (!b) return [];
    return [
      {
        cells: [a.cell.id, b.cell.id],
        genomes: [a.cell.genome, b.cell.genome],
        distance: Math.hypot(delta(a.cell.x, b.cell.x, width), delta(a.cell.y, b.cell.y, height)),
        mixtureCosine: cosine(a.local, b.local),
        localAmounts: [a.local.reduce((s, v) => s + v, 0), b.local.reduce((s, v) => s + v, 0)],
        importedCosine: cosine(a.cell.chemicalFlows.imported, b.cell.chemicalFlows.imported),
        consumedCosine: cosine(a.cell.chemicalFlows.consumed, b.cell.chemicalFlows.consumed),
        stress: [a.stressLoad, b.stressLoad],
        damage: [a.cell.damage, b.cell.damage],
        limitations:
          "Nearest spatial neighbors; current local mixture versus lifetime chemical flows, not demonstrated strategies",
      },
    ];
  });
}

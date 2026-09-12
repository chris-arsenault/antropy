/**
 * Strategy clusters: living cells grouped by inherited construction targets. Deterministic
 * k-means on standardized traits; ranks are ordered by A share of processing. This is a view of
 * the population and an assay input. It never touches the kernel, randomness or reproduction.
 */
import { type World } from "../sim/types";
import { traitValues } from "./traits";

export const CLUSTER_TRAITS = [
  "foodA",
  "motor",
  "core",
  "defense",
  "weapon",
  "builder",
  "photo",
] as const;
export type ClusterTrait = (typeof CLUSTER_TRAITS)[number];
export type Point = number[];

export function standardize(points: Point[]): Point[] {
  const n = Math.max(1, points.length);
  const mean = CLUSTER_TRAITS.map((_, j) => points.reduce((s, p) => s + p[j], 0) / n);
  const std = CLUSTER_TRAITS.map((_, j) =>
    Math.sqrt(points.reduce((s, p) => s + (p[j] - mean[j]) ** 2, 0) / n)
  );
  return points.map((p) => p.map((v, j) => (v - mean[j]) / (std[j] > 1e-9 ? std[j] : 1)));
}
export const squared = (a: Point, b: Point): number =>
  a.reduce((s, v, j) => s + (v - b[j]) ** 2, 0);

/** Seeds are evenly spaced ranks along the first trait, so the result is reproducible. */
export function kmeans(points: Point[], k: number): { labels: number[]; centers: Point[] } {
  const order = [...points.keys()].sort((a, b) => points[a][0] - points[b][0]);
  let centers = Array.from(
    { length: k },
    (_, j) => points[order[Math.floor(((j + 0.5) * points.length) / k)]]
  );
  let labels = points.map(() => 0);
  for (let iteration = 0; iteration < 100; iteration++) {
    labels = points.map((p) => {
      let best = 0;
      for (let j = 1; j < k; j++) if (squared(p, centers[j]) < squared(p, centers[best])) best = j;
      return best;
    });
    const next = centers.map((c, j) => {
      const members = points.filter((_, i) => labels[i] === j);
      return members.length
        ? CLUSTER_TRAITS.map((_, d) => members.reduce((s, p) => s + p[d], 0) / members.length)
        : c;
    });
    const moved = next.some((c, j) => squared(c, centers[j]) > 1e-12);
    centers = next;
    if (!moved) break;
  }
  return { labels, centers };
}

export interface StrategyCluster {
  rank: number;
  size: number;
  leftBand: number;
  center: Record<ClusterTrait, number>;
  /** Index into `world.cells` of the member closest to the standardized centre. */
  medoid: number;
}
export interface StrategySnapshot {
  k: number;
  /** Cluster rank per living cell, in `world.cells` order. */
  ranks: number[];
  clusters: StrategyCluster[];
}
export const CLUSTER_PALETTE = ["#ff9f43", "#54c0ff", "#7ed957", "#e884ff", "#ffe066"];
export const clusterColor = (rank: number) => CLUSTER_PALETTE[rank % CLUSTER_PALETTE.length];

/** Clusters living cells; returns an empty snapshot for fewer cells than clusters. */
export function strategyClusters(world: World, k = 3): StrategySnapshot {
  const cells = world.cells;
  if (cells.length < k) return { k, ranks: cells.map(() => 0), clusters: [] };
  const cache = new Map<number, ReturnType<typeof traitValues>>();
  const raw = cells.map((c) => {
    let t = cache.get(c.genome);
    if (!t) {
      t = traitValues(world, c.genome);
      cache.set(c.genome, t);
    }
    return CLUSTER_TRAITS.map((key) => t![key]);
  });
  const points = standardize(raw);
  const { labels, centers } = kmeans(points, k);
  const ranked = [...centers.keys()].sort((a, b) => centers[a][0] - centers[b][0]);
  const rankOf = new Map(ranked.map((j, rank) => [j, rank]));
  const clusters: StrategyCluster[] = [];
  for (const [rank, j] of ranked.entries()) {
    const members = [...cells.keys()].filter((i) => labels[i] === j);
    if (!members.length) continue;
    const medoid = members.reduce((best, i) =>
      squared(points[i], centers[j]) < squared(points[best], centers[j]) ? i : best
    );
    clusters.push({
      rank,
      size: members.length,
      leftBand: members.filter((i) => cells[i].x < world.config.width / 2).length,
      center: Object.fromEntries(
        CLUSTER_TRAITS.map((key, d) => [
          key,
          members.reduce((s, i) => s + raw[i][d], 0) / members.length,
        ])
      ) as StrategyCluster["center"],
      medoid,
    });
  }
  return { k, ranks: labels.map((j) => rankOf.get(j)!), clusters };
}

import { expect, it } from "vitest";
import { createWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { checkpointToJson } from "../persist/checkpoint";
import { kmeans, strategyClusters } from "./clusters";

it("separates two constructed processing splits into ranked clusters without touching state", () => {
  const w = createWorld(3, { ...DEFAULT_CONFIG, founders: 12 });
  const founder = w.genomes.get(1)!;
  const variant = (foodA: number, foodB: number) => ({
    chromosomes: founder.genome.chromosomes.map((c) => {
      const physical = c.physical.slice();
      physical[2] = foodA;
      physical[4] = foodB;
      return { behavior: c.behavior, physical };
    }),
  });
  w.genomes.set(2, { ...founder, id: 2, genome: variant(0.4, -0.9) });
  w.genomes.set(3, { ...founder, id: 3, genome: variant(-1.4, 0.8) });
  for (const [i, cell] of w.cells.entries()) {
    cell.genome = i % 2 ? 2 : 3;
    cell.x = i % 2 ? 10 : 70;
  }
  const before = checkpointToJson(w);
  const snapshot = strategyClusters(w, 2);
  expect(checkpointToJson(w)).toBe(before);
  expect(snapshot.clusters.map((c) => c.size)).toEqual([6, 6]);
  expect(snapshot.clusters[0].center.foodA).toBeLessThan(snapshot.clusters[1].center.foodA);
  expect(snapshot.clusters[0].leftBand).toBe(0);
  expect(snapshot.clusters[1].leftBand).toBe(6);
  expect(new Set(snapshot.ranks)).toEqual(new Set([0, 1]));
  expect(strategyClusters(w, 2)).toEqual(snapshot);
});
it("k-means is deterministic and keeps one center per requested cluster", () => {
  const points = [0, 1, 2, 10, 11, 12].map((v) => [v, 0, 0, 0, 0, 0]);
  const a = kmeans(points, 2),
    b = kmeans(points, 2);
  expect(a).toEqual(b);
  expect(a.labels.slice(0, 3)).toEqual([a.labels[0], a.labels[0], a.labels[0]]);
  expect(a.labels[3]).not.toBe(a.labels[0]);
  expect(a.centers).toHaveLength(2);
});

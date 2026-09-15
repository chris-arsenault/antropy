import { expect, it } from "vitest";
import { chartGroups, countAt, shareAt, sharePath, type SharePoint } from "./genealogyHistory";

function point(tick: number, population: number, families: [number, number][]): SharePoint {
  return { tick, population, families, lineages: families };
}
it("distinguishes zero membership, an unretained group and an empty population", () => {
  expect(countAt(point(0, 4, [[1, 4]]), "families", 2)).toBe(0);
  expect(countAt(point(0, 4, [[1, 3]]), "families", 2)).toBeNull();
  expect(shareAt(point(0, 0, []), "lineages", 2)).toBeNull();
  expect(shareAt(point(0, 10, [[1, 3]]), "lineages", 1)).toBe(30);
});
it("leaves gaps for missing coverage instead of inventing extinction and recovery", () => {
  const points = [
    point(0, 10, [
      [1, 5],
      [2, 5],
    ]),
    point(25, 10, [[2, 9]]),
    point(50, 10, [
      [1, 2],
      [2, 8],
    ]),
  ];
  const path = sharePath(points, "families", 1, 100);
  expect(path.match(/M/g)).toHaveLength(2);
  expect(path).not.toContain("L");
  expect(path).not.toContain("NaN");
});
it("keeps previously prominent families in the chart after membership moves to descendants", () => {
  const points = [
    point(0, 10, [
      [1, 9],
      [2, 1],
    ]),
    point(25, 10, [
      [3, 8],
      [2, 2],
    ]),
  ];
  expect(chartGroups(points, "families")).toEqual([3, 2, 1]);
  expect(countAt(points[1], "families", 1)).toBe(0);
  expect(sharePath(points, "families", 1, 100)).toContain("L292,92");
});

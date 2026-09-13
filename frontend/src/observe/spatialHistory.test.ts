import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { checkpointToJson, restoreWorld } from "../persist/checkpoint";
import { observeSpatial, restoreSpatialHistory } from "./spatialHistory";
import { spatialGroups } from "./spatialGroups";
import { makeCell } from "../sim/reproduction";

function fixture() {
  const w = createWorld(1, {
    ...DEFAULT_CONFIG,
    width: 80,
    height: 40,
    founders: 7,
    sourceCount: 0,
  });
  w.cells.forEach((c, i) => {
    c.x = i < 3 ? 10 + i : 40 + i;
    c.y = 10;
  });
  w.cells[6].x = 65;
  return w;
}
it("groups physical neighbors across the periodic seam and leaves lone migrants visible", () => {
  const w = fixture();
  w.cells[0].x = 79;
  w.cells[1].x = 0;
  w.cells[2].x = 1;
  const groups = spatialGroups(w);
  expect(groups.map((g) => g.length)).toEqual([3, 3]);
  const h = observeSpatial(w);
  expect(h.frames[0].dispersers).toBe(1);
  expect(h.regions[0].x).toBeCloseTo(0);
});
it("retains identity through movement and records mergers and splits without changing organisms", () => {
  const w = fixture();
  const initial = structuredClone(observeSpatial(w));
  const id = initial.regions[0].id;
  w.tick = 25;
  w.cells.slice(3, 6).forEach((c, i) => {
    c.x = 13 + i;
  });
  let h = observeSpatial(w);
  expect(h.regions).toHaveLength(1);
  expect(h.regions[0].id).toBe(id);
  expect(h.events.some((e) => e.kind === "merge")).toBe(true);
  expect(h.events.some((e) => e.kind === "dissolved")).toBe(false);
  w.tick = 50;
  w.cells.slice(3, 6).forEach((c, i) => {
    c.x = 43 + i;
  });
  h = observeSpatial(w);
  expect(h.regions).toHaveLength(2);
  expect(h.events.some((e) => e.kind === "split")).toBe(true);
  expect(w.cells.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});
it("restores population identity and reports founding only after local births", () => {
  const w = fixture();
  const h = observeSpatial(w);
  expect(h.events.some((e) => e.kind === "founding")).toBe(false);
  const restored = restoreWorld(checkpointToJson(w));
  restoreSpatialHistory(restored, h);
  restored.tick = 25;
  const continued = observeSpatial(restored);
  expect(continued.regions.map((r) => r.id)).toEqual(h.regions.map((r) => r.id));
  expect(continued.events).toEqual(h.events);
  restored.cells.push(
    makeCell(restored, { x: 11, y: 11 }, restored.cells[0], restored.cells[0].genome)
  );
  restored.tick = 50;
  expect(observeSpatial(restored).events.filter((e) => e.kind === "founding")).toHaveLength(1);
});
it("calls a group dissolved without claiming its remaining cells are extinct", () => {
  const w = fixture();
  observeSpatial(w);
  w.tick = 25;
  w.cells[2].x = 65;
  const h = observeSpatial(w);
  expect(h.events.filter((e) => e.kind === "dissolved")).toHaveLength(1);
  expect(w.cells).toHaveLength(7);
});
it("observation and repeated rendering reads leave exact simulation continuation unchanged", () => {
  const w = fixture();
  const reference = restoreWorld(checkpointToJson(w));
  for (let i = 0; i < 30; i++) {
    stepWorld(w);
    observeSpatial(w);
    stepWorld(reference);
  }
  expect(checkpointToJson(w)).toBe(checkpointToJson(reference));
});

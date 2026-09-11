import { expect, it } from "vitest";
import { createWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import {
  fitCamera,
  transform,
  worldPoint,
  zoomAt,
  panBy,
  pickCell,
  boundaryImages,
} from "./camera";

const bounds = { width: 80, height: 60 },
  view = { width: 1000, height: 600 };
it("fits one complete world and bounds pan rather than wrapping into another tile", () => {
  const camera = fitCamera(bounds),
    t = transform(bounds, camera, view);
  expect(t.left).toBeGreaterThan(0);
  expect(t.top).toBeGreaterThan(0);
  expect(t.left + bounds.width * t.scale).toBeLessThan(view.width);
  expect(t.top + bounds.height * t.scale).toBeLessThan(view.height);
  expect(panBy(bounds, camera, view, 10000, -10000)).toEqual(camera);
  const zoom = { ...camera, zoom: 3 },
    panned = panBy(bounds, zoom, view, -10000, 10000);
  expect(panned.x).toBeGreaterThan(camera.x);
  expect(panned.x).toBeLessThan(bounds.width);
  expect(panned.y).toBeGreaterThan(0);
  expect(panned.y).toBeLessThan(camera.y);
  expect(panBy(bounds, panned, view, -10000, 10000)).toEqual(panned);
});
it("anchors wheel zoom at the pointer, including after resize clamps a stale camera", () => {
  const camera = { x: 43, y: 28, zoom: 3 },
    pointer = { x: 420, y: 240 };
  const before = worldPoint(bounds, camera, view, pointer);
  const zoomed = zoomAt(bounds, camera, view, pointer, 1.5);
  const after = worldPoint(bounds, zoomed, view, pointer);
  expect(after.x).toBeCloseTo(before.x, 12);
  expect(after.y).toBeCloseTo(before.y, 12);
  const reset = zoomAt(bounds, { ...camera, x: -1000 }, view, pointer, 0.001);
  expect(reset).toEqual(fitCamera(bounds));
});
it("picks visible seam fragments but cannot select through the outside margin", () => {
  const world = createWorld(1, { ...DEFAULT_CONFIG, founders: 1 }),
    cell = world.cells[0];
  cell.x = 0.1;
  cell.y = 30;
  const camera = fitCamera(bounds),
    t = transform(bounds, camera, view);
  const at = (x: number, y: number) => ({ x: t.left + x * t.scale, y: t.top + y * t.scale });
  expect(pickCell(world, camera, view, at(-0.05, 30))).toBeNull();
  expect(pickCell(world, camera, view, at(0.15, 30))).toBe(cell.id);
  expect(pickCell(world, camera, view, at(79.9, 30))).toBe(cell.id);
  expect(boundaryImages({ x: 40, y: 30 }, 0.5, bounds)).toHaveLength(1);
  expect(boundaryImages(cell, 0.5, bounds)).toHaveLength(2);
});

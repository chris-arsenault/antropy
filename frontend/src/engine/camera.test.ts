import { expect, it } from "vitest";
import { fitCamera, scaleFor, worldPoint, panBy, zoomAt } from "./camera";
const bounds = { width: 80, height: 60 },
  view = { width: 1000, height: 600 };
it("fits one world and bounds pan to its visible margins", () => {
  const camera = fitCamera(bounds),
    scale = scaleFor(bounds, view, 1);
  expect(scale * 80).toBeLessThan(view.width);
  expect(scale * 60).toBeLessThan(view.height);
  expect(panBy(bounds, camera, view, 10000, -10000)).toEqual(camera);
  const panned = panBy(bounds, { ...camera, zoom: 3 }, view, -10000, 10000);
  expect(panned.x).toBeGreaterThan(camera.x);
  expect(panned.x).toBeLessThan(bounds.width);
  expect(panned.y).toBeGreaterThan(0);
  expect(panned.y).toBeLessThan(camera.y);
  expect(panBy(bounds, panned, view, -10000, 10000)).toEqual(panned);
});
it("anchors zoom at the pointer and fits an over-panned camera when zooming out", () => {
  const camera = { x: 43, y: 28, zoom: 3 },
    pointer = { x: 420, y: 240 };
  const before = worldPoint(bounds, camera, view, pointer),
    zoomed = zoomAt(bounds, camera, view, pointer, 1.5);
  const after = worldPoint(bounds, zoomed, view, pointer);
  expect(after.x).toBeCloseTo(before.x, 12);
  expect(after.y).toBeCloseTo(before.y, 12);
  expect(zoomAt(bounds, { ...camera, x: -1000 }, view, pointer, 0.001)).toEqual(fitCamera(bounds));
});

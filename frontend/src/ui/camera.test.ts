import { expect, it } from "vitest";
import { fitCamera, zoomCamera, panCamera, viewTransform } from "./camera";

it("keeps the world point under the cursor fixed while zooming", () => {
  const before = { x: 100, y: 50, scale: 3 },
    dx = 120,
    dy = -70;
  const after = zoomCamera(before, 2, dx, dy);
  expect(after.x + dx / after.scale).toBeCloseTo(before.x + dx / before.scale);
  expect(after.y - dy / after.scale).toBeCloseTo(before.y - dy / before.scale);
});

it("pans both axes independently of world height and device pixel ratio", () => {
  const camera = panCamera({ x: 100, y: 50, scale: 2 }, 20, 40);
  expect(camera).toEqual({ x: 90, y: 70, scale: 2 });
  const one = viewTransform(camera, 600, 400, 1),
    two = viewTransform(camera, 600, 400, 2);
  expect(two.startY).toBe(one.startY);
  expect(two.scale).toBe(one.scale * 2);
  expect(fitCamera({ x: 0, y: 0, width: 2048, height: 512 }, 1024, 256).scale).toBe(0.5);
});

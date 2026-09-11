import { type Point, type World } from "../sim/types";
import { radius } from "../sim/geometry";

export interface Camera extends Point {
  zoom: number;
}
export interface Bounds {
  width: number;
  height: number;
}
const PADDING = 16;
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
export const fitCamera = (bounds: Bounds): Camera => ({
  x: bounds.width / 2,
  y: bounds.height / 2,
  zoom: 1,
});
function scaleFor(bounds: Bounds, view: Bounds, zoom: number): number {
  return (
    Math.min(
      Math.max(1, view.width - 2 * PADDING) / bounds.width,
      Math.max(1, view.height - 2 * PADDING) / bounds.height
    ) * zoom
  );
}
export function constrainCamera(bounds: Bounds, camera: Camera, view: Bounds): Camera {
  const zoom = clamp(camera.zoom, 1, 12),
    scale = scaleFor(bounds, view, zoom);
  const halfX = Math.min(bounds.width / 2, Math.max(1, view.width - 2 * PADDING) / scale / 2);
  const halfY = Math.min(bounds.height / 2, Math.max(1, view.height - 2 * PADDING) / scale / 2);
  return {
    zoom,
    x: clamp(camera.x, halfX, bounds.width - halfX),
    y: clamp(camera.y, halfY, bounds.height - halfY),
  };
}
export function transform(bounds: Bounds, camera: Camera, view: Bounds) {
  const c = constrainCamera(bounds, camera, view),
    scale = scaleFor(bounds, view, c.zoom);
  return { scale, left: view.width / 2 - c.x * scale, top: view.height / 2 - c.y * scale };
}
export function worldPoint(bounds: Bounds, camera: Camera, view: Bounds, point: Point): Point {
  const t = transform(bounds, camera, view);
  return { x: (point.x - t.left) / t.scale, y: (point.y - t.top) / t.scale };
}
export function panBy(
  bounds: Bounds,
  camera: Camera,
  view: Bounds,
  dx: number,
  dy: number
): Camera {
  const c = constrainCamera(bounds, camera, view),
    scale = scaleFor(bounds, view, c.zoom);
  return constrainCamera(bounds, { ...c, x: c.x - dx / scale, y: c.y - dy / scale }, view);
}
export function zoomAt(
  bounds: Bounds,
  camera: Camera,
  view: Bounds,
  point: Point,
  factor: number
): Camera {
  const anchor = worldPoint(bounds, camera, view, point),
    zoom = clamp(camera.zoom * factor, 1, 12);
  const scale = scaleFor(bounds, view, zoom);
  return constrainCamera(
    bounds,
    {
      zoom,
      x: anchor.x - (point.x - view.width / 2) / scale,
      y: anchor.y - (point.y - view.height / 2) / scale,
    },
    view
  );
}
/** Only boundary-crossing footprints repeat, clipped to the single displayed world. */
export function boundaryImages(point: Point, r: number, bounds: Bounds): Point[] {
  const xs = [point.x],
    ys = [point.y];
  if (point.x < r) xs.push(point.x + bounds.width);
  if (point.x + r > bounds.width) xs.push(point.x - bounds.width);
  if (point.y < r) ys.push(point.y + bounds.height);
  if (point.y + r > bounds.height) ys.push(point.y - bounds.height);
  return xs.flatMap((x) => ys.map((y) => ({ x, y })));
}
export function pickCell(world: World, camera: Camera, view: Bounds, point: Point): number | null {
  const p = worldPoint(world.config, camera, view, point),
    t = transform(world.config, camera, view);
  if (p.x < 0 || p.y < 0 || p.x > world.config.width || p.y > world.config.height) return null;
  let picked: number | null = null,
    nearest = Infinity;
  for (const cell of world.cells) {
    const r = radius(cell, world.config);
    for (const image of boundaryImages(cell, r, world.config)) {
      const distance = Math.hypot(image.x - p.x, image.y - p.y);
      if (distance <= r + 4 / t.scale && distance < nearest) {
        nearest = distance;
        picked = cell.id;
      }
    }
  }
  return picked;
}

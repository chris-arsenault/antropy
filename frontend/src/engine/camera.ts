export interface Bounds {
  width: number;
  height: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface Camera extends Point {
  zoom: number;
}
export const fitCamera = (bounds: Bounds): Camera => ({
  x: bounds.width / 2,
  y: bounds.height / 2,
  zoom: 1,
});
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
export function scaleFor(bounds: Bounds, view: Bounds, zoom: number) {
  return (
    Math.min(
      Math.max(1, view.width - 32) / bounds.width,
      Math.max(1, view.height - 32) / bounds.height
    ) * zoom
  );
}
export function constrainCamera(bounds: Bounds, camera: Camera, view: Bounds): Camera {
  const zoom = clamp(camera.zoom, 1, 12),
    scale = scaleFor(bounds, view, zoom);
  const halfX = Math.min(bounds.width / 2, Math.max(1, view.width - 32) / scale / 2);
  const halfY = Math.min(bounds.height / 2, Math.max(1, view.height - 32) / scale / 2);
  return {
    zoom,
    x: clamp(camera.x, halfX, bounds.width - halfX),
    y: clamp(camera.y, halfY, bounds.height - halfY),
  };
}
export function worldPoint(bounds: Bounds, camera: Camera, view: Bounds, point: Point): Point {
  const c = constrainCamera(bounds, camera, view),
    scale = scaleFor(bounds, view, c.zoom);
  return {
    x: (point.x - view.width / 2) / scale + c.x,
    y: (point.y - view.height / 2) / scale + c.y,
  };
}
export function panBy(bounds: Bounds, camera: Camera, view: Bounds, dx: number, dy: number) {
  const c = constrainCamera(bounds, camera, view),
    scale = scaleFor(bounds, view, c.zoom);
  return constrainCamera(bounds, { ...c, x: c.x - dx / scale, y: c.y - dy / scale }, view);
}
export function zoomAt(bounds: Bounds, camera: Camera, view: Bounds, point: Point, factor: number) {
  const anchor = worldPoint(bounds, camera, view, point),
    zoom = clamp(camera.zoom * factor, 1, 12),
    scale = scaleFor(bounds, view, zoom);
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

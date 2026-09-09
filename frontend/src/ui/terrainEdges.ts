import { type World } from "../sim/types";
import { looseCellOpen } from "../sim/support";
import { type ViewTransform } from "./camera";

/** Keep actual cavity boundaries legible beneath field overlays. */
export function drawTerrainEdges(
  context: CanvasRenderingContext2D,
  world: World,
  view: ViewTransform
): void {
  if (view.scale < 3) return;
  context.strokeStyle = "#ead4b099";
  context.lineWidth = 1;
  context.beginPath();
  const endX = Math.min(world.grid.width, Math.ceil(view.startX + view.width));
  const endY = Math.min(world.grid.height, Math.ceil(view.startY + view.height));
  for (let y = Math.max(0, Math.floor(view.startY)); y < endY; y++)
    for (let x = Math.max(0, Math.floor(view.startX)); x < endX; x++)
      outlineCell(context, world, view, x, y);
  context.stroke();
}

function outlineCell(
  context: CanvasRenderingContext2D,
  world: World,
  view: ViewTransform,
  x: number,
  y: number
): void {
  const open = (dx: number, dy: number) => looseCellOpen(world.grid, x + dx, y + dy);
  if (!open(0, 0)) return;
  const left = view.left + (x - view.startX) * view.scale;
  const top = view.top + (view.startY + view.height - y - 1) * view.scale;
  const right = left + view.scale,
    bottom = top + view.scale;
  const edge = (ax: number, ay: number, bx: number, by: number) => {
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
  };
  if (!open(-1, 0)) edge(left, top, left, bottom);
  if (!open(1, 0)) edge(right, top, right, bottom);
  if (!open(0, 1)) edge(left, top, right, top);
  if (!open(0, -1)) edge(left, bottom, right, bottom);
}

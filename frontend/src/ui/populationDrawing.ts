import { type Cell, type World, type Point } from "../sim/types";
import { radius, distance } from "../sim/geometry";
import { spatialHistory } from "../observe/spatialHistory";
import { GROUP_REACH } from "../observe/spatialGroups";
import { boundaryImages, type Bounds, type Camera, worldPoint } from "./camera";
import { drawCell } from "./cellDrawing";

export interface PopulationView {
  regions: boolean;
  selected: number | null;
}
export const DEFAULT_POPULATION_VIEW: PopulationView = { regions: true, selected: null };
export const regionOpacity = (scale: number) => Math.max(0, Math.min(1, (8 - scale) / 5));

function halo(
  ctx: CanvasRenderingContext2D,
  world: World,
  cell: Cell,
  color: string,
  alpha: number
) {
  const reach = GROUP_REACH / 2;
  for (const p of boundaryImages(cell, reach, world.config)) {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, reach);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = gradient;
    ctx.fillRect(p.x - reach, p.y - reach, reach * 2, reach * 2);
  }
  ctx.globalAlpha = 1;
}
function mark(
  ctx: CanvasRenderingContext2D,
  world: World,
  cell: Cell,
  scale: number,
  color: string
) {
  const r = Math.max(radius(cell, world.config), 1.4 / scale);
  for (const p of boundaryImages(cell, r, world.config)) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
export function drawPopulationCells(
  ctx: CanvasRenderingContext2D,
  world: World,
  scale: number,
  selectedCell: number | null,
  color: (cell: Cell) => string,
  view: PopulationView
): void {
  const history = spatialHistory(world);
  const membership = new Map(
    history.regions.flatMap((r) => r.members.map((id) => [id, r.id] as const))
  );
  const alpha = view.regions ? regionOpacity(scale) : 0;
  for (const cell of world.cells) {
    const c = color(cell);
    const population = membership.get(cell.id);
    if (alpha > 0 && population !== undefined) halo(ctx, world, cell, c, alpha);
    if (radius(cell, world.config) * scale < 3 && cell.id !== selectedCell)
      mark(ctx, world, cell, scale, c);
    else drawCell(ctx, world, cell, selectedCell, scale, c);
  }
  drawSelectedRegion(ctx, world, scale, view);
}
function drawSelectedRegion(
  ctx: CanvasRenderingContext2D,
  world: World,
  scale: number,
  view: PopulationView
) {
  const selected = spatialHistory(world).regions.find((r) => r.id === view.selected);
  if (selected) {
    ctx.fillStyle = "#f3f7ef";
    ctx.font = `${12 / scale}px system-ui`;
    for (const p of boundaryImages(selected, 6, world.config))
      ctx.fillText(`Population ${selected.id} · ${selected.members.length}`, p.x + 2, p.y - 3);
  }
}

export function pickPopulation(
  world: World,
  camera: Camera,
  bounds: Bounds,
  pointer: Point
): number | null {
  const p = worldPoint(world.config, camera, bounds, pointer);
  if (p.x < 0 || p.y < 0 || p.x > world.config.width || p.y > world.config.height) return null;
  const membership = new Map(
    spatialHistory(world).regions.flatMap((r) => r.members.map((id) => [id, r.id] as const))
  );
  let best = GROUP_REACH / 2,
    found: number | null = null;
  for (const cell of world.cells) {
    const d = distance(cell, p, world.config);
    if (d < best && membership.has(cell.id)) {
      best = d;
      found = membership.get(cell.id)!;
    }
  }
  return found;
}

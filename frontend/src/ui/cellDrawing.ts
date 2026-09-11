import { type World, type Cell, type Point } from "../sim/types";
import { radius } from "../sim/geometry";
import { energyCapacity } from "../sim/body";
import { boundaryImages } from "./camera";
import { identityColor } from "./populationColors";

export const lineageColor = identityColor;
const circle = (ctx: CanvasRenderingContext2D, p: Point, r: number) => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
};
function body(
  ctx: CanvasRenderingContext2D,
  world: World,
  cell: Cell,
  p: Point,
  scale: number,
  color: string
) {
  const r = radius(cell, world.config),
    energy = Math.min(1, cell.energy / energyCapacity(cell.body, world.config));
  circle(ctx, p, r);
  ctx.fillStyle = "#101b24";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.min(r * 0.25, 1.5 / scale);
  ctx.stroke();
  circle(ctx, p, r * 0.78 * Math.sqrt(energy));
  const healthyColor = energy < 0.2 ? "#ffb366" : color;
  ctx.fillStyle = cell.damage > 0.2 ? `hsl(${30 * (1 - cell.damage)},85%,60%)` : healthyColor;
  ctx.fill();
  ctx.strokeStyle = "#f6ffff";
  ctx.lineWidth = Math.min(r * 0.22, 1.3 / scale);
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(cell.heading) * r * 0.6, p.y + Math.sin(cell.heading) * r * 0.6);
  ctx.lineTo(p.x + Math.cos(cell.heading) * r, p.y + Math.sin(cell.heading) * r);
  ctx.stroke();
}
export function drawCell(
  ctx: CanvasRenderingContext2D,
  world: World,
  cell: Cell,
  selected: number | null,
  scale: number,
  color: string
): void {
  const r = radius(cell, world.config),
    age = (world.tick - cell.born) * world.config.dt;
  for (const p of boundaryImages(cell, r + 0.7, world.config)) {
    body(ctx, world, cell, p, scale, color);
    if (cell.parent !== null && age < 15) {
      ctx.globalAlpha = (1 - age / 15) * 0.8;
      circle(ctx, p, r + 0.15 + age * 0.035);
      ctx.strokeStyle = "#b8ffc9";
      ctx.lineWidth = 1 / scale;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (cell.id === selected) {
      circle(ctx, p, r + 0.3);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
      if (scale > 12) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${12 / scale}px system-ui`;
        ctx.fillText(`#${cell.id}`, p.x + r + 0.5, p.y);
      }
    }
  }
}
interface DeathMark extends Point {
  tick: number;
}
const died = (world: World, id: number): boolean =>
  ["starvation", "damage"].includes(world.ancestry.get(id)?.cause ?? "");
/** View-local snapshots: never write simulation events or consume simulation randomness. */
export function createLifecycleOverlay() {
  let previous = new Map<number, Point>(),
    marks: DeathMark[] = [],
    lastWorld: World | null = null,
    tick = -1;
  return (ctx: CanvasRenderingContext2D, world: World, scale: number) => {
    if (lastWorld !== world || world.tick < tick) {
      previous.clear();
      marks = [];
    }
    if (lastWorld !== world || world.tick !== tick) {
      const living = new Map(world.cells.map((c) => [c.id, { x: c.x, y: c.y }]));
      for (const [id, point] of previous)
        if (!living.has(id) && died(world, id)) marks.push({ ...point, tick: world.tick });
      marks = marks.filter((m) => (world.tick - m.tick) * world.config.dt < 15).slice(-96);
      previous = living;
      lastWorld = world;
      tick = world.tick;
    }
    ctx.strokeStyle = "#ffb090";
    ctx.lineWidth = 1.5 / scale;
    for (const m of marks) {
      ctx.globalAlpha = 1 - ((world.tick - m.tick) * world.config.dt) / 15;
      ctx.beginPath();
      ctx.moveTo(m.x - 0.4, m.y - 0.4);
      ctx.lineTo(m.x + 0.4, m.y + 0.4);
      ctx.moveTo(m.x - 0.4, m.y + 0.4);
      ctx.lineTo(m.x + 0.4, m.y - 0.4);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
}

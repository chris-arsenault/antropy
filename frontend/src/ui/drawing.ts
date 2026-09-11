import { type World } from "../sim/types";
import { transform, boundaryImages, type Camera, type Bounds } from "./camera";
import { createFieldRaster, type Layers } from "./fieldRaster";
import { createLifecycleOverlay, drawCell } from "./cellDrawing";
import { populationColors, DEFAULT_COLOR_MODE, type ColorMode } from "./populationColors";

export { lineageColor } from "./cellDrawing";
export { type Camera } from "./camera";
export { type Layers } from "./fieldRaster";

function drawSources(ctx: CanvasRenderingContext2D, world: World, scale: number): void {
  ctx.lineWidth = 1 / scale;
  ctx.setLineDash([3 / scale, 4 / scale]);
  for (const deposit of world.sources) {
    if (deposit.remaining <= 0 || deposit.foodA + deposit.foodB <= 0) continue;
    ctx.strokeStyle = deposit.foodA > deposit.foodB ? "#a9e3b080" : "#9bcaff80";
    for (const source of boundaryImages(deposit, deposit.radius, world.config)) {
      ctx.beginPath();
      ctx.arc(source.x, source.y, deposit.radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(source.x - 0.35, source.y);
      ctx.lineTo(source.x + 0.35, source.y);
      ctx.moveTo(source.x, source.y - 0.35);
      ctx.lineTo(source.x, source.y + 0.35);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}
function drawGrid(ctx: CanvasRenderingContext2D, bounds: Bounds, scale: number): void {
  ctx.strokeStyle = "#c0dcea09";
  ctx.lineWidth = 1 / scale;
  ctx.beginPath();
  for (let x = 10; x < bounds.width; x += 10) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, bounds.height);
  }
  for (let y = 10; y < bounds.height; y += 10) {
    ctx.moveTo(0, y);
    ctx.lineTo(bounds.width, y);
  }
  ctx.stroke();
}
function scaleBar(ctx: CanvasRenderingContext2D, view: Bounds, scale: number): void {
  const raw = 90 / scale,
    magnitude = 10 ** Math.floor(Math.log10(raw));
  const units = [5, 2, 1].find((v) => v * magnitude <= raw)! * magnitude;
  const x = 28,
    y = view.height - 28;
  ctx.fillStyle = "#08131de6";
  ctx.fillRect(x - 10, y - 26, Math.max(units * scale + 20, 100), 43);
  ctx.strokeStyle = "#c3d7e2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x, y);
  ctx.lineTo(x + units * scale, y);
  ctx.lineTo(x + units * scale, y - 4);
  ctx.stroke();
  ctx.fillStyle = "#c3d7e2";
  ctx.font = "11px system-ui";
  ctx.fillText(units + " world units", x, y - 9);
}
export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d"),
    raster = createFieldRaster(),
    lifecycle = createLifecycleOverlay();
  return {
    render(
      world: World,
      camera: Camera,
      layers: Layers,
      selected: number | null,
      mode: ColorMode = DEFAULT_COLOR_MODE
    ): void {
      if (!ctx) return;
      const view = {
        width: canvas.clientWidth || canvas.width,
        height: canvas.clientHeight || canvas.height,
      };
      ctx.save();
      ctx.scale(canvas.width / view.width, canvas.height / view.height);
      ctx.fillStyle = "#080f17";
      ctx.fillRect(0, 0, view.width, view.height);
      const t = transform(world.config, camera, view),
        field = raster(world, layers);
      ctx.save();
      ctx.translate(t.left, t.top);
      ctx.scale(t.scale, t.scale);
      ctx.beginPath();
      ctx.rect(0, 0, world.config.width, world.config.height);
      ctx.clip();
      if (field) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(field, 0, 0);
      }
      drawGrid(ctx, world.config, t.scale);
      if (layers.nutrient) drawSources(ctx, world, t.scale);
      lifecycle(ctx, world, t.scale);
      const color = populationColors(world, mode, selected);
      for (const cell of world.cells) drawCell(ctx, world, cell, selected, t.scale, color(cell));
      ctx.restore();
      ctx.strokeStyle = "#7898a766";
      ctx.lineWidth = 1;
      ctx.strokeRect(t.left, t.top, world.config.width * t.scale, world.config.height * t.scale);
      scaleBar(ctx, view, t.scale);
      ctx.restore();
    },
  };
}

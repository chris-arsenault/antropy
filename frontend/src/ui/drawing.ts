import { type World, type Cell } from "../sim/types";
import { radius } from "../sim/geometry";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}
export interface Layers {
  nutrient: boolean;
  chemical: boolean;
}
export const lineageColor = (lineage: number) => `hsl(${(lineage * 137.508) % 360},75%,70%)`;
export function transform(world: World, camera: Camera, width: number, height: number) {
  const scale = Math.min(width / world.config.width, height / world.config.height) * camera.zoom;
  return { scale, left: width / 2 - camera.x * scale, top: height / 2 - camera.y * scale };
}
function paintField(image: ImageData, world: World, layers: Layers): void {
  for (let i = 0; i < world.nutrient.length; i++) {
    const n = layers.nutrient
      ? world.nutrient[i] / (world.nutrient[i] + world.config.nutrientK)
      : 0;
    const s = layers.chemical
      ? world.chemical[i] / (world.chemical[i] + world.config.chemicalK)
      : 0;
    image.data[i * 4] = 12 + 180 * s;
    image.data[i * 4 + 1] = 20 + 130 * n;
    image.data[i * 4 + 2] = 28 + 140 * s + 30 * n;
    image.data[i * 4 + 3] = 255;
  }
}
function createFieldRaster() {
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");
  let image: ImageData | null = null,
    previous: World | null = null,
    tick = -1,
    layerKey = "";
  return (world: World, layers: Layers): HTMLCanvasElement | null => {
    if (!ctx) return null;
    const key = String(layers.nutrient) + String(layers.chemical);
    if (previous === world && tick === world.tick && layerKey === key) return canvas;
    if (!image || canvas.width !== world.config.width || canvas.height !== world.config.height) {
      canvas.width = world.config.width;
      canvas.height = world.config.height;
      image = ctx.createImageData(canvas.width, canvas.height);
    }
    paintField(image, world, layers);
    ctx.putImageData(image, 0, 0);
    previous = world;
    tick = world.tick;
    layerKey = key;
    return canvas;
  };
}
export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d"),
    raster = createFieldRaster();
  return {
    render(world: World, camera: Camera, layers: Layers, selected: number | null): void {
      if (ctx) draw(ctx, world, camera, selected, raster(world, layers));
    },
  };
}
function body(ctx: CanvasRenderingContext2D, world: World, cell: Cell, selected: number | null) {
  const r = radius(cell.mass, world.config);
  ctx.fillStyle = lineageColor(cell.lineage);
  ctx.beginPath();
  ctx.arc(cell.x, cell.y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = "#0d151f";
  ctx.lineWidth = 0.13;
  ctx.beginPath();
  ctx.moveTo(cell.x, cell.y);
  ctx.lineTo(cell.x + Math.cos(cell.heading) * r, cell.y + Math.sin(cell.heading) * r);
  ctx.stroke();
  if (cell.id === selected) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, r + 0.3, 0, 2 * Math.PI);
    ctx.stroke();
  }
}
function draw(
  ctx: CanvasRenderingContext2D,
  world: World,
  camera: Camera,
  selected: number | null,
  field: HTMLCanvasElement | null
): void {
  const { width, height } = ctx.canvas,
    t = transform(world, camera, width, height);
  ctx.fillStyle = "#080f18";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(t.left, t.top);
  ctx.scale(t.scale, t.scale);
  for (const dy of [-world.config.height, 0, world.config.height])
    for (const dx of [-world.config.width, 0, world.config.width]) {
      ctx.save();
      ctx.translate(dx, dy);
      if (field) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(field, 0, 0);
      }
      for (const cell of world.cells) body(ctx, world, cell, selected);
      ctx.strokeStyle = "#8da4b344";
      ctx.lineWidth = 0.08;
      ctx.strokeRect(0, 0, world.config.width, world.config.height);
      ctx.restore();
    }
  ctx.restore();
}

import { terrainRaster } from "./terrainRaster";
import { directionAt } from "../sim/geometry";
import { type ChemicalField, activeIndices, chemicalResponse } from "../sim/scent";
import { Material, MATERIALS } from "../sim/materials";
import { isInterior } from "../sim/terrain";
import { type World } from "../sim/types";
import { type ViewTransform } from "./camera";
import { type LayerVisibility } from "./layerVisibility";
import { drawClimate } from "./climateDrawing";
import { drawTerrainEdges } from "./terrainEdges";
import { adultBodies } from "../sim/adultBody";

function cellTop(_world: World, view: ViewTransform, y: number): number {
  return view.top + (view.startY + view.height - y - 1) * view.scale;
}

function cellLeft(view: ViewTransform, x: number): number {
  return view.left + (x - view.startX) * view.scale;
}

function drawMaterials(context: CanvasRenderingContext2D, world: World, view: ViewTransform): void {
  const raster = terrainRaster(world.grid);
  if (!raster) return;
  const x = Math.max(0, view.startX),
    y = Math.max(0, world.grid.height - view.startY - view.height);
  const width = Math.min(world.grid.width, view.startX + view.width) - x;
  const height = Math.min(world.grid.height, world.grid.height - view.startY) - y;
  if (width <= 0 || height <= 0) return;
  context.imageSmoothingEnabled = false;
  context.drawImage(
    raster,
    x,
    y,
    width,
    height,
    cellLeft(view, x),
    cellTop(world, view, world.grid.height - y - 1),
    width * view.scale,
    height * view.scale
  );
}

function drawFood(context: CanvasRenderingContext2D, world: World, view: ViewTransform): void {
  context.fillStyle = MATERIALS[Material.FOOD].color;
  for (const index of world.foodSources) {
    const x = index % world.grid.width;
    if (x < view.startX || x >= view.startX + view.width) continue;
    const y = Math.floor(index / world.grid.width);
    context.beginPath();
    context.arc(
      cellLeft(view, x) + view.scale / 2,
      cellTop(world, view, y) + view.scale / 2,
      Math.max(1.5, view.scale * Math.min(1.4, 0.3 + Math.sqrt(world.food.get(index) ?? 0) * 0.15)),
      0,
      Math.PI * 2
    );
    context.fill();
    if (isInterior(world.grid, index) && view.scale >= 2) {
      context.fillStyle = "#c4f8a4";
      context.font = "10px sans-serif";
      context.fillText(
        (world.food.get(index) ?? 0).toFixed(1),
        cellLeft(view, x) + 3,
        cellTop(world, view, y) - 2
      );
      context.fillStyle = MATERIALS[Material.FOOD].color;
    }
  }
}

function drawField(
  context: CanvasRenderingContext2D,
  world: World,
  view: ViewTransform,
  field: ChemicalField,
  color: readonly [number, number, number]
): void {
  for (const index of activeIndices(field)) {
    const x = index % world.grid.width;
    if (x < view.startX || x >= view.startX + view.width) continue;
    const strength = chemicalResponse(field.values[index]);
    if (strength < 0.002) continue;
    const y = Math.floor(index / world.grid.width);
    context.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${Math.min(0.5, strength * 0.5)})`;
    context.fillRect(
      cellLeft(view, x),
      cellTop(world, view, y),
      Math.ceil(view.scale),
      Math.ceil(view.scale)
    );
  }
}

function drawFields(
  context: CanvasRenderingContext2D,
  world: World,
  view: ViewTransform,
  layers: LayerVisibility
): void {
  if (layers.foodOdor) drawField(context, world, view, world.foodOdor, [80, 230, 80]);
  if (layers.nestOdor) drawField(context, world, view, world.nestOdor, [255, 165, 40]);
  if (layers.pheromoneA) drawField(context, world, view, world.pheromoneA, [38, 204, 255]);
  if (layers.pheromoneB) drawField(context, world, view, world.pheromoneB, [255, 64, 217]);
  if (layers.freshAir) drawField(context, world, view, world.freshAir, [140, 190, 255]);
}

function drawAnt(context: CanvasRenderingContext2D, world: World, view: ViewTransform): void {
  for (const ant of world.ants) {
    const x = cellLeft(view, ant.x) + view.scale / 2;
    const y = cellTop(world, view, ant.y) + view.scale / 2;
    const direction = directionAt(ant.heading);
    const foodColor = ant.cargo > 0 ? "#d9ff67" : "#f2dfc3";
    context.strokeStyle = ant.spoil !== null ? MATERIALS[ant.spoil].color : foodColor;
    context.fillStyle = "#1c0f09";
    context.lineWidth = Math.max(1.5, view.scale * 0.18);
    context.beginPath();
    context.arc(x, y, Math.max(2.5, view.scale * 0.42), 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + direction.x * view.scale * 0.8, y - direction.y * view.scale * 0.8);
    context.stroke();
  }
}

function drawRoutes(context: CanvasRenderingContext2D, world: World, view: ViewTransform): void {
  context.lineWidth = Math.max(1, view.scale * 0.12);
  for (const ant of adultBodies(world)) {
    const route = ant.decision.route;
    if (!route) continue;
    context.strokeStyle = route.offRoute ? "#dd806088" : "#65dfff88";
    context.beginPath();
    route.cells.forEach((cell, index) => {
      const x = cellLeft(view, cell % world.grid.width) + view.scale / 2;
      const y = cellTop(world, view, Math.floor(cell / world.grid.width)) + view.scale / 2;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }
  context.fillStyle = "#65dfff";
  context.font = "10px sans-serif";
  for (const location of world.knowledge.locations.values())
    context.fillText(
      String(location.id),
      cellLeft(view, location.x),
      cellTop(world, view, location.y)
    );
}

export function resize(canvas: HTMLCanvasElement): void {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

function drawColony(context: CanvasRenderingContext2D, world: World, view: ViewTransform): void {
  if (!world.config.mortalityEnabled) return;
  const queen = world.queen;
  context.fillStyle = queen.alive ? "#f7bc70" : "#76594a";
  const qx = cellLeft(view, queen.x) + view.scale / 2;
  const qy = cellTop(world, view, queen.y) + view.scale / 2;
  context.beginPath();
  context.ellipse(
    qx,
    qy,
    Math.max(4, view.scale * 0.8),
    Math.max(3, view.scale * 0.45),
    -Math.atan2(directionAt(queen.heading).y, directionAt(queen.heading).x),
    0,
    Math.PI * 2
  );
  context.fill();
  context.font = "12px sans-serif";
  context.fillText(queen.alive ? `Queen ${queen.energy.toFixed(1)}` : "Queen dead", qx + 6, qy - 8);
  const colors = { egg: "#ffffff", larva: "#83dbed", pupa: "#cc98ee" };
  for (const brood of world.brood) {
    context.fillStyle = colors[brood.stage];
    context.fillRect(
      cellLeft(view, brood.x),
      cellTop(world, view, brood.y),
      Math.max(2, view.scale * 0.7),
      Math.max(2, view.scale * 0.7)
    );
  }
}

export function drawWorld(
  context: CanvasRenderingContext2D,
  world: World,
  view: ViewTransform,
  layers: LayerVisibility
): void {
  context.fillStyle = "#203342";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  drawMaterials(context, world, view);
  drawClimate(context, world, view, layers);
  drawTerrainEdges(context, world, view);
  drawFood(context, world, view);
  drawFields(context, world, view, layers);
  if (layers.routes) drawRoutes(context, world, view);
  drawColony(context, world, view);
  drawAnt(context, world, view);
  drawConstruction(context, world, view);
}

function drawConstruction(
  context: CanvasRenderingContext2D,
  world: World,
  view: ViewTransform
): void {
  context.lineWidth = 1;
  context.strokeStyle = "#d7a1ff";
  for (const ant of adultBodies(world)) {
    const focus = ant.decision.focus;
    if (focus)
      context.strokeRect(
        cellLeft(view, focus.x),
        cellTop(world, view, focus.y),
        view.scale,
        view.scale
      );
  }
  for (const job of world.construction.jobs) {
    if (["done", "canceled"].includes(job.status)) continue;
    context.strokeStyle = "#ffda74";
    context.strokeRect(cellLeft(view, job.x), cellTop(world, view, job.y), view.scale, view.scale);
    if (job.kind !== "dig") continue;
    context.strokeStyle = "#ab92ef";
    context.strokeRect(
      cellLeft(view, job.dump.x),
      cellTop(world, view, job.dump.y),
      view.scale,
      view.scale
    );
  }
  for (const [index, pile] of world.construction.loose) {
    context.fillStyle = MATERIALS[pile[0]].color;
    context.fillRect(
      cellLeft(view, index % world.grid.width),
      cellTop(world, view, Math.floor(index / world.grid.width)),
      Math.max(2, view.scale * 0.6),
      Math.max(2, view.scale * 0.6)
    );
  }
}

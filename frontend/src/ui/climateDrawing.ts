import { type World } from "../sim/types";
import { climateMesh } from "../sim/climate/mesh";
import { type ViewTransform } from "./camera";
import { type LayerVisibility } from "./layerVisibility";

export function drawClimate(
  context: CanvasRenderingContext2D,
  world: World,
  view: ViewTransform,
  layers: LayerVisibility
): void {
  if (!world.config.environment.microclimate || (!layers.temperature && !layers.moisture)) return;
  const mesh = climateMesh(world.grid, world.config);
  const endY = Math.min(mesh.height, Math.ceil((view.startY + view.height) / mesh.size));
  const endX = Math.min(mesh.width, Math.ceil((view.startX + view.width) / mesh.size));
  for (let y = Math.max(0, Math.floor(view.startY / mesh.size)); y < endY; y++) {
    for (let x = Math.max(0, Math.floor(view.startX / mesh.size)); x < endX; x++) {
      const index = y * mesh.width + x;
      const moisture = Math.min(1, world.climate.water[index] / mesh.waterCapacity[index]);
      const temperature = Math.max(0, Math.min(1, (world.climate.temperature[index] - 10) / 30));
      const hue = layers.temperature ? 240 * (1 - temperature) : 35 + 180 * moisture;
      context.fillStyle = `hsla(${hue}, 90%, 55%, 0.3)`;
      context.fillRect(
        view.left + (x * mesh.size - view.startX) * view.scale,
        view.top + (view.startY + view.height - (y + 1) * mesh.size) * view.scale,
        mesh.size * view.scale,
        mesh.size * view.scale
      );
    }
  }
}

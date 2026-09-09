import { type Grid } from "../sim/grid";
import { Material, MATERIALS } from "../sim/materials";

const images = new WeakMap<Grid, { revision: number; canvas: HTMLCanvasElement }>();

/** Static terrain is rasterized once per material revision, not once per simulation tick. */
export function terrainRaster(grid: Grid): HTMLCanvasElement | null {
  const previous = images.get(grid);
  if (previous?.revision === grid.revision) return previous.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = grid.width;
  canvas.height = grid.height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const pixels = context.createImageData(grid.width, grid.height);
  const colors = Object.values(MATERIALS).map(({ color }) => [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ]);
  for (let index = 0; index < grid.cells.length; index++) {
    const material = grid.cells[index];
    if (material === Material.AIR && grid.backing[index] === Material.AIR) continue;
    const color = material === Material.AIR ? [48, 44, 39] : colors[material];
    const target =
      ((grid.height - 1 - Math.floor(index / grid.width)) * grid.width + (index % grid.width)) * 4;
    pixels.data[target] = color[0];
    pixels.data[target + 1] = color[1];
    pixels.data[target + 2] = color[2];
    pixels.data[target + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  images.set(grid, { revision: grid.revision, canvas });
  return canvas;
}

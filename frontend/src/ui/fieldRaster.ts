import { type World } from "../sim/types";
import { type Config } from "../sim/config";

export interface Layers {
  nutrient: boolean;
  chemical: boolean;
  toxin: boolean;
  matrix: boolean;
}
const concentration = (field: Float64Array, i: number, k: number, show: boolean): number =>
  show ? field[i] / (field[i] + k) : 0;
/** Half intensity where exposure equals maximum repair for the reference body. */
export function toxinIntensity(toxin: number, c: Config): number {
  const injury =
    (c.damageRate * toxin) / (toxin + c.toxinK) / (1 + c.defenseStrength * c.defenseRatio);
  return injury / Math.max(1e-30, injury + c.repairRate);
}
function paintField(image: ImageData, world: World, layers: Layers): void {
  for (let i = 0; i < world.nutrient.length; i++) {
    const n = concentration(world.nutrient, i, world.config.nutrientK, layers.nutrient);
    const s = concentration(world.chemical, i, world.config.chemicalK, layers.chemical);
    const b = concentration(world.nutrientB, i, world.config.nutrientK, layers.nutrient);
    const t = layers.toxin ? toxinIntensity(world.toxin[i], world.config) : 0;
    const m = concentration(world.matrix, i, 0.15, layers.matrix);
    image.data[i * 4] = 9 + 100 * s + 165 * t + 100 * m;
    image.data[i * 4 + 1] = 21 + 105 * n + 40 * b + 75 * m;
    image.data[i * 4 + 2] = 28 + 100 * s + 120 * b + 30 * n + 40 * m;
    image.data[i * 4 + 3] = 255;
  }
}
export function createFieldRaster() {
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");
  let image: ImageData | null = null,
    previous: World | null = null,
    tick = -1,
    layerKey = "";
  return (world: World, layers: Layers): HTMLCanvasElement | null => {
    if (!ctx) return null;
    const key = JSON.stringify(layers);
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

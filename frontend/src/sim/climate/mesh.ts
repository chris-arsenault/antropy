import { type Grid } from "../grid";
import { Material } from "../materials";
import { type SimConfig } from "../config";

export interface ClimateMesh {
  width: number;
  height: number;
  size: number;
  revision: number;
  heatCapacity: Float64Array;
  waterCapacity: Float64Array;
  conductivity: Float64Array;
  permeability: Float64Array;
  exposure: Float64Array;
}

// Relative bulk properties, not species-specific calibration. Backing is a finite half-volume.
const PROPERTIES: Record<Material, readonly number[]> = {
  [Material.AIR]: [1, 1, 0.8, 0.8],
  [Material.SOIL]: [4, 8, 0.25, 0.15],
  [Material.ROCK]: [6, 1, 0.5, 0.005],
  [Material.FOOD]: [2, 2, 0.3, 0.2],
  [Material.CACHE]: [1, 1, 0.8, 0.8],
  [Material.CLAY]: [5, 12, 0.2, 0.02],
  [Material.LOOSE_SOIL]: [2, 5, 0.15, 0.35],
  [Material.WOOD]: [3, 6, 0.08, 0.08],
};
const cache = new WeakMap<Grid, ClimateMesh>();

export function meshIndex(mesh: ClimateMesh, x: number, y: number): number {
  return (
    Math.max(0, Math.min(mesh.height - 1, Math.floor(y / mesh.size))) * mesh.width +
    Math.max(0, Math.min(mesh.width - 1, Math.floor(x / mesh.size)))
  );
}

function accumulate(mesh: ClimateMesh, id: number, material: Material, fraction: number): void {
  const [heat, water, conductivity, permeability] = PROPERTIES[material];
  mesh.heatCapacity[id] += heat * fraction;
  mesh.waterCapacity[id] += water * fraction;
  mesh.conductivity[id] += conductivity * fraction;
  mesh.permeability[id] += permeability * fraction;
}

export function climateMesh(grid: Grid, config: SimConfig): ClimateMesh {
  const old = cache.get(grid),
    size = config.climate.cellSize;
  if (old?.revision === grid.revision && old.size === size) return old;
  const width = Math.ceil(grid.width / size),
    height = Math.ceil(grid.height / size);
  const array = () => new Float64Array(width * height);
  const mesh: ClimateMesh = {
    width,
    height,
    size,
    revision: grid.revision,
    heatCapacity: array(),
    waterCapacity: array(),
    conductivity: array(),
    permeability: array(),
    exposure: array(),
  };
  const count = array();
  for (let x = 0; x < grid.width; x++) {
    let light = 1;
    for (let y = grid.height - 1; y >= 0; y--) {
      const cell = y * grid.width + x,
        id = meshIndex(mesh, x, y);
      const material = grid.cells[cell] as Material;
      accumulate(mesh, id, material, 1);
      accumulate(mesh, id, grid.backing[cell] as Material, 0.5);
      mesh.exposure[id] += light;
      if (![Material.AIR, Material.CACHE, Material.FOOD].includes(material)) light = 0;
      count[id]++;
    }
  }
  for (let i = 0; i < count.length; i++) {
    mesh.exposure[i] /= count[i];
    mesh.conductivity[i] /= count[i] * 1.5;
    mesh.permeability[i] /= count[i] * 1.5;
  }
  cache.set(grid, mesh);
  return mesh;
}

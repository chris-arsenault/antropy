import { type Grid } from "../grid";
import { Material } from "../materials";
import { type ClimateConfig } from "./config";
import { type ClimateMesh, meshIndex } from "./mesh";

/** A finite initial heat load in existing cavities; newly excavated cells are never reheated. */
export function initialTemperature(
  grid: Grid,
  mesh: ClimateMesh,
  config: ClimateConfig
): Float64Array {
  const temperature = new Float64Array(mesh.heatCapacity.length).fill(config.meanTemperature);
  if (config.initialCavityHeat === 0) return temperature;
  const cavities = new Float64Array(temperature.length),
    counts = new Float64Array(temperature.length);
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++) {
      const cell = y * grid.width + x,
        index = meshIndex(mesh, x, y);
      counts[index]++;
      if (
        grid.backing[cell] !== Material.AIR &&
        [Material.AIR, Material.CACHE, Material.FOOD].includes(grid.cells[cell])
      )
        cavities[index]++;
    }
  for (let i = 0; i < temperature.length; i++)
    temperature[i] += (config.initialCavityHeat * cavities[i]) / counts[i];
  return temperature;
}

import { type World, type Cell } from "./types";
import { sample, stencil } from "./fields";
import { bodyRadius, materialCapacity } from "./body";

export function uptakeRate(world: World, cell: Cell, concentration: number): number {
  const c = world.config;
  const kinetics =
    (c.transporterTurnover * cell.body.transport * concentration) / (concentration + c.nutrientK);
  const diffusion = 4 * Math.PI * c.nutrientDiffusion * bodyRadius(cell, c) * concentration;
  return kinetics + diffusion > 0 ? (kinetics * diffusion) / (kinetics + diffusion) : 0;
}
export function absorb(world: World): void {
  const c = world.config,
    demand = new Float64Array(world.nutrient.length);
  const requests = world.cells.map((cell) => {
    const concentration = sample(world.nutrient, cell, c);
    const quantity = Math.max(
      0,
      Math.min(
        uptakeRate(world, cell, concentration) * c.dt,
        materialCapacity(cell.body, c) - cell.reserve
      )
    );
    const sites = stencil(cell, c);
    for (const [i, w] of sites) demand[i] += quantity * w;
    return { cell, quantity, sites };
  });
  const supply = world.nutrient.slice();
  for (const { cell, quantity, sites } of requests)
    for (const [i, w] of sites) {
      const amount = quantity * w * Math.min(1, supply[i] / Math.max(demand[i], 1e-30));
      world.nutrient[i] = Math.max(0, world.nutrient[i] - amount);
      cell.reserve += amount;
    }
}

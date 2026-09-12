import { type World, type Cell } from "./types";
import { sample, stencil } from "./fields";
import { bodyRadius, effectiveStock, materialCapacity } from "./body";
import { flow } from "./observation";

export function uptakeRate(
  world: World,
  cell: Cell,
  concentration: number,
  pathway: "transport" | "transportB" = "transport"
): number {
  const c = world.config;
  const kinetics =
    (c.transporterTurnover * effectiveStock(cell.body, pathway, c) * concentration) /
    (concentration + c.nutrientK);
  const diffusion = 4 * Math.PI * c.nutrientDiffusion * bodyRadius(cell, c) * concentration;
  return kinetics + diffusion > 0
    ? ((1 - cell.damage) * kinetics * diffusion) / (kinetics + diffusion)
    : 0;
}
export function absorb(world: World): void {
  const c = world.config,
    fields = [world.nutrient, world.nutrientB];
  const demand = fields.map((f) => new Float64Array(f.length));
  const requests = world.cells.map((cell) => {
    const quantities = fields.map(
      (field, i) =>
        uptakeRate(world, cell, sample(field, cell, c), i === 0 ? "transport" : "transportB") * c.dt
    );
    const sum = quantities[0] + quantities[1];
    const scale = Math.min(
      1,
      Math.max(0, materialCapacity(cell.body, c) - cell.reserve) / Math.max(sum, 1e-30)
    );
    const sites = stencil(cell, c);
    quantities.forEach((q, food) => {
      quantities[food] = q * scale;
      for (const [i, w] of sites) demand[food][i] += q * scale * w;
    });
    return { cell, quantities, sites };
  });
  const supply = fields.map((f) => f.slice());
  for (const { cell, quantities, sites } of requests)
    quantities.forEach((quantity, food) => {
      for (const [i, w] of sites) {
        const amount =
          quantity * w * Math.min(1, supply[food][i] / Math.max(demand[food][i], 1e-30));
        fields[food][i] = Math.max(0, fields[food][i] - amount);
        cell.reserve += amount;
        world.ledger[food === 0 ? "absorbedA" : "absorbedB"] += amount;
        flow(world, cell, food === 0 ? "food_a" : "food_b", amount);
      }
    });
}

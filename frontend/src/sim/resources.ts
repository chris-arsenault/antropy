import { type World } from "./types";
import { sample, stencil } from "./fields";
import { basal } from "./movement";
import { reserveCapacity } from "./config";

export function absorb(world: World): void {
  const c = world.config,
    demand = new Float64Array(world.nutrient.length);
  const requests = world.cells.map((cell) => {
    const concentration = sample(world.nutrient, cell, c);
    const quantity = Math.max(
      0,
      Math.min(
        (c.uptakeRate * cell.mass * c.dt * concentration) / (concentration + c.nutrientK),
        reserveCapacity(cell.mass, c) - cell.energy
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
      cell.energy += amount;
    }
}
export function metabolize(world: World): void {
  const c = world.config;
  for (const cell of world.cells) {
    const maintenance = Math.min(cell.energy, basal(cell, c));
    cell.energy -= maintenance;
    world.ledger.metabolism += maintenance;
    const surplus = Math.max(0, cell.energy - c.protectedReserve * reserveCapacity(cell.mass, c));
    const growth = Math.max(
      0,
      Math.min(
        c.growthRate * cell.mass * c.dt,
        2 * c.birthMass - cell.mass,
        surplus * c.growthEfficiency
      )
    );
    cell.mass += growth;
    cell.energy -= growth / c.growthEfficiency;
    world.ledger.growthLoss += growth * (1 / c.growthEfficiency - 1);
  }
}
export function total(field: Float64Array): number {
  return field.reduce((a, b) => a + b, 0);
}
export function balance(world: World): number {
  const l = world.ledger;
  const body = world.cells.reduce((sum, cell) => sum + cell.mass + cell.energy, 0);
  return (
    l.initial +
    l.supplied -
    total(world.nutrient) -
    body -
    l.nutrientLoss -
    l.metabolism -
    l.motors -
    l.secretion -
    l.growthLoss -
    l.division -
    l.deathLoss
  );
}

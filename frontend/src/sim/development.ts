import { type World, type Cell } from "./types";
import { BODY_PARTS, basal, energyCapacity, materialCapacity, structuralMass } from "./body";
import { targetBody } from "./phenotype";
import { repairCell } from "./interference";
import { flow } from "./observation";

function catabolize(world: World, cell: Cell): void {
  const c = world.config,
    useful = c.nutrientEnergy * c.catabolicEfficiency;
  const material = Math.max(
    0,
    Math.min(
      cell.reserve,
      c.catabolicRate * cell.body.core * c.dt,
      (energyCapacity(cell.body, c) - cell.energy) / useful
    )
  );
  cell.reserve -= material;
  cell.energy += material * useful;
  world.ledger.metabolicWaste += material;
  world.ledger.catabolismLoss += material * c.nutrientEnergy * (1 - c.catabolicEfficiency);
  flow(world, cell, "catabolized", material);
  flow(world, cell, "catabolic_loss", material * c.nutrientEnergy * (1 - c.catabolicEfficiency));
}
function construct(world: World, cell: Cell): void {
  const c = world.config,
    target = targetBody(world, cell);
  const deficits = BODY_PARTS.map((key) => Math.max(0, 2 * target[key] - cell.body[key]));
  const missing = deficits.reduce((s, v) => s + v, 0);
  const material = Math.max(0, cell.reserve - c.protectedReserve * materialCapacity(cell.body, c));
  const availableEnergy = Math.max(
    0,
    cell.energy - c.protectedReserve * energyCapacity(cell.body, c)
  );
  const quantity = Math.min(
    missing,
    material,
    c.growthRate * structuralMass(cell.body) * c.dt,
    c.constructionEnergy > 0 ? availableEnergy / c.constructionEnergy : Infinity
  );
  if (quantity <= 0) return;
  for (const [i, key] of BODY_PARTS.entries()) cell.body[key] += (quantity * deficits[i]) / missing;
  cell.reserve -= quantity;
  cell.energy -= quantity * c.constructionEnergy;
  world.ledger.constructedMaterial += quantity;
  world.ledger.construction += quantity * c.constructionEnergy;
  flow(world, cell, "constructed", quantity);
  flow(world, cell, "construction", quantity * c.constructionEnergy);
}
export function metabolize(world: World): void {
  for (const cell of world.cells) {
    catabolize(world, cell);
    const cost = Math.min(cell.energy, basal(cell, world.config));
    cell.energy -= cost;
    world.ledger.metabolism += cost;
    flow(world, cell, "maintenance", cost);
    repairCell(world, cell);
    construct(world, cell);
  }
}

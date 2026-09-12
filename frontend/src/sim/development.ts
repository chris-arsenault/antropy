import { type World, type Cell } from "./types";
import { BODY_PARTS, basal, energyCapacity, materialCapacity, structuralMass } from "./body";
import { targetBody } from "./phenotype";
import { repairCell } from "./interference";
import { flow } from "./observation";
import { aerobicFraction, consumeOxygen, lightField, photosynthesize, returnCarbon } from "./cycle";

/**
 * Converts reserve into usable energy. With the element cycle, efficiency interpolates between
 * anaerobic and aerobic by the oxygen available for the rate-limited demand, oxygen is consumed
 * and the carbon returns to the inorganic pool; otherwise the material leaves as waste.
 */
function catabolize(world: World, cell: Cell): void {
  const c = world.config,
    cycle = c.cycle;
  const rateLimit = c.catabolicRate * cell.body.core * c.dt;
  const demand = cycle ? rateLimit * cycle.oxygenPerMaterial : 0;
  const aerobic = aerobicFraction(world, cell, demand);
  const efficiency = cycle
    ? cycle.anaerobicEfficiency + (c.catabolicEfficiency - cycle.anaerobicEfficiency) * aerobic
    : c.catabolicEfficiency;
  const useful = c.nutrientEnergy * efficiency;
  const material = Math.max(
    0,
    Math.min(cell.reserve, rateLimit, (energyCapacity(cell.body, c) - cell.energy) / useful)
  );
  cell.reserve -= material;
  cell.energy += material * useful;
  returnCarbon(world, cell, material);
  if (cycle) consumeOxygen(world, cell, material * cycle.oxygenPerMaterial * aerobic);
  world.ledger.catabolismLoss += material * c.nutrientEnergy * (1 - efficiency);
  flow(world, cell, "catabolized", material);
  flow(world, cell, "catabolic_loss", material * c.nutrientEnergy * (1 - efficiency));
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
  const light = lightField(world);
  for (const cell of world.cells) {
    photosynthesize(world, cell, light);
    catabolize(world, cell);
    const cost = Math.min(cell.energy, basal(cell, world.config));
    cell.energy -= cost;
    world.ledger.metabolism += cost;
    flow(world, cell, "maintenance", cost);
    repairCell(world, cell);
    construct(world, cell);
  }
}

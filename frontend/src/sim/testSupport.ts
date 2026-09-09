import { type World, type Cell } from "./types";
import { targetBody } from "./phenotype";
import { scaleBody, materialCapacity, energyCapacity } from "./body";
import { heldMaterial, heldEnergy } from "./accounting";

/** Explicit initial grants for bounded reproductive mechanics fixtures, never a runtime rescue. */
export function fundDivision(world: World, cell: Cell = world.cells[0]): Cell {
  const material = heldMaterial(world),
    energy = heldEnergy(world);
  cell.body = scaleBody(targetBody(world, cell), 2);
  cell.reserve = materialCapacity(cell.body, world.config) * 0.9;
  cell.energy = energyCapacity(cell.body, world.config) * 0.9;
  world.ledger.initialMaterial += heldMaterial(world) - material;
  world.ledger.initial += heldEnergy(world) - energy;
  return cell;
}

import { type World, type Cell } from "./types";
import { sample } from "./fields";
import { structuralMass } from "./body";
import { flow } from "./observation";

export function damageCells(world: World): void {
  const c = world.config;
  for (const cell of world.cells) {
    const toxin = sample(world.toxin, cell, c);
    const defense = 1 + (c.defenseStrength * cell.body.defense) / cell.body.core;
    const damage = Math.min(
      1 - cell.damage,
      (c.dt * c.damageRate * toxin) / (toxin + c.toxinK) / defense
    );
    cell.damage += damage;
    world.ledger.damageReceived += damage;
    flow(world, cell, "damage", damage);
  }
}
export function repairCell(world: World, cell: Cell): void {
  if (cell.damage >= 1) return;
  const c = world.config,
    mass = structuralMass(cell.body);
  const repaired = Math.min(
    cell.damage,
    c.repairRate * cell.action.repair * c.dt,
    cell.reserve / (mass * c.repairMaterial),
    cell.energy / (mass * c.repairEnergy)
  );
  const material = repaired * mass * c.repairMaterial;
  const energy = repaired * mass * c.repairEnergy;
  cell.damage -= repaired;
  cell.reserve -= material;
  cell.energy -= energy;
  world.ledger.metabolicWaste += material;
  world.ledger.repair += energy + material * c.nutrientEnergy;
  world.ledger.repaired += repaired;
  flow(world, cell, "repaired", repaired);
  flow(world, cell, "repair_material", material);
  flow(world, cell, "repair", energy + material * c.nutrientEnergy);
}

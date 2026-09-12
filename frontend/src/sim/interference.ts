import { type World, type Cell } from "./types";
import { type Config } from "./config";
import { sample } from "./fields";
import { structuralMass } from "./body";
import { distance } from "./geometry";
import { SpatialIndex } from "./spatial";
import { flow } from "./observation";
import { returnCarbon } from "./cycle";

/**
 * Injury divisor: paid defense protects against any toxin, and installed toxin machinery carries
 * its own immunity, as colicin plasmids bundle toxin and immunity genes. Neither is ownership;
 * a producer is protected from every producer's toxin, not only its own.
 */
export function protection(cell: Cell, c: Config): number {
  return (
    1 +
    (c.defenseStrength * cell.body.defense + c.immunityStrength * cell.body.weapon) / cell.body.core
  );
}
const CONTACT_GAP = 0.05;
/**
 * Contact-range exposure: the summed toxin machinery per core of touching neighbours. Colicins
 * act on adjacent cells; this exposure cannot be sensed at a distance and needs no field.
 */
function contactExposure(world: World, cell: Cell, index: SpatialIndex): number {
  const c = world.config,
    near = index.near(cell);
  let total = 0;
  for (let i = 0; i < near.length; i++) {
    const other = near[i];
    if (other === cell || other.body.weapon <= 0) continue;
    if (distance(cell, other, c) <= index.radius(cell) + index.radius(other) + CONTACT_GAP)
      total += other.body.weapon / other.body.core;
  }
  return c.contactDamageRate * total;
}
export function damageCells(world: World): void {
  const c = world.config;
  const index = c.contactDamageRate > 0 ? new SpatialIndex(c, world.cells) : null;
  for (const cell of world.cells) {
    const toxin = sample(world.toxin, cell, c);
    const exposure =
      (c.damageRate * toxin) / (toxin + c.toxinK) +
      (index ? contactExposure(world, cell, index) : 0);
    const damage = Math.min(1 - cell.damage, (c.dt * exposure) / protection(cell, c));
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
  returnCarbon(world, cell, material);
  world.ledger.repair += energy + material * c.nutrientEnergy;
  world.ledger.repaired += repaired;
  flow(world, cell, "repaired", repaired);
  flow(world, cell, "repair_material", material);
  flow(world, cell, "repair", energy + material * c.nutrientEnergy);
}

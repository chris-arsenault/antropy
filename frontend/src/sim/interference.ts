import { type World, type Cell } from "./types";
import { type Config } from "./config";
import { sample } from "./fields";
import { structuralMass } from "./body";
import { distance } from "./geometry";
import { SpatialIndex } from "./spatial";
import { flow } from "./observation";
import { returnCarbon } from "./cycle";
import { protection, typeShares } from "./chemotype";

/** Injury divisor against type A toxin, the only type when `toxinTypes` is 1. */
export const protectionA = (cell: Cell, c: Config): number => protection(cell, c, 1);
const CONTACT_GAP = 0.05;
/** Bodies within a small gap of each other; the range of contact toxin and of predation. */
export function touching(a: Cell, b: Cell, index: SpatialIndex, c: Config): boolean {
  return distance(a, b, c) <= index.radius(a) + index.radius(b) + CONTACT_GAP;
}
/**
 * Contact-range exposure per toxin type: the summed toxin machinery per core of touching
 * neighbours, split by each neighbour's tint. Colicins act on adjacent cells; this exposure
 * cannot be sensed at a distance and needs no field.
 */
function contactExposure(world: World, cell: Cell, index: SpatialIndex): [number, number] {
  const c = world.config,
    near = index.near(cell),
    total: [number, number] = [0, 0];
  for (let i = 0; i < near.length; i++) {
    const other = near[i];
    if (other === cell || other.body.weapon <= 0) continue;
    if (touching(cell, other, index, c)) {
      const shares = typeShares(world, other),
        machinery = other.body.weapon / other.body.core;
      total[0] += machinery * shares[0];
      total[1] += machinery * shares[1];
    }
  }
  return [c.contactDamageRate * total[0], c.contactDamageRate * total[1]];
}
/** Field exposure of one toxin type, before protection. */
function fieldExposure(concentration: number, c: Config): number {
  return (c.damageRate * concentration) / (concentration + c.toxinK);
}
export function damageCells(world: World): void {
  const c = world.config;
  const index = c.contactDamageRate > 0 ? new SpatialIndex(c, world.cells) : null;
  for (const cell of world.cells) {
    const shares = typeShares(world, cell),
      contact = index ? contactExposure(world, cell, index) : [0, 0];
    const exposure =
      (fieldExposure(sample(world.toxin, cell, c), c) + contact[0]) /
        protection(cell, c, shares[0]) +
      (fieldExposure(sample(world.toxinB, cell, c), c) + contact[1]) /
        protection(cell, c, shares[1]);
    const damage = Math.min(1 - cell.damage, c.dt * exposure);
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
  // The material is a product of three factors bounded by reserve; rounding can overshoot by
  // one unit in the last place, which must not leave a negative reserve behind.
  cell.reserve = Math.max(0, cell.reserve - material);
  cell.energy = Math.max(0, cell.energy - energy);
  returnCarbon(world, cell, material);
  world.ledger.repair += energy + material * c.nutrientEnergy;
  world.ledger.repaired += repaired;
  flow(world, cell, "repaired", repaired);
  flow(world, cell, "repair_material", material);
  flow(world, cell, "repair", energy + material * c.nutrientEnergy);
}

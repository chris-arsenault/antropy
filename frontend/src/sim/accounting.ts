import { type Ledger, type World } from "./types";
import { structuralMass } from "./body";

export const total = (field: Float64Array): number => field.reduce((a, b) => a + b, 0);
export function createLedger(): Ledger {
  return {
    initial: 0,
    initialMaterial: 0,
    supplied: 0,
    nutrientLoss: 0,
    metabolism: 0,
    learning: 0,
    motors: 0,
    secretion: 0,
    construction: 0,
    constructedMaterial: 0,
    catabolismLoss: 0,
    metabolicWaste: 0,
    division: 0,
    deathLoss: 0,
    deathMaterial: 0,
    emitted: 0,
    chemicalLoss: 0,
    births: 0,
    deaths: 0,
    divisions: 0,
    mutations: 0,
    recombinations: 0,
    learnedBirths: 0,
    distance: 0,
    turning: 0,
    taskWrites: 0,
    blockedDivisions: 0,
  };
}
export function heldMaterial(world: World): number {
  return (
    total(world.nutrient) +
    total(world.chemical) +
    world.cells.reduce((sum, cell) => sum + structuralMass(cell.body) + cell.reserve, 0)
  );
}
export function heldEnergy(world: World): number {
  return (
    heldMaterial(world) * world.config.nutrientEnergy +
    world.cells.reduce((s, c) => s + c.energy, 0)
  );
}
export function materialBalance(world: World): number {
  const l = world.ledger;
  return (
    l.initialMaterial +
    l.supplied -
    heldMaterial(world) -
    l.metabolicWaste -
    l.nutrientLoss -
    l.chemicalLoss -
    l.deathMaterial
  );
}
export function balance(world: World): number {
  const l = world.ledger,
    q = world.config.nutrientEnergy;
  return (
    l.initial +
    l.supplied * q -
    heldEnergy(world) -
    (l.nutrientLoss + l.chemicalLoss) * q -
    l.metabolism -
    l.learning -
    l.motors -
    l.secretion -
    l.construction -
    l.catabolismLoss -
    l.division -
    l.deathLoss
  );
}

import { type Ledger, type World } from "./types";
import { MATERIAL_FIELDS } from "./types";
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
    toxinEmitted: 0,
    matrixEmitted: 0,
    toxinLoss: 0,
    repair: 0,
    repaired: 0,
    damageReceived: 0,
    damageDeaths: 0,
    absorbedA: 0,
    absorbedB: 0,
    matrixBlocked: 0,
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
    fixed: 0,
    exuded: 0,
    lightEnergy: 0,
    initialOxygen: 0,
    oxygenProduced: 0,
    oxygenConsumed: 0,
    oxygenExchanged: 0,
    carbonExchanged: 0,
  };
}
export function heldMaterial(world: World): number {
  return (
    MATERIAL_FIELDS.reduce((sum, key) => sum + total(world[key]), 0) +
    world.sources.reduce((sum, source) => sum + source.foodA + source.foodB, 0) +
    world.cells.reduce((sum, cell) => sum + structuralMass(cell.body) + cell.reserve, 0)
  );
}
/** Chemical energy of held organic material plus usable energy; inorganic carbon carries none. */
export function heldEnergy(world: World): number {
  return (
    (heldMaterial(world) - total(world.carbon)) * world.config.nutrientEnergy +
    world.cells.reduce((s, c) => s + c.energy, 0)
  );
}
export function materialBalance(world: World): number {
  const l = world.ledger;
  return (
    l.initialMaterial +
    l.supplied +
    l.carbonExchanged -
    heldMaterial(world) -
    l.metabolicWaste -
    l.nutrientLoss -
    l.chemicalLoss -
    l.toxinLoss
  );
}
export function balance(world: World): number {
  const l = world.ledger,
    q = world.config.nutrientEnergy;
  return (
    l.initial +
    l.supplied * q +
    l.lightEnergy -
    heldEnergy(world) -
    (l.nutrientLoss + l.chemicalLoss + l.toxinLoss) * q -
    l.metabolism -
    l.learning -
    l.motors -
    l.secretion -
    l.construction -
    l.repair -
    l.catabolismLoss -
    l.division -
    l.deathLoss
  );
}

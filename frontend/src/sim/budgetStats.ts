import { type Ledger } from "./types";

/** Undefined shares remain null when there is no denominator. */
export const percent = (part: number, whole: number): number | null =>
  whole > 0 ? (100 * part) / whole : null;

export function budgetStats(ledger: Ledger) {
  const l = ledger;
  const dissipated =
    l.metabolism +
    l.learning +
    l.motors +
    l.secretion +
    l.construction +
    l.catabolismLoss +
    l.division +
    l.repair;
  const absorbed = l.absorbedA + l.absorbedB;
  return {
    dissipated,
    repairEnergyPercent: percent(l.repair, dissipated),
    motorEnergyPercent: percent(l.motors, dissipated),
    synthesisEnergyPercent: percent(l.secretion, dissipated),
    learningEnergyPercent: percent(l.learning, dissipated),
    toxinAbsorptionPercent: percent(l.toxinEmitted, absorbed),
    matrixAbsorptionPercent: percent(l.matrixEmitted, absorbed),
    constructionAbsorptionPercent: percent(l.constructedMaterial, absorbed),
    foodAPercent: percent(l.absorbedA, absorbed),
    damageDeathPercent: percent(l.damageDeaths, l.deaths),
  };
}

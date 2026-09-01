import { foundColony } from "./colony";
import { resetOracleState, type OraclePolicy } from "./oracles/policies";
import { computeRatios, type ViabilityRatios } from "./ratios";
import { ENERGY, FOOD_GOVERNOR } from "./tunables";
import { createWorld, stepWorld } from "./world";

/**
 * Calibration harness (Appendix B §B.6): tuning becomes measurement. An
 * economy point names the three sampled axes that drive R1/R2/R3/R5b/R7;
 * a run under the certified rung-2 oracle yields a survival/delivery
 * ledger. Defaults must sit in the viable region's interior — every
 * one-axis excursion is a measured margin, not a guess.
 */
export interface EconomyPoint {
  name: string;
  /** FOOD_GOVERNOR.targetCount — food density (R1, R3, R4, R5b). */
  foodTarget: number;
  /** ENERGY.foodEnergy — meal size (R1, R2, R7). */
  foodEnergy: number;
  /** FOOD_GOVERNOR.maxSpawnPerPass — energy inflow (R7, R5b). */
  maxSpawnPerPass: number;
}

export interface CalibrationLedger {
  name: string;
  /** False when the point fails world-creation preconditions (R7 etc.). */
  viable: boolean;
  survived: boolean;
  ants: number;
  merit: number;
  stockpile: number;
  ratios: ViabilityRatios | null;
}

/** The shipped defaults, read once at load so sweeps scale from them. */
export const DEFAULT_ECONOMY: EconomyPoint = {
  name: "defaults",
  foodTarget: FOOD_GOVERNOR.targetCount,
  foodEnergy: ENERGY.foodEnergy,
  maxSpawnPerPass: FOOD_GOVERNOR.maxSpawnPerPass,
};

/** Scoped tunable override: applies the point, restores on exit. */
export function withEconomy<T>(point: EconomyPoint, fn: () => T): T {
  const prior = {
    foodTarget: FOOD_GOVERNOR.targetCount,
    foodEnergy: ENERGY.foodEnergy,
    maxSpawnPerPass: FOOD_GOVERNOR.maxSpawnPerPass,
  };
  FOOD_GOVERNOR.targetCount = point.foodTarget;
  ENERGY.foodEnergy = point.foodEnergy;
  FOOD_GOVERNOR.maxSpawnPerPass = point.maxSpawnPerPass;
  try {
    return fn();
  } finally {
    FOOD_GOVERNOR.targetCount = prior.foodTarget;
    ENERGY.foodEnergy = prior.foodEnergy;
    FOOD_GOVERNOR.maxSpawnPerPass = prior.maxSpawnPerPass;
  }
}

/**
 * Per-axis excursions around the defaults (low ×1/4, high ×2). One-at-a-
 * time sweeps measure the margin on each axis independently — the interior
 * test the exit gate needs, at 1/4 the cost of a factorial.
 */
export function axisSweep(): EconomyPoint[] {
  const d = DEFAULT_ECONOMY;
  return [
    d,
    { ...d, name: "foodTarget/4", foodTarget: d.foodTarget / 4 },
    { ...d, name: "foodTarget*2", foodTarget: d.foodTarget * 2 },
    { ...d, name: "foodEnergy/4", foodEnergy: d.foodEnergy / 4 },
    { ...d, name: "foodEnergy*2", foodEnergy: d.foodEnergy * 2 },
    { ...d, name: "spawn/4", maxSpawnPerPass: d.maxSpawnPerPass / 4 },
    { ...d, name: "spawn*2", maxSpawnPerPass: d.maxSpawnPerPass * 2 },
  ];
}

/**
 * One colony run at an economy point. `policy` undefined runs the real
 * seeded controller — the oracle-vs-seeded gap is the same call twice.
 */
export function runEconomyPoint(
  seed: number,
  point: EconomyPoint,
  ticks: number,
  policy?: OraclePolicy
): CalibrationLedger {
  return withEconomy(point, () => {
    resetOracleState();
    let world;
    try {
      world = createWorld(seed);
    } catch {
      return { name: point.name, viable: false, survived: false, ants: 0, merit: 0, stockpile: 0, ratios: null };
    }
    const colony = foundColony(world);
    if (policy) {
      world.policyOverride = policy;
    }
    for (let t = 0; t < ticks; t++) {
      stepWorld(world);
    }
    let merit = 0;
    for (const credit of colony.patrilineDeliveries.values()) {
      merit += credit;
    }
    return {
      name: point.name,
      viable: true,
      survived: world.colonies.length > 0,
      ants: world.ants.length,
      merit,
      stockpile: world.colonies[0]?.stockpile ?? 0,
      ratios: computeRatios(world),
    };
  });
}

/** One line per ledger for harness logs and the recorded summary. */
export function formatLedger(ledger: CalibrationLedger): string {
  if (!ledger.viable) {
    return `${ledger.name}: INVIABLE (world-creation precondition)`;
  }
  const r = ledger.ratios as ViabilityRatios;
  return (
    `${ledger.name}: ${ledger.survived ? "survived" : "collapsed"}` +
    ` ants=${ledger.ants} merit=${ledger.merit.toFixed(1)}` +
    ` stock=${ledger.stockpile.toFixed(1)}` +
    ` R1=${r.tripProfitability.toFixed(1)} R2=${r.satiation.toFixed(2)}` +
    ` R3=${r.scentHorizon.toFixed(1)} R7=${r.ecosystemClosure.toFixed(0)}`
  );
}

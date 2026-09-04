import { DIG, ENERGY, FOOD_GOVERNOR, SCENT } from "../../src/sim/tunables";
import { type ColonyEnergyVerdict } from "../colonyEnergyWorker";

export interface EconomyProfile {
  name: string;
  energyScale: number;
  workScale: number;
  signalScale: number;
  foodDensityScale: number;
  foodScentScale: number;
}

export interface ControllerEnergyResult {
  source: string;
  verdict: ColonyEnergyVerdict;
}

export interface ControllerPopulationSummary {
  controllerCount: number;
  activeCount: number;
  supportedCount: number;
  supportedFraction: number;
  positiveEpisodeFraction: number;
  medianControllerBalance: number;
  worstControllerBalance: number;
  bestControllerBalance: number;
  balanceSpread: number;
  gatheringBalanceCorrelation: number;
}

const BASE = {
  basalPerTick: ENERGY.basalPerTick,
  stepCost: ENERGY.stepCost,
  carryStepCost: ENERGY.carryStepCost,
  sensorUpkeep: ENERGY.sensorUpkeep,
  thinkCostScale: ENERGY.thinkCostScale,
  depositCostPerUnit: ENERGY.depositCostPerUnit,
  foodEnergy: ENERGY.foodEnergy,
  maxEnergy: ENERGY.max,
  foodPickup: DIG.cost.foodPickup,
  depositCost: DIG.depositCost,
  foodTarget: FOOD_GOVERNOR.targetCount,
  maxSpawnPerPass: FOOD_GOVERNOR.maxSpawnPerPass,
  foodSourceStrength: SCENT.foodSourceStrength,
};

function patch(path: string, value: number): string {
  return `${path}=${value}`;
}

/** Exact world patches for one energy-scale point; normalized meal size stays constant. */
export function profilePatches(profile: EconomyProfile): string[] {
  const work = profile.workScale;
  return [
    patch("ENERGY.foodEnergy", BASE.foodEnergy * profile.energyScale),
    patch("ENERGY.max", BASE.maxEnergy * profile.energyScale),
    patch("ENERGY.basalPerTick", BASE.basalPerTick * work),
    patch("ENERGY.stepCost", BASE.stepCost * work),
    patch("ENERGY.carryStepCost", BASE.carryStepCost * work),
    patch("ENERGY.sensorUpkeep", BASE.sensorUpkeep * work),
    patch("ENERGY.thinkCostScale", BASE.thinkCostScale * work),
    patch("ENERGY.depositCostPerUnit", BASE.depositCostPerUnit * work * profile.signalScale),
    patch("DIG.cost.foodPickup", BASE.foodPickup * work),
    patch("DIG.depositCost", BASE.depositCost * work),
    patch("FOOD_GOVERNOR.targetCount", BASE.foodTarget * profile.foodDensityScale),
    patch("FOOD_GOVERNOR.maxSpawnPerPass", BASE.maxSpawnPerPass * profile.foodDensityScale),
    patch("SCENT.foodSourceStrength", BASE.foodSourceStrength * profile.foodScentScale),
  ];
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
}

function correlation(xs: number[], ys: number[]): number {
  const meanX = mean(xs);
  const meanY = mean(ys);
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let index = 0; index < xs.length; index++) {
    const dx = xs[index] - meanX;
    const dy = ys[index] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  const divisor = Math.sqrt(varianceX * varianceY);
  return divisor === 0 ? 0 : covariance / divisor;
}

/** Distributional viability: positive in a majority of worlds and actually gathering food. */
export function summarizeControllerPopulation(
  results: ControllerEnergyResult[],
  worldCount: number
): ControllerPopulationSummary {
  const balances = results.map(({ verdict }) => verdict.medianBalance);
  const gathered = results.map(({ verdict }) => verdict.meanGathered);
  const positiveEpisodes = results.reduce((sum, { verdict }) => sum + verdict.positiveCount, 0);
  const requiredPositiveWorlds = Math.floor(worldCount / 2) + 1;
  const active = results.filter(({ verdict }) => verdict.meanGathered > 0);
  const supported = active.filter(({ verdict }) => verdict.positiveCount >= requiredPositiveWorlds);
  const worst = Math.min(...balances);
  const best = Math.max(...balances);
  return {
    controllerCount: results.length,
    activeCount: active.length,
    supportedCount: supported.length,
    supportedFraction: supported.length / results.length,
    positiveEpisodeFraction: positiveEpisodes / (results.length * worldCount),
    medianControllerBalance: median(balances),
    worstControllerBalance: worst,
    bestControllerBalance: best,
    balanceSpread: best - worst,
    gatheringBalanceCorrelation: correlation(gathered, balances),
  };
}

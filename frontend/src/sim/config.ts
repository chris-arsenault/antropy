import {
  BASELINE_ENVIRONMENT,
  CELLULAR_ENVIRONMENT,
  type EnvironmentConfig,
} from "./environmentConfig";
import { CLIMATE_CONFIG, type ClimateConfig } from "./climate/config";

export type TerrainLayout = "baseline" | "reference" | "compact" | "tiered";
export type ChemistryConfig = {
  readonly [K in keyof typeof CHEMISTRY]: (typeof CHEMISTRY)[K] extends number
    ? number
    : { readonly diffusion: number; readonly evaporation: number; readonly epsilon: number };
};

export interface SimConfig {
  readonly climate: ClimateConfig;
  readonly constructionCost: number;
  readonly queenCarryCost: number;
  readonly spoilCarryCost: number;
  readonly knowledgeDuration: number;
  readonly environment: EnvironmentConfig;
  /** Zero preserves the authored layout; positive seeds vary only nest geometry. */
  readonly nestSeed: number;
  readonly chemistry: ChemistryConfig;
  readonly workerCount: number;
  readonly mortalityEnabled: boolean;
  readonly reproductionEnabled: boolean;
  readonly workerLifespan: number;
  readonly workerEggCost: number;
  readonly metabolism: number;
  readonly initialFoodQuantity: number;
  readonly foodEnergyDensity: number;
  readonly foodRegrowth: number;
  readonly sourceCapacity: number;
  readonly cropCapacity: number;
  readonly maxEnergy: number;
  readonly queenEnergy: number;
  readonly queenMetabolism: number;
  readonly queenLifespan: number;
  readonly layingInterval: number;
  readonly eggDuration: number;
  readonly larvaDuration: number;
  readonly pupaDuration: number;
  readonly broodInvestment: number;
  readonly broodMetabolism: number;
  readonly width: number;
  readonly height: number;
  readonly surfaceBase: number;
  readonly foodCount: number;
  readonly foodClearance: number;
  readonly cacheCapacity: number;
  readonly chemistryInterval: number;
  readonly sensorCost: number;
  readonly moveCost: number;
  readonly turnCost: number;
  readonly mandibleCost: number;
  readonly pheromoneCost: number;
  readonly initialEnergy: number;
}

export const CHEMISTRY = Object.freeze({
  freshAir: Object.freeze({ diffusion: 0.32, evaporation: 0.999_995, epsilon: 0.000_000_01 }),
  airEmission: 50,
  odor: Object.freeze({ diffusion: 0.32, evaporation: 0.997, epsilon: 0.000_01 }),
  nestOdor: Object.freeze({ diffusion: 0.32, evaporation: 0.999_95, epsilon: 0.000_01 }),
  pheromone: Object.freeze({ diffusion: 0.000_1, evaporation: 0.999_4, epsilon: 0.000_01 }),
  foodEmission: 0.8,
  nestEmission: 50,
  pheromoneDeposit: 0.08,
  odorWarmupPasses: 20,
  nestEquilibriumPasses: 10_000,
  nestEquilibriumRetention: 0.999_95,
  exitEquilibriumPasses: 10_000,
  exitEquilibriumRetention: 0.999_5,
  exitTrailStrength: 5_000,
});

export const FORAGER_CONFIG: SimConfig = Object.freeze({
  climate: CLIMATE_CONFIG,
  constructionCost: 0.002,
  queenCarryCost: 0.0012,
  spoilCarryCost: 0.0003,
  knowledgeDuration: 8_000,
  environment: CELLULAR_ENVIRONMENT,
  nestSeed: 0,
  chemistry: CHEMISTRY,
  workerCount: 1,
  mortalityEnabled: false,
  reproductionEnabled: false,
  workerLifespan: 20_000,
  workerEggCost: 5,
  metabolism: 0,
  initialFoodQuantity: 1,
  foodEnergyDensity: 1,
  foodRegrowth: 0,
  sourceCapacity: 1,
  cropCapacity: 1,
  maxEnergy: 10,
  queenEnergy: 20,
  queenMetabolism: 0,
  queenLifespan: 1_000_000,
  layingInterval: 800,
  eggDuration: 600,
  larvaDuration: 1_200,
  pupaDuration: 600,
  broodInvestment: 6,
  broodMetabolism: 0.0005,
  width: 2_048,
  height: 128,
  surfaceBase: 104,
  foodCount: 96,
  foodClearance: 40,
  cacheCapacity: 96,
  chemistryInterval: 5,
  sensorCost: 0.000_001,
  moveCost: 0.000_01,
  turnCost: 0.000_002,
  mandibleCost: 0.000_005,
  pheromoneCost: 0.000_002,
  initialEnergy: 10,
});

export function terrainConfig(
  layout: TerrainLayout,
  base: SimConfig = PROGRAMMED_LIFECYCLE_CONFIG
): SimConfig {
  const environment =
    layout === "baseline"
      ? BASELINE_ENVIRONMENT
      : {
          ...CELLULAR_ENVIRONMENT,
          microclimate: base.environment.microclimate,
          climateEffects: base.environment.climateEffects,
          foodSpoilage: base.environment.foodSpoilage,
          autonomousConstruction: base.environment.autonomousConstruction,
          collectiveWork: base.environment.collectiveWork,
          excavation: base.environment.excavation,
          nestShape: layout === "reference" ? ("reference" as const) : ("compact" as const),
          soilPockets: layout !== "reference",
          surfaceProfile: layout === "tiered" ? ("woodland" as const) : ("rolling" as const),
          surfaceTiers: layout === "tiered",
        };
  return {
    ...base,
    environment,
    height: layout === "reference" || layout === "baseline" ? 128 : 512,
    surfaceBase: layout === "reference" || layout === "baseline" ? 104 : 320,
  };
}

export const PROGRAMMED_COLONY_CONFIG: SimConfig = Object.freeze({
  ...FORAGER_CONFIG,
  workerCount: 8,
});

export const PROGRAMMED_LIFECYCLE_CONFIG: SimConfig = Object.freeze({
  ...PROGRAMMED_COLONY_CONFIG,
  mortalityEnabled: true,
  reproductionEnabled: true,
  workerLifespan: 16_000,
  workerEggCost: 2,
  metabolism: 0.0005,
  moveCost: 0.0003,
  turnCost: 0.0001,
  mandibleCost: 0.0001,
  initialFoodQuantity: 4,
  foodRegrowth: 0.002,
  sourceCapacity: 12,
  cropCapacity: 4,
  initialEnergy: 8,
  maxEnergy: 10,
  queenEnergy: 24,
  queenMetabolism: 0.001,
});

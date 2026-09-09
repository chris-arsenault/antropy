import { type SimConfig } from "./config";

/** Shared browser review conditions; harness comparisons must use this exact configuration. */
export function withReviewPressures(config: SimConfig): SimConfig {
  return {
    ...config,
    layingInterval: 80,
    eggDuration: 120,
    larvaDuration: 600,
    pupaDuration: 240,
    foodRegrowth: 0.02,
    cacheCapacity: 12,
    climate: { ...config.climate, initialCavityHeat: 0 },
    environment: {
      ...config.environment,
      nestShape: "founding",
      microclimate: true,
      climateEffects: true,
      foodSpoilage: true,
      autonomousConstruction: true,
      collectiveWork: true,
    },
  };
}

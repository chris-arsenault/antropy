import { DEFAULT_CONFIG, type Config } from "../sim/config";
import { DEFAULT_EPOCHS } from "../sim/foodEpochs";

export type FoodLayout = "mixed" | "epochs" | "zones";

export function foodLayout(config: Config): FoodLayout {
  if (config.foodZones) return "zones";
  return config.foodEpochs ? "epochs" : "mixed";
}
/** Composition layouts are alternatives; a new population declares exactly one. */
export function withLayout(config: Config, layout: FoodLayout): Config {
  const rest: Config = { ...config };
  delete rest.foodEpochs;
  delete rest.foodZones;
  if (layout === "epochs") return { ...rest, foodEpochs: DEFAULT_EPOCHS };
  if (layout === "zones") return { ...rest, foodZones: DEFAULT_CONFIG.foodZones };
  return rest;
}

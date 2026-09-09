import { FORAGER_CONFIG, CHEMISTRY, type SimConfig } from "./config";
import { ENVIRONMENT_CHOICES } from "./environmentConfig";
import { validateClimate } from "./climate/config";

const POSITIVE_INTEGERS = [
  "knowledgeDuration",
  "width",
  "height",
  "workerCount",
  "workerLifespan",
  "queenLifespan",
  "layingInterval",
  "eggDuration",
  "larvaDuration",
  "pupaDuration",
  "chemistryInterval",
] as const;

/** Validate before allocating grids or compiling a runtime. No silent profile fallback. */
export function validateConfig(config: SimConfig): void {
  if (!config || typeof config !== "object") throw new Error("missing simulation config");
  if (!Number.isFinite(config.foodEnergyDensity) || config.foodEnergyDensity <= 0)
    throw new Error("food energy density must be finite and positive");
  validateEconomy(config);
  validateEnvironment(config);
  validateChemistry(config);
  validateClimate(config.climate);
}

function validateEconomy(config: SimConfig): void {
  for (const key of Object.keys(FORAGER_CONFIG) as (keyof SimConfig)[]) {
    if (typeof FORAGER_CONFIG[key] !== "number") continue;
    if (!Number.isFinite(config[key]) || Number(config[key]) < 0)
      throw new Error(`invalid simulation config: ${key}`);
  }
  validateCounts(config);
  for (const key of ["mortalityEnabled", "reproductionEnabled"] as const)
    if (typeof config[key] !== "boolean") throw new Error(`invalid config ${key}`);
  if (config.foodEnergyDensity <= 0 || config.maxEnergy <= 0 || config.initialFoodQuantity <= 0)
    throw new Error("food energy density, initial quantity and max energy must be positive");
}

function validateCounts(config: SimConfig): void {
  if (
    !Number.isSafeInteger(config.nestSeed) ||
    config.nestSeed < 0 ||
    config.nestSeed > 0xffff_ffff
  )
    throw new Error("nest seed must be an unsigned 32-bit integer");
  for (const key of POSITIVE_INTEGERS)
    if (!Number.isSafeInteger(config[key]) || config[key] <= 0)
      throw new Error(`config ${key} must be a positive integer`);
}

function validateEnvironment(config: SimConfig): void {
  for (const choice of ENVIRONMENT_CHOICES)
    if (!choice.values.includes(config.environment?.[choice.key]))
      throw new Error(`invalid environment ${choice.key}`);
}

function validateChemistry(config: SimConfig): void {
  if (!config.chemistry) throw new Error("missing chemistry config");
  for (const key of Object.keys(CHEMISTRY) as (keyof typeof CHEMISTRY)[]) {
    const value = config.chemistry[key];
    if (typeof CHEMISTRY[key] === "number") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
        throw new Error(`invalid chemistry ${key}`);
    } else {
      validateField(value, key);
    }
  }
}

function validateField(value: unknown, key: string): void {
  if (!value || typeof value !== "object") throw new Error(`invalid field ${key}`);
  const { diffusion, evaporation, epsilon } = value as {
    diffusion: number;
    evaporation: number;
    epsilon: number;
  };
  if (
    ![diffusion, evaporation, epsilon].every(Number.isFinite) ||
    diffusion < 0 ||
    diffusion > 1 ||
    evaporation < 0 ||
    evaporation > 1 ||
    epsilon <= 0
  )
    throw new Error(`invalid field ${key}`);
}

export function snapshotConfig(config: SimConfig): SimConfig {
  validateConfig(config);
  const copy = structuredClone(config);
  for (const value of Object.values(copy.chemistry))
    if (typeof value === "object") Object.freeze(value);
  Object.freeze(copy.chemistry);
  Object.freeze(copy.environment);
  Object.freeze(copy.climate);
  return Object.freeze(copy);
}

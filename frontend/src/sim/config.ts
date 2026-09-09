export const DEFAULT_CONFIG = {
  width: 80,
  height: 60,
  dt: 0.2,
  founders: 48,
  maxPopulation: 10000,
  regime: "persistent" as "persistent" | "transient",
  sourceCount: 8,
  sourceRate: 0.3,
  sourceRadius: 3,
  sourceLifetime: 60,
  initialNutrient: 0.15,
  nutrientDiffusion: 0.3,
  nutrientDecay: 0.001,
  chemicalDiffusion: 0.15,
  chemicalDecay: 0.035,
  nutrientK: 0.3,
  chemicalK: 0.02,
  receptorTau: 2,
  birthMass: 1,
  radius: 0.45,
  reservePerMass: 3,
  founderReserve: 1.5,
  maintenance: 0.006,
  controllerCost: 0.001,
  uptakeRate: 0.2,
  growthRate: 0.06,
  growthEfficiency: 0.85,
  protectedReserve: 0.4,
  divisionCost: 0.08,
  daughterReserve: 0.3,
  speed: 1.5,
  turnRate: 3,
  rotationalDiffusion: 0.08,
  swimCost: 0.015,
  turnCost: 0.008,
  secretionRate: 0.06,
  secretionCost: 0.04,
  mutationRate: 0.005,
  mutationScale: 0.12,
};
export type Config = typeof DEFAULT_CONFIG;
export const reserveCapacity = (mass: number, config: Config): number =>
  mass * config.reservePerMass;

function validateNumbers(config: Config): void {
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    if (typeof value !== "number") continue;
    const actual = config[key as keyof Config];
    if (typeof actual !== "number" || !Number.isFinite(actual) || actual < 0)
      throw new Error(`Invalid configuration: ${key}`);
  }
  for (const key of ["width", "height", "founders", "sourceCount", "maxPopulation"] as const)
    if (!Number.isInteger(config[key])) throw new Error(`Integer required: ${key}`);
}
export function validateConfig(config: Config): void {
  validateNumbers(config);
  if (config.width < 8 || config.height < 8 || config.width * config.height > 1e6)
    throw new Error("Field dimensions outside supported range");
  validatePositive(config);
  validateReserves(config);
  if (config.growthEfficiency > 1 || config.protectedReserve > 1 || config.mutationRate > 1)
    throw new Error("Invalid fractional parameter");
  if (!["persistent", "transient"].includes(config.regime)) throw new Error("Invalid regime");
  if (config.founders > config.maxPopulation || config.maxPopulation > 100000)
    throw new Error("Invalid population safety limit");
}
function validateReserves(config: Config): void {
  const capacity = reserveCapacity(config.birthMass, config);
  if (!Number.isFinite(capacity) || config.founderReserve > capacity)
    throw new Error("Founder reserve exceeds body capacity");
  if (
    config.daughterReserve > capacity ||
    2 * config.daughterReserve + config.divisionCost > 2 * capacity
  )
    throw new Error("Division reserves and cost exceed body capacity");
}
function validatePositive(config: Config): void {
  for (const key of [
    "dt",
    "sourceRadius",
    "sourceLifetime",
    "nutrientK",
    "chemicalK",
    "receptorTau",
    "birthMass",
    "radius",
    "reservePerMass",
    "growthEfficiency",
  ] as const)
    if (config[key] <= 0) throw new Error(`Positive value required: ${key}`);
}

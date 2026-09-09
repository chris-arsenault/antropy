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
  motorRatio: 0.08,
  transporterRatio: 0.08,
  storageRatio: 0.08,
  bodyDensity: 4,
  reserveDensity: 4,
  storageCapacity: 20,
  energyCapacity: 0.8,
  founderReserve: 0.8,
  founderEnergy: 0.5,
  maintenance: 0.006,
  motorMaintenance: 0.02,
  transporterMaintenance: 0.01,
  storageMaintenance: 0.005,
  controllerCost: 0.001,
  transporterTurnover: 2.5,
  catabolicRate: 0.08,
  catabolicEfficiency: 0.8,
  nutrientEnergy: 4,
  growthRate: 0.06,
  constructionEnergy: 0.5,
  protectedReserve: 0.4,
  divisionCost: 0.08,
  daughterReserve: 0.3,
  daughterEnergy: 0.1,
  viscosity: 0.0004,
  thermalEnergy: 0.00008,
  motorPowerDensity: 0.2,
  motorEfficiency: 0.5,
  secretionRate: 0.06,
  secretionCost: 0.04,
  mutationRate: 0.005,
  mutationScale: 0.12,
  physicalMutationRate: 0.05,
  physicalMutationScale: 0.12,
  mutationKind: "gaussian" as "uniform" | "gaussian",
  ploidy: "haploid" as "haploid" | "diploid",
  transmission: "clonal" as "clonal" | "selfing",
  crossover: "uniform" as "uniform" | "one-point",
  reproduction: "fission" as "fission" | "budding",
  learning: "plastic" as "static" | "plastic",
  plasticityCost: 0.002,
  learningRetention: 1,
};
export type Config = typeof DEFAULT_CONFIG;

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
  validateEvolution(config);
  for (const key of [
    "catabolicEfficiency",
    "motorEfficiency",
    "protectedReserve",
    "mutationRate",
    "learningRetention",
  ] as const)
    if (config[key] > 1) throw new Error(`Invalid fractional parameter: ${key}`);
  if (!["persistent", "transient"].includes(config.regime)) throw new Error("Invalid regime");
  if (config.founders > config.maxPopulation || config.maxPopulation > 100000)
    throw new Error("Invalid population safety limit");
}
function validateEvolution(c: Config): void {
  const policies = {
    mutationKind: ["uniform", "gaussian"],
    ploidy: ["haploid", "diploid"],
    transmission: ["clonal", "selfing"],
    crossover: ["uniform", "one-point"],
    reproduction: ["fission", "budding"],
    learning: ["static", "plastic"],
  };
  for (const key of Object.keys(policies) as (keyof typeof policies)[])
    if (!policies[key].includes(c[key])) throw new Error(`Invalid policy: ${key}`);
  if (c.transmission === "selfing" && c.ploidy !== "diploid")
    throw new Error("Selfing requires diploidy");
  if (c.physicalMutationRate > 1) throw new Error("Invalid physical mutation rate");
}
function validateReserves(config: Config): void {
  const capacity = config.birthMass * config.storageRatio * config.storageCapacity;
  if (!Number.isFinite(capacity) || config.founderReserve > capacity)
    throw new Error("Founder reserve exceeds body capacity");
  const energy = config.birthMass * config.energyCapacity;
  if (config.founderEnergy > energy) throw new Error("Founder energy exceeds core capacity");
  if (
    config.daughterReserve > capacity ||
    2 * config.daughterEnergy + config.divisionCost > 2 * energy
  )
    throw new Error("Division reserves and cost exceed reference body capacity");
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
    "motorRatio",
    "transporterRatio",
    "storageRatio",
    "bodyDensity",
    "reserveDensity",
    "storageCapacity",
    "energyCapacity",
    "nutrientEnergy",
    "catabolicEfficiency",
    "viscosity",
  ] as const)
    if (config[key] <= 0) throw new Error(`Positive value required: ${key}`);
}

/** Resolved mechanisms, never a preset name consulted by physics. */
export interface EnvironmentConfig {
  readonly collectiveWork: boolean;
  readonly microclimate: boolean;
  readonly climateEffects: boolean;
  readonly foodSpoilage: boolean;
  readonly autonomousConstruction: boolean;
  readonly excavation: boolean;
  readonly gravity: boolean;
  readonly lightModel: "occluded" | "depth-attenuated";
  readonly nestShape: "reference" | "narrow" | "compact" | "founding";
  readonly surfaceProfile: "rolling" | "woodland";
  readonly soilPockets: boolean;
  readonly surfaceTiers: boolean;
  readonly support: "column" | "contact";
  readonly odorTransport: "supported" | "airborne";
  readonly chemicalSensing: "supported" | "airborne";
}

export const CELLULAR_ENVIRONMENT: EnvironmentConfig = Object.freeze({
  collectiveWork: false,
  microclimate: false,
  climateEffects: false,
  foodSpoilage: false,
  autonomousConstruction: false,
  excavation: true,
  gravity: true,
  lightModel: "occluded",
  nestShape: "reference",
  surfaceProfile: "rolling",
  soilPockets: false,
  surfaceTiers: false,
  support: "contact",
  odorTransport: "airborne",
  chemicalSensing: "airborne",
});

export const BASELINE_ENVIRONMENT: EnvironmentConfig = Object.freeze({
  ...CELLULAR_ENVIRONMENT,
  gravity: false,
  lightModel: "depth-attenuated",
  support: "column",
  odorTransport: "supported",
  chemicalSensing: "supported",
});

export interface EnvironmentChoice {
  readonly key: keyof EnvironmentConfig;
  readonly label: string;
  readonly values: readonly (string | boolean)[];
}

/** Shared browser and command-line vocabulary. */
export const ENVIRONMENT_CHOICES: readonly EnvironmentChoice[] = [
  { key: "collectiveWork", label: "Collective work", values: [false, true] },
  { key: "microclimate", label: "Material temperature and moisture", values: [false, true] },
  { key: "climateEffects", label: "Climate physiology", values: [false, true] },
  { key: "foodSpoilage", label: "Food spoilage", values: [false, true] },
  { key: "autonomousConstruction", label: "Autonomous construction", values: [false, true] },
  { key: "excavation", label: "Excavation allowed", values: [false, true] },
  { key: "gravity", label: "Gravity and settling", values: [false, true] },
  { key: "lightModel", label: "Light attenuation", values: ["occluded", "depth-attenuated"] },
  { key: "nestShape", label: "Nest shape", values: ["reference", "narrow", "compact", "founding"] },
  { key: "surfaceProfile", label: "Ground profile", values: ["rolling", "woodland"] },
  { key: "soilPockets", label: "Soil pockets", values: [false, true] },
  { key: "surfaceTiers", label: "Surface tiers", values: [false, true] },
  { key: "support", label: "Body support", values: ["column", "contact"] },
  { key: "odorTransport", label: "Odor transport", values: ["supported", "airborne"] },
  { key: "chemicalSensing", label: "Chemical sampling", values: ["supported", "airborne"] },
];

export function environmentValue(key: keyof EnvironmentConfig, value: string): string | boolean {
  const choice = ENVIRONMENT_CHOICES.find((entry) => entry.key === key);
  const parsed = choice?.values.find((entry) => String(entry) === value);
  if (parsed === undefined) throw new Error(`invalid environment ${key}: ${value}`);
  return parsed;
}

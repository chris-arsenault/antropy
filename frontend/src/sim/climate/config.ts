export const CLIMATE_CONFIG = Object.freeze({
  cellSize: 1,
  interval: 20,
  dayLength: 8000,
  meanTemperature: 24,
  initialCavityHeat: 0,
  temperatureAmplitude: 12,
  solarHeating: 0.12,
  atmosphereMoisture: 0.3,
  initialMoisture: 0.65,
  exchange: 0.08,
  thermalStress: 0.12,
  drynessStress: 2,
  waterExchange: 0.0002,
  spoilageRate: 0.00002,
});
export type ClimateConfig = { readonly [K in keyof typeof CLIMATE_CONFIG]: number };

export function validateClimate(config: ClimateConfig): void {
  if (!config) throw new Error("missing climate config");
  for (const key of Object.keys(CLIMATE_CONFIG) as (keyof ClimateConfig)[])
    if (!Number.isFinite(config[key]) || config[key] < 0) throw new Error(`invalid climate ${key}`);
  for (const key of ["cellSize", "interval", "dayLength"] as const)
    if (!Number.isSafeInteger(config[key]) || config[key] < 1)
      throw new Error(`invalid climate ${key}`);
  const bounds = {
    cellSize: 16,
    exchange: 0.2,
    initialMoisture: 1,
    atmosphereMoisture: 1,
    waterExchange: 0.1,
    spoilageRate: 0.01,
  } as const;
  if (Object.entries(bounds).some(([key, limit]) => config[key as keyof typeof bounds] > limit))
    throw new Error("climate transport outside stable bounds");
}

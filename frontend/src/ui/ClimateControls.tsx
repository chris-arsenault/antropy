import { type SimConfig } from "../sim/config";
import { type ClimateConfig } from "../sim/climate/config";

const LABELS: Record<keyof ClimateConfig, string> = {
  cellSize: "Climate cell size",
  interval: "Climate update interval",
  dayLength: "Day length",
  meanTemperature: "Mean temperature",
  initialCavityHeat: "Initial cavity warming",
  temperatureAmplitude: "Day/night temperature amplitude",
  solarHeating: "Solar heating",
  atmosphereMoisture: "Atmospheric moisture",
  initialMoisture: "Initial soil moisture",
  exchange: "Neighbor exchange rate",
  thermalStress: "Thermal maintenance cost",
  drynessStress: "Dryness maintenance cost",
  waterExchange: "Body water exchange",
  spoilageRate: "Food spoilage rate",
};

export function ClimateControls({
  config,
  onChange,
}: {
  readonly config: SimConfig;
  readonly onChange: (config: SimConfig) => void;
}) {
  return (
    <details>
      <summary>Climate parameters</summary>
      {(Object.keys(LABELS) as (keyof ClimateConfig)[]).map((key) => (
        <label key={key}>
          {LABELS[key]}
          <input
            aria-label={LABELS[key]}
            type="number"
            min={0}
            step="any"
            value={config.climate[key]}
            onChange={(event) =>
              onChange({
                ...config,
                climate: { ...config.climate, [key]: Number(event.target.value) },
              })
            }
          />
        </label>
      ))}
    </details>
  );
}

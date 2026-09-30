import { type EngineConfig } from "./types";
import { terrainPreset, type TerrainConfig } from "./terrainConfig";

const switches = [
  ["elevation", "Elevation resistance"],
  ["movement", "Substrate affects movement"],
  ["transport", "Substrate affects material spreading"],
  ["processing", "Substrate affects public reactions"],
  ["transmission", "Permanent overhead shade"],
  ["ceiling", "Clip bright light peaks"],
  ["seasons", "Local resource seasons"],
  ["feedback", "Cells sense paid motor load"],
] as const;
const fields = [
  ["slopeResistance", "Uphill resistance", 0],
  ["minimumConductance", "Minimum conductance (0–1)", 0.00001],
  ["ceilingMin", "Minimum light ceiling", 0],
  ["ceilingMax", "Maximum light ceiling", 0],
  ["seasonAmplitude", "Season amplitude ceiling (0–1)", 0],
  ["seasonPeriod", "Season period (model seconds)", 0.01],
  ["placementContrast", "Reservoir clustering contrast (0–40)", 0],
] as const;

export function TerrainSettings({
  config,
  change,
}: {
  config: EngineConfig;
  change: (c: EngineConfig) => void;
}) {
  const set = (terrain: TerrainConfig) => change({ ...config, terrain });
  return (
    <details>
      <summary>Terrain and resource seasons</summary>
      <p>
        These settings apply to a new world. Maps are generated once; reservoirs move freely
        afterward.
      </p>
      <button type="button" onClick={() => set(terrainPreset(config.terrain, true))}>
        Integrated terrain
      </button>
      <button type="button" onClick={() => set(terrainPreset(config.terrain, false))}>
        Previous ecology
      </button>
      {switches.map(([key, label]) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={config.terrain[key]}
            onChange={(e) => set({ ...config.terrain, [key]: e.target.checked })}
          />
          {label}
        </label>
      ))}
      <label>
        Reservoir placement
        <select
          value={config.terrain.placement}
          onChange={(e) =>
            set({ ...config.terrain, placement: e.target.value as TerrainConfig["placement"] })
          }
        >
          <option value="fractal">Fractal density</option>
          <option value="current">Regional clusters</option>
          <option value="uniform">Uniform</option>
        </select>
      </label>
      {fields.map(([key, label, min]) => (
        <label key={key}>
          {label}
          <input
            type="number"
            min={min}
            step="any"
            value={config.terrain[key]}
            onChange={(e) => set({ ...config.terrain, [key]: Number(e.target.value) })}
          />
        </label>
      ))}
    </details>
  );
}

import { validateGeneration } from "../sim/generationValidation";
import { useState } from "react";
import { terrainConfig, type SimConfig, type TerrainLayout } from "../sim/config";
import { ENVIRONMENT_CHOICES, environmentValue } from "../sim/environmentConfig";
import { validateConfig } from "../sim/configValidation";
import { ClimateControls } from "./ClimateControls";

export function EnvironmentControls({
  config,
  onApply,
}: {
  readonly config: SimConfig;
  readonly onApply: (config: SimConfig) => void;
}) {
  const [draft, setDraft] = useState(config);
  const [error, setError] = useState("");
  return (
    <details className="environment-controls">
      <summary>Environment</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            validateConfig(draft);
            validateGeneration(draft);
            onApply(draft);
          } catch (failure) {
            setError(failure instanceof Error ? failure.message : "Invalid environment");
          }
        }}
      >
        <PresetSelect config={draft} onChange={setDraft} />
        <ClimateControls config={draft} onChange={setDraft} />
        {ENVIRONMENT_CHOICES.map((choice) => (
          <label key={choice.key}>
            {choice.label}
            <select
              aria-label={choice.label}
              value={String(draft.environment[choice.key])}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  environment: {
                    ...draft.environment,
                    [choice.key]: environmentValue(choice.key, event.target.value),
                  },
                })
              }
            >
              {choice.values.map((value) => (
                <option key={String(value)} value={String(value)}>
                  {choiceLabel(value)}
                </option>
              ))}
            </select>
          </label>
        ))}
        {(["width", "height", "surfaceBase", "nestSeed"] as const).map((key) => (
          <label key={key}>
            {key === "surfaceBase" ? "Ground datum" : key}
            <input
              aria-label={key}
              type="number"
              value={draft[key]}
              min={0}
              onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })}
            />
          </label>
        ))}
        <button type="submit">Apply and restart</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </details>
  );
}

function choiceLabel(value: string | boolean): string {
  if (typeof value === "string") return value;
  return value ? "On" : "Off";
}

function PresetSelect({
  config,
  onChange,
}: {
  readonly config: SimConfig;
  readonly onChange: (config: SimConfig) => void;
}) {
  return (
    <label>
      Preset
      <select
        aria-label="Environment preset"
        value={presetName(config)}
        onChange={(event) => {
          if (event.target.value !== "custom")
            onChange(terrainConfig(event.target.value as TerrainLayout, config));
        }}
      >
        <option value="custom">Custom settings</option>
        <option value="baseline">Original physical rules</option>
        <option value="reference">Cellular reference</option>
        <option value="compact">Deep compact nest</option>
        <option value="tiered">Tiered woodland</option>
      </select>
    </label>
  );
}

function presetName(config: SimConfig): string {
  return (
    (["baseline", "reference", "compact", "tiered"] as const).find((name) => {
      const preset = terrainConfig(name, config);
      return (
        preset.height === config.height &&
        preset.surfaceBase === config.surfaceBase &&
        ENVIRONMENT_CHOICES.every(({ key }) => preset.environment[key] === config.environment[key])
      );
    }) ?? "custom"
  );
}

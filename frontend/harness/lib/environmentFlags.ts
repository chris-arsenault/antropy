import { readFileSync } from "node:fs";
import { terrainConfig, type SimConfig, type TerrainLayout } from "../../src/sim/config";
import { ENVIRONMENT_CHOICES, environmentValue } from "../../src/sim/environmentConfig";
import { snapshotConfig } from "../../src/sim/configValidation";
import { flag, type Flags } from "./flags";

/** Full config files also expose chemistry/economics; switches override individual axes. */
export function environmentFlags(flags: Flags): SimConfig {
  const preset = flag(flags, "terrain", "reference");
  if (!["baseline", "reference", "compact", "tiered"].includes(preset))
    throw new Error("invalid terrain preset");
  const path = flag(flags, "config", "");
  let config: SimConfig = path
    ? (JSON.parse(readFileSync(path, "utf8")) as SimConfig)
    : terrainConfig(preset as TerrainLayout);
  for (const choice of ENVIRONMENT_CHOICES) {
    const name = choice.key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const value = flags.values.get(name)?.at(-1);
    if (value !== undefined)
      config = {
        ...config,
        environment: {
          ...config.environment,
          [choice.key]: environmentValue(choice.key, value),
        },
      };
  }
  for (const key of ["width", "height", "surfaceBase", "nestSeed"] as const) {
    const name = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const value = flags.values.get(name)?.at(-1);
    if (value !== undefined) config = { ...config, [key]: Number(value) };
  }
  return snapshotConfig(config);
}

import { type Engine } from "../../src/engine/client";
import { type EngineConfig } from "../../src/engine/types";
import { chemicalContext } from "./chemicalGenotypes";
import { type Flags, flag } from "./flags";

export const CHEMICAL_OPTIONS = {
  chemistrySeed: "chemistry-seed",
  sourceRate: "source-rate",
  washout: "washout",
  weatheringRate: "weathering-rate",
  mesh: "mesh",
  physiologyInterval: "physiology-interval",
  viscosity: "viscosity",
  damageRate: "damage-rate",
  transferRate: "transfer-rate",
  sourceLifetime: "source-lifetime",
  sourceGap: "source-gap",
  sourceRadius: "source-radius",
  sourceDrift: "source-drift",
  sourceProcessing: "source-processing",
};

export function chemicalConfig(flags: Flags, engine: Engine): EngineConfig {
  const overrides: Partial<EngineConfig> = {};
  for (const [key, name] of Object.entries(CHEMICAL_OPTIONS))
    if (flags.values.has(name)) overrides[key] = Number(flag(flags, name, ""));
  if (flags.values.has("source-species"))
    overrides.sourceSpecies = flag(flags, "source-species", "").split(",").map(Number);
  const feedback = flag(flags, "habitat-feedback", "on");
  if (!["on", "off"].includes(feedback)) throw new Error("--habitat-feedback must be on or off");
  overrides.habitatFeedback = feedback === "on";
  const disturbance = flag(flags, "disturbance", "off");
  if (!["on", "off"].includes(disturbance)) throw new Error("--disturbance must be on or off");
  if (disturbance === "on")
    overrides.disturbance = { meanInterval: 2000, radius: 10, mortality: 0.9, mixing: 1 };
  return chemicalContext(engine, overrides).config;
}
export function twoSourceMixtures(shares: number[], config: EngineConfig): number[][] {
  if (config.sourceSpecies.length !== 2)
    throw new Error("This comparison requires exactly two source species");
  if (!shares.length || shares.some((v) => !Number.isFinite(v) || v < 0 || v > 1))
    throw new Error("Source shares must be fractions");
  return shares.map((share) => [share, 1 - share]);
}

/** Registered mutation-discovery runner using the production WASM kernel. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { type Engine } from "../../src/engine/client";
import { type EngineConfig } from "../../src/engine/types";
import { loadEngine } from "../numerical/engine";
import { CHEMICAL_OPTIONS, chemicalConfig, twoSourceMixtures } from "./sourceSettings";
import { type Flags, assertKnownFlags, flag, integerFlag, wallSecondsFlag } from "./flags";
import { runRecorded, requireRegistration } from "./longRun";

export interface EvolveSettings {
  seed: number;
  ticks: number;
  world: "zones" | "mixed";
  config: EngineConfig;
  checkpointEvery: number;
  wallSeconds: number;
  output: string;
  justification: string;
}
export function evolveSettings(flags: Flags, engine: Engine): EvolveSettings {
  const mutations = {
    physicalMutationRate: "physical-rate",
    physicalMutationScale: "physical-scale",
    mutationRate: "mutation-rate",
    mutationScale: "mutation-scale",
  };
  assertKnownFlags(flags, [
    ...Object.values(CHEMICAL_OPTIONS),
    ...Object.values(mutations),
    "world",
    "seed",
    "ticks",
    "checkpoint-every",
    "wall",
    "wall-seconds",
    "output",
    "justification",
    "source-species",
    "disturbance",
    "habitat-feedback",
  ]);
  const wallSeconds = wallSecondsFlag(flags, 3600);
  const world = flag(flags, "world", "mixed"),
    config = chemicalConfig(flags, engine),
    ticks = integerFlag(flags, "ticks", 500000);
  if (world !== "zones" && world !== "mixed") throw new Error("--world must be zones or mixed");
  for (const [key, name] of Object.entries(mutations))
    if (flags.values.has(name)) config[key] = Number(flag(flags, name, ""));
  return {
    seed: integerFlag(flags, "seed", 101),
    ticks,
    world,
    config,
    checkpointEvery: integerFlag(flags, "checkpoint-every", 100000),
    wallSeconds,
    output: flag(flags, "output", "harness/artifacts/evolve"),
    justification: requireRegistration(flags, ticks),
  };
}
export function evolveConfig(s: EvolveSettings): EngineConfig {
  return {
    ...s.config,
    sourceEpochs: null,
    sourceZones: s.world === "zones" ? twoSourceMixtures([1, 0], s.config) : null,
  };
}
export async function runEvolve(flags: Flags): Promise<void> {
  const engine = await loadEngine(),
    s = evolveSettings(flags, engine),
    label = `${s.world}-${s.seed}-chem${s.config.chemistrySeed}-rate${s.config.sourceRate}`;
  mkdirSync(s.output, { recursive: true });
  const world = engine.create(s.seed, evolveConfig(s));
  try {
    runRecorded(engine, world, {
      directory: join(s.output, label),
      experiment: "evolve-zones",
      label,
      ticks: s.ticks,
      cadence: 1000,
      checkpointEvery: s.checkpointEvery,
      wallSeconds: s.wallSeconds,
      provenance: {
        settings: s,
        justification: s.justification,
        sampleContract:
          "Living-cell positions and state, each observed genotype and kernel-derived traits, local-population census and chemical environment; streamed JSONL.",
      },
    });
  } finally {
    world.dispose();
  }
}

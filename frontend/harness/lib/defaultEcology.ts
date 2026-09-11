import { createWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG, type Config } from "../../src/sim/config";
import { recordMeasurement } from "./bacteriaRun";

/** Same Run founders and environment; remove one physical effect at a time. */
export function runDefaultEcology(seeds: number[], ticks: number, output: string): void {
  const arms: [string, Partial<Config>][] = [
    ["Run default", {}],
    ["Injury disabled; secretion and its cost retained", { damageRate: 0 }],
    ["Matrix binding disabled; production and drag retained", { matrixBinding: 0 }],
  ];
  for (const seed of seeds)
    for (const [label, overrides] of arms)
      recordMeasurement(
        createWorld(seed, { ...DEFAULT_CONFIG, ...overrides }),
        ticks,
        output,
        label,
        "default-ecology"
      );
}

import { loadEngine } from "../numerical/engine";
import { type EngineConfig as Config } from "../../src/engine/types";
import { recordMeasurement } from "./bacteriaRun";

/** Same Run founders and environment; remove one physical effect at a time. */
export async function runDefaultEcology(
  seeds: number[],
  ticks: number,
  output: string
): Promise<void> {
  if (!Number.isSafeInteger(ticks) || ticks < 1 || ticks > 3000)
    throw new Error("Default ecology ablations are bounded to 1..3000 ticks");
  const engine = await loadEngine();
  const arms: [string, Partial<Config>][] = [
    ["Run default", {}],
    ["Injury disabled; secretion and its cost retained", { damageRate: 0 }],
    [
      "Movement impedance disabled; chemical diffusion and production retained",
      { movementImpedance: 0 },
    ],
  ];
  for (const seed of seeds)
    for (const [label, overrides] of arms) {
      const world = engine.create(seed, overrides);
      try {
        recordMeasurement(engine, world, ticks, output, label, "default-ecology");
      } finally {
        world.dispose();
      }
    }
}

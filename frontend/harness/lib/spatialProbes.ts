import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "../../src/sim/config";
import { createWorld } from "../../src/sim/world";
import { initializeReceptors } from "../../src/sim/sensors";
import { heldEnergy, heldMaterial, total } from "../../src/sim/accounting";
import { type QuickScenario } from "./quickScenario";
import { runQuick } from "./quickRun";
import { flag, type Flags } from "./flags";

const CASES = {
  resident: { gap: 2, viscosity: 0.004, food: 96 },
  near: { gap: 18, viscosity: 0.004, food: 96 },
  thick: { gap: 18, viscosity: 0.4, food: 96 },
  far: { gap: 70, viscosity: 0.004, food: 96 },
  empty: { gap: 18, viscosity: 0.004, food: 0 },
} as const;

export function spatialProbe(name: keyof typeof CASES): QuickScenario {
  const specification = CASES[name];
  return {
    name: `spatial-${name}`,
    hypothesis:
      "Lower viscosity permits paid local transit; large gaps remain costly. Local food supports reproduction and its absence does not.",
    specification: {
      ...specification,
      initialHeading: "toward target; fixture placement, not controller information",
      controller: "ordinary founder RNN, mutation and learning frozen",
      patchSigma: 3,
    },
    target: { x: 100, y: 32, radius: 4 },
    offeredFoodA: specification.food / 2,
    offeredFoodB: specification.food / 2,
    create(seed, swap) {
      const w = createWorld(seed, {
        ...DEFAULT_CONFIG,
        width: 208,
        height: 64,
        founders: 1,
        sourceCount: 0,
        initialNutrient: 0,
        viscosity: specification.viscosity,
        mutationRate: 0,
        physicalMutationRate: 0,
        learning: "static",
        learningRetention: 0,
      });
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 208; x++)
          w.nutrient[y * 208 + x] = Math.exp(-((x - 100) ** 2 + (y - 32) ** 2) / 18);
      const scale = specification.food / (2 * total(w.nutrient));
      for (let i = 0; i < w.nutrient.length; i++) {
        w.nutrient[i] *= scale;
        w.nutrientB[i] = w.nutrient[i];
      }
      const cell = w.cells[0];
      cell.x = 100 + (swap ? 1 : -1) * specification.gap;
      cell.y = 32;
      cell.heading = swap ? Math.PI : 0;
      initializeReceptors(w, cell);
      w.ledger.initial = heldEnergy(w);
      w.ledger.initialMaterial = heldMaterial(w);
      return w;
    },
  };
}

export function runSpatialProbe(flags: Flags): void {
  const name = flag(flags, "case", "resident");
  if (!(name in CASES)) throw new Error(`Case must be ${Object.keys(CASES).join(", ")}`);
  const output = flag(flags, "output", "harness/artifacts/spatial-probes");
  const ticks = Number(flag(flags, "ticks", "300"));
  if (![300, 1500].includes(ticks)) throw new Error("Registered horizons are 300 and 1500 ticks");
  mkdirSync(output, { recursive: true });
  console.log(
    JSON.stringify(
      runQuick(spatialProbe(name as keyof typeof CASES), {
        seed: 101,
        ticks,
        wallSeconds: 120,
        swap: flag(flags, "swap", "false") === "true",
        probe: "fast",
        output: join(output, `${name}-${ticks}-${flag(flags, "swap", "false")}`),
      })
    )
  );
}

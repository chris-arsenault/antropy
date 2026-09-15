import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pulse, install, frozen } from "./engineFixtures";
import { chemicalContext } from "./chemicalGenotypes";
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
    create(engine, seed, swap) {
      const context = chemicalContext(engine);
      const w = engine.create(seed, {
        ...frozen,
        width: 208,
        height: 64,
        founders: 1,
        sourceCount: 0,
        viscosity: specification.viscosity,
        mutationRate: 0,
        physicalMutationRate: 0,
        learning: "static",
        learningRetention: 0,
      });
      pulse(
        w,
        context.config.sourceSpecies.map((s) => [
          s,
          specification.food / context.config.sourceSpecies.length,
        ]),
        [100, 32],
        3
      );
      install(
        w,
        [{ label: "ordinary founder", genotype: context.genotype }],
        [
          {
            cell: 1,
            variant: 0,
            x: 100 + (swap ? 1 : -1) * specification.gap,
            y: 32,
            heading: swap ? Math.PI : 0,
          },
        ]
      );
      return w;
    },
  };
}

export async function runSpatialProbe(flags: Flags): Promise<void> {
  const name = flag(flags, "case", "resident");
  if (!(name in CASES)) throw new Error(`Case must be ${Object.keys(CASES).join(", ")}`);
  const output = flag(flags, "output", "harness/artifacts/spatial-probes");
  const ticks = Number(flag(flags, "ticks", "300"));
  if (![300, 1500].includes(ticks)) throw new Error("Registered horizons are 300 and 1500 ticks");
  mkdirSync(output, { recursive: true });
  await runQuick(spatialProbe(name as keyof typeof CASES), {
    seed: 101,
    ticks,
    wallSeconds: 120,
    swap: flag(flags, "swap", "false") === "true",
    probe: "fast",
    output: join(output, `${name}-${ticks}-${flag(flags, "swap", "false")}`),
  });
}

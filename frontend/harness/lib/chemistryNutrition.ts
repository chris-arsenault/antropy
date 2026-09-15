import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { type EngineConfig } from "../../src/engine/types";
import { chemicalContext } from "./chemicalGenotypes";
import { install, pulse, frozen } from "./engineFixtures";
import { type QuickScenario } from "./quickScenario";
import { runQuick } from "./quickRun";

/** Generalized short supply assay; numerical refinement uses the separately registered kernel fixture. */
export function nutritionProbe(
  supplied: boolean,
  sourceSpecies: number[] = [],
  overrides: Partial<EngineConfig> = {}
): QuickScenario {
  return {
    name: supplied ? "nutrition-finite" : "nutrition-empty",
    hypothesis: "External chemistry pays for growth beyond the initial internal packet.",
    specification: {
      externalMaterial: supplied ? 48 : 0,
      sigma: 2,
      sourceSpecies,
      overrides,
      controller: "kernel diagnostic: stationary, repair and transport near full effort",
    },
    target: { x: 8, y: 8, radius: 2 },
    create(engine, seed) {
      const context = chemicalContext(engine, { ...overrides, sourceSpecies }),
        genotype = structuredClone(context.genotype);
      for (const c of genotype.chromosomes) c.behavior = structuredClone(context.stationary);
      const w = engine.create(seed, {
        ...context.config,
        width: 16,
        height: 16,
        founders: 1,
        sourceCount: 0,
        ...frozen,
      });
      try {
        if (supplied)
          pulse(
            w,
            context.config.sourceSpecies.map((s) => [s, 48 / context.config.sourceSpecies.length]),
            [8, 8],
            2
          );
        install(
          w,
          [{ label: "stationary founder", genotype }],
          [{ cell: 1, variant: 0, x: 8, y: 8, heading: 0 }]
        );
        return w;
      } catch (error) {
        w.dispose();
        throw error;
      }
    },
  };
}
if (process.argv[1]?.endsWith("chemistryNutrition.ts")) {
  const directory = process.argv[2];
  if (!directory) throw new Error("Provide a new local evidence directory");
  mkdirSync(directory, { recursive: true });
  for (const supplied of [false, true])
    await runQuick(
      nutritionProbe(
        supplied,
        process.argv[3] === "fixed" ? [15, 10] : [],
        process.argv[3]?.startsWith("damage=")
          ? { damageRate: Number(process.argv[3].slice(7)) }
          : {}
      ),
      {
        seed: 101,
        ticks: 300,
        wallSeconds: 30,
        swap: false,
        probe: "fast",
        output: join(directory, supplied ? "finite" : "empty"),
      }
    );
}

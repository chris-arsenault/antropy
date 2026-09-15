import {
  type EngineConfig,
  type Genotype,
  type CellState,
  type Definition,
} from "../../src/engine/types";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { foodAccess } from "./foodAccess";
import { frozen, install, pulse, type Variant } from "./engineFixtures";
import { type QuickScenario } from "./quickScenario";

export interface CapabilityCase {
  key: string;
  hypothesis: string;
  context: "brief" | "persistent" | "uniform0" | "uniform1";
  variants: Variant[];
  mature?: boolean;
  config?: Partial<EngineConfig>;
  exposure?: { species: number; concentration: number };
  provenance?: Record<string, unknown>;
}
export function ancestralProcessing(genotype: Genotype, ancestor: Genotype): Genotype {
  const g = structuredClone(genotype);
  for (const [i, c] of g.chromosomes.entries()) {
    const source = ancestor.chromosomes[i % ancestor.chromosomes.length];
    c.physical.splice(7, 8, ...source.physical.slice(7, 15));
    c.chemistry.transporters = structuredClone(source.chemistry.transporters);
    c.chemistry.enzymes = structuredClone(source.chemistry.enzymes);
  }
  return g;
}
function uniform(
  engine: Engine,
  seed: number,
  slot: number,
  overrides: Partial<EngineConfig>
): EngineWorld {
  const world = engine.create(seed, {
    ...overrides,
    ...frozen,
    learning: overrides.learning ?? "static",
    width: 24,
    height: 24,
    founders: 16,
    sourceCount: 0,
    sourceEpochs: null,
    sourceZones: null,
  });
  const definition = world.command<Definition>("definition");
  pulse(world, [[definition.config.sourceSpecies[slot], 96]]);
  return world;
}
export function capabilityScenario(test: CapabilityCase): QuickScenario {
  const uniformFood = test.context.startsWith("uniform");
  return {
    name: test.key,
    hypothesis: test.hypothesis,
    specification: {
      ...test,
      variants: test.variants.map((v) => v.label),
      provisioning: test.mature
        ? "Target stocks assembled from common packet, with surplus recycled"
        : "Common founder stocks; inherited targets develop through paid growth",
    },
    target: { x: uniformFood ? 12 : 16, y: uniformFood ? 12 : 16, radius: uniformFood ? 0 : 2 },
    create(engine, seed, swap) {
      const world = uniformFood
        ? uniform(engine, seed, Number(test.context === "uniform1"), test.config ?? {})
        : foodAccess(test.context as "brief" | "persistent", test.config).create(
            engine,
            seed,
            false
          );
      try {
        const definition = world.command<Definition>("definition");
        if (test.exposure)
          pulse(world, [
            [
              test.exposure.species,
              test.exposure.concentration * definition.config.width * definition.config.height,
            ],
          ]);
        const frame = world.command<{ cells: CellState[] }>("frame");
        const assignments = frame.cells.map((c, i) => ({
          cell: c.id,
          variant: (i + Number(swap)) % test.variants.length,
          x: uniformFood ? 4 + 4 * (i % 4) : c.x,
          y: uniformFood ? 4 + 4 * Math.floor(i / 4) : c.y,
          heading: uniformFood ? 0 : c.heading,
        }));
        install(world, test.variants, assignments, test.mature);
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}

import { type EngineConfig, type Genotype, type Definition } from "../../src/engine/types";
import { frozen, install, pulse } from "./engineFixtures";
import { type QuickScenario } from "./quickScenario";

export function foodAccess(
  context: "persistent" | "brief",
  overrides: Partial<EngineConfig> = {}
): QuickScenario {
  const distance = context === "persistent" ? 4 : 8;
  const washout = context === "persistent" ? (overrides.washout ?? 0.0005) : Math.log(2) / 24;
  return {
    name: `food-access-${context}`,
    hypothesis:
      "Higher propulsion repays its cost for distant perishable food; lower propulsion pays near persistent food.",
    specification: {
      context,
      distance,
      washoutPerModelSecond: washout,
      patchSigma: 2,
      initialHeadingOffsetRadians: Math.PI / 4,
      variants: ["fast: swim logit +0.3", "slow: swim logit -0.55"],
      limitations:
        "Constructed strategies and bundled opportunity contexts; no evolved discovery. Ordinary chemical transformations and corpse release remain active.",
    },
    target: { x: 16, y: 16, radius: 2 },
    create(engine, seed, swap, probe) {
      const world = engine.create(seed, {
        ...overrides,
        ...frozen,
        width: 32,
        height: 32,
        founders: probe ? 1 : 16,
        sourceCount: 0,
        sourceEpochs: null,
        sourceZones: null,
        washout,
      });
      try {
        const definition = world.command<Definition>("definition");
        const genotype = world.command<Genotype>("genotype", { id: 1 });
        pulse(world, [[definition.config.sourceSpecies[0], 96]], [16, 16], 2);
        const variants = [
          { label: "fast", genotype, changes: { swimBiasDelta: 0.3 } },
          { label: "slow", genotype, changes: { swimBiasDelta: -0.55 } },
        ];
        const assignments = Array.from({ length: probe ? 1 : 16 }, (_, i) => {
          const angle = (2 * Math.PI * i) / 16;
          return {
            cell: i + 1,
            variant: probe ? Number(probe === "slow") : (i + Number(swap)) % 2,
            x: 16 + distance * Math.cos(angle),
            y: 16 + distance * Math.sin(angle),
            heading: angle + Math.PI + Math.PI / 4,
          };
        });
        install(world, variants, assignments);
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}

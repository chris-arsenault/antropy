import { type QuickScenario } from "./quickScenario";
import { type Genotype } from "../../src/engine/types";
import { assignPopulation } from "./engineFixtures";

/** Isolate the first/farthest actual startup deposit while retaining its physical supply. */
export function viabilityPatch(
  second: boolean,
  founders: number,
  compatible = false
): QuickScenario {
  return {
    name: `viability-patch-${second ? "second" : "first"}-${founders}${compatible ? "-compatible" : ""}`,
    hypothesis:
      "A startup deposit may support funded reproduction; compare ordinary founders with an explicitly altered membrane.",
    specification: {
      registration: "docs/design/chemistry/numerical-engine.md",
      source: second ? "farthest from first" : "first",
      founders,
      compatible,
      isolation:
        "64x64 periodic arena; source stock, rate, radius, composition, renewal and environment random state retained",
      correction:
        "The ordinary arm preserves the actual founder membrane. The retired fixture retargeted even its ordinary arm.",
    },
    target: { x: 32, y: 32, radius: 4 },
    create(engine, seed) {
      const world = engine.diagnostic("isolated-source", { seed, second, founders });
      if (compatible) {
        const g = world.command<Genotype>("genotype", { id: 1 });
        for (const c of g.chromosomes) c.chemistry.membrane = { ...c.chemistry.receptors[2] };
        try {
          assignPopulation(
            world,
            [{ label: "membrane matched to receptor 2", genotype: g }],
            () => 0
          );
        } catch (error) {
          world.dispose();
          throw error;
        }
      }
      return world;
    },
  };
}

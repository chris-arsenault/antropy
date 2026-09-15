import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type Genotype } from "../../src/engine/types";
import { type Flags, flag, integerFlag } from "./flags";
import { runQuick } from "./quickRun";
import { type QuickScenario } from "./quickScenario";
import { allocationGenome, chemicalContext } from "./chemicalGenotypes";
import { frozen, install, pulse } from "./engineFixtures";
import { loadEngine } from "../numerical/engine";

const KERNEL_CASES = {
  "crossfeeding-coupled": "crossfeeding",
  "crossfeeding-export-off": "crossfeeding-export-off",
  "crossfeeding-processing-off": "crossfeeding-processing-off",
  "emission-on": "emission",
  "emission-off": "emission-off",
  "exposure-compatible-external": "exposure-external-compatible",
  "exposure-distant-external": "exposure-external-distant",
  "exposure-compatible-internal": "exposure-internal-compatible",
  "exposure-distant-internal": "exposure-internal-distant",
  "detox-active": "detoxification",
  "detox-self-reaction": "detoxification-off",
  "corpse-capture": "corpse-capture",
  "corpse-uptake-off": "corpse-capture-off",
  "barrier-maintained": "barrier",
  "barrier-stopped": "barrier",
  "barrier-removed": "barrier",
  "degradation-active": "degradation",
  "degradation-self-reaction": "degradation-off",
};
function switchBuilder(world: EngineWorld, removed: boolean) {
  const cells = world.command<{ cells: { id: number; genome: number }[] }>("frame").cells;
  const behavior = world.command<Genotype["chromosomes"][number]["behavior"]>(
    "diagnosticController",
    { logits: [3, 0, 3, 0, -1, 3, 0, 0, 3] }
  );
  for (const c of cells) {
    const genotype = world.command<Genotype>("genotype", { id: c.genome });
    for (const ch of genotype.chromosomes) ch.behavior = behavior;
    world.command("intervene", { cell: c.id, genotype, resetMemory: true });
  }
  if (removed) world.command("intervene", { removeSpecies: 15 });
}
function kernelCase(name: string, diagnostic: string): QuickScenario {
  return {
    name,
    hypothesis:
      "Test the registered causal chain and its knockout: chemical acquisition or emission, local exposure/action, paid processing and funded growth. Neither coexistence nor adaptation is assumed.",
    specification: {
      diagnostic,
      registration: "docs/design/chemistry/numerical-engine.md",
      definition:
        "Exact initial binary includes all fixture genes, stocks, coordinates and finite offers",
      barrierSwitchTick: name === "barrier-maintained" ? null : 100,
      communicationBenefit: "not tested",
    },
    target: { x: 12, y: 12, radius: 2 },
    create(engine, seed) {
      if (seed !== 101)
        throw new Error("These constructed chemical opportunities are registered for seed 101");
      return engine.diagnostic(diagnostic);
    },
    beforeStep(world, tick) {
      if (tick === 100 && ["barrier-stopped", "barrier-removed"].includes(name))
        switchBuilder(world, name === "barrier-removed");
    },
  };
}
function allocationCases(engine: Engine): QuickScenario[] {
  const context = chemicalContext(engine, {
    ...frozen,
    width: 24,
    height: 24,
    founders: 1,
    sourceCount: 0,
    sourceSpecies: [0, 96],
  });
  return ["matter", "potential"].flatMap((budget) =>
    context.config.sourceSpecies.flatMap((species) =>
      [0.75, 0.25].map((share) => {
        return allocationCase(context, budget, species, share);
      })
    )
  );
}
export function chemicalOpportunityCases(engine: Engine) {
  return [
    ...Object.entries(KERNEL_CASES).map(([name, diagnostic]) => kernelCase(name, diagnostic)),
    ...allocationCases(engine),
  ];
}
export async function runChemicalOpportunities(flags: Flags): Promise<void> {
  const cases = chemicalOpportunityCases(await loadEngine()),
    selected = flag(flags, "case", "list");
  if (selected === "list") {
    console.log(cases.map((c) => c.name).join("\n"));
    return;
  }
  const names = selected.split(",");
  for (const name of names)
    if (!cases.some((c) => c.name === name || c.name.startsWith(name + "-")))
      throw new Error(`Unknown chemical opportunity: ${name}`);
  const tests = cases.filter((c) =>
    names.some((name) => c.name === name || c.name.startsWith(name + "-"))
  );
  const output = flag(flags, "output", "harness/artifacts/chemical-opportunities");
  mkdirSync(output, { recursive: true });
  for (const test of tests)
    await runQuick(test, {
      seed: integerFlag(flags, "seed", 101),
      ticks: integerFlag(flags, "ticks", test.name.startsWith("emission") ? 100 : 300),
      wallSeconds: 30,
      swap: false,
      output: join(output, test.name),
    });
}

function allocationCase(
  context: ReturnType<typeof chemicalContext>,
  budget: string,
  species: number,
  share: number
): QuickScenario {
  const quantity =
    budget === "matter"
      ? 48
      : (48 * context.chemistry.properties[0].potential) /
        context.chemistry.properties[species].potential;
  return {
    name: `allocation-${budget}-${species}-${share}`,
    hypothesis:
      "Source identity changes the return to an equal total budget of funded import and enzyme machinery",
    specification: {
      budget,
      species,
      share,
      quantity,
      preparation: "Mature targets paid from the common packet",
      registration: "docs/design/chemistry/validation.md",
    },
    target: { x: 12, y: 12, radius: 3 },
    create(engine: Engine, seed: number) {
      const world = engine.create(seed, context.config);
      try {
        pulse(world, [[species, quantity]], [12, 12], 3);
        install(
          world,
          [{ label: String(share), genotype: allocationGenome(share, context) }],
          [{ cell: 1, variant: 0, x: 12, y: 12, heading: 0 }],
          true
        );
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}

import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadEngine } from "../numerical/engine";
import { assignPopulation } from "./engineFixtures";
import { ancestralProcessing } from "./capabilityFixture";
import { type QuickScenario } from "./quickScenario";
import { capabilitySources } from "./capabilitySources";
import { runSelectionPilot } from "./quickRun";
import { type Flags, flag } from "./flags";

const JUSTIFICATION =
  "Test whether a specified current-schema machinery variant increases from 12.5% under two replenished source compositions over several generations. Requires separately registered short causal evidence; historical B-processing results do not qualify. No mutation or private/retained learning. Four fixed 10000-tick pilots, no extension.";

function pilotScenario(
  first: number,
  source: Awaited<ReturnType<typeof capabilitySources>>
): QuickScenario {
  return {
    name: `processing-invasion-source${first ? 0 : 1}`,
    hypothesis: JUSTIFICATION,
    specification: {
      source: source.provenance,
      initialVariantPercent: 12.5,
      variants: {
        2: "trait-selected living genotype",
        3: "ancestral import/enzyme alleles and targets",
      },
      nutrientDenominator:
        "Continuing supply: uptake/initial inventory percentages are intentionally null; inspect input ledger.",
    },
    target: { x: 16, y: 16, radius: 0 },
    create(engine, seed) {
      const w = engine.create(seed, {
        ...source.config,
        width: 32,
        height: 32,
        founders: 16,
        sourceCount: 2,
        sourceEpochs: {
          phaseTicks: 10000,
          mixtures: [source.config.sourceSpecies.map((_, i) => Number(i === (first ? 0 : 1)))],
        },
        sourceZones: null,
        mutationRate: 0,
        physicalMutationRate: 0,
        transmission: "clonal",
        learning: "static",
        learningRetention: 0,
      });
      assignPopulation(
        w,
        [
          { label: "specified processing variant", genotype: source.processing },
          {
            label: "ancestral processing",
            genotype: ancestralProcessing(source.processing, source.ancestor),
          },
        ],
        (i) => (i % 8 === 0 ? 0 : 1)
      );
      return w;
    },
  };
}
export async function runCapabilityPilots(flags: Flags): Promise<void> {
  const root = flag(flags, "output", "harness/artifacts/chemical-capability-pilots");
  if (!flags.values.has("justification"))
    throw new Error(
      "Provide --justification linking new short causal evidence and the pilot registration"
    );
  const source = await capabilitySources(flags, await loadEngine());
  mkdirSync(root, { recursive: true });
  for (const seed of [702, 703])
    for (const first of [1, 0]) {
      if (readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).length >= 4)
        throw new Error("Four-pilot budget exhausted");
      const scenario = pilotScenario(first, source);
      await runSelectionPilot(
        scenario,
        {
          seed,
          ticks: 10000,
          wallSeconds: 120,
          swap: false,
          output: join(root, `${scenario.name}-${seed}`),
        },
        `${JUSTIFICATION} ${flag(flags, "justification", "")}`
      );
    }
}

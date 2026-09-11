import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG } from "../../src/sim/config";
import { ancestralProcessing } from "./capabilityFixture";
import { type QuickScenario } from "./quickScenario";
import { capabilitySources } from "./capabilitySources";
import { runSelectionPilot } from "./quickRun";
import { type Flags, flag } from "./flags";

const JUSTIFICATION =
  "The short assay establishes an observed B-processing allele's benefit, but it was present in only one of 184 source cells. Test whether it increases from 12.5% under replenished B versus A over several generations, without mutation or private/retained learning. Fixed 10000-tick horizon; no extension.";

function pilotScenario(foodA: number, source: ReturnType<typeof capabilitySources>): QuickScenario {
  return {
    name: `processing-invasion-${foodA ? "A" : "B"}`,
    hypothesis: JUSTIFICATION,
    specification: {
      source: source.provenance,
      initialVariantPercent: 12.5,
      variants: { 1: "actual 1847", 2: "1847 ancestral processing targets" },
      nutrientDenominator:
        "Continuing supply: uptake/initial inventory percentages are intentionally null; inspect input ledger.",
    },
    target: { x: 16, y: 16, radius: 0 },
    offeredFoodA: 0,
    offeredFoodB: 0,
    create(seed) {
      const w = createWorld(seed, {
        ...DEFAULT_CONFIG,
        width: 32,
        height: 32,
        founders: 16,
        sourceCount: 2,
        foodEpochs: { phaseTicks: 10000, shares: [foodA] },
        mutationRate: 0,
        physicalMutationRate: 0,
        learning: "static",
        learningRetention: 0,
      });
      const genomes = [source.processing, ancestralProcessing(source.processing)];
      for (const [i, genome] of genomes.entries()) {
        const id = i + 1;
        w.genomes.set(id, { id, parent: null, born: 0, learned: 0, genome });
      }
      w.nextGenome = 3;
      for (const [i, c] of w.cells.entries()) {
        c.genome = i % 8 === 0 ? 1 : 2;
        w.ancestry.get(c.id)!.genome = c.genome;
      }
      return w;
    },
  };
}
export function runCapabilityPilots(flags: Flags): void {
  const root = flag(flags, "output", "harness/artifacts/capability-pilots-2026-09-11");
  const source = capabilitySources();
  mkdirSync(root, { recursive: true });
  for (const seed of [702, 703])
    for (const foodA of [1, 0]) {
      if (readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).length >= 4)
        throw new Error("Four-pilot budget exhausted");
      const scenario = pilotScenario(foodA, source);
      runSelectionPilot(
        scenario,
        {
          seed,
          ticks: 10000,
          wallSeconds: 120,
          swap: false,
          output: join(root, `${scenario.name}-${seed}`),
        },
        JUSTIFICATION
      );
    }
}

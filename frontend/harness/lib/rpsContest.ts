/** Constructed stress-production and compatibility contests; no prescribed coexistence. */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { type Engine } from "../../src/engine/client";
import { loadEngine } from "../numerical/engine";
import { assignPopulation, rareAssignment, frozen } from "./engineFixtures";
import { type EngineConfig as Config, type Genotype } from "../../src/engine/types";
import { chemicalContext, coordinate } from "./chemicalGenotypes";
import { emissionGenome } from "./emissionGenome";
import { chemicalConfig } from "./sourceSettings";
import { type QuickScenario } from "./quickScenario";
import { runQuick, runSelectionPilot } from "./quickRun";
import { type Flags, flag, integerFlag } from "./flags";

export interface RpsSettings {
  emission: number[];
  effort: number;
  investment: number;
  size: number;
  founders: number;
  sources: number;
  config: Config;
}
export type Strategy = "producer" | "resistant" | "sensitive" | "family-a" | "family-b";
export const STRATEGIES: Strategy[] = ["producer", "resistant", "sensitive"];
export const FAMILIES: Strategy[] = ["family-a", "family-b", "sensitive"];
export function rpsSettings(flags: Flags, engine: Engine): RpsSettings {
  const config = chemicalConfig(flags, engine),
    space = chemicalContext(engine, config).chemistry;
  const ranked = space.properties
    .map((p, s) => ({ s, stress: p.stress }))
    .sort((a, b) => b.stress - a.stress);
  const first = ranked[0].s,
    point = coordinate(first);
  const second = ranked.find(({ s }) => {
    const p = coordinate(s);
    return Math.hypot(p.x - point.x, p.y - point.y) >= 5;
  })!.s;
  const emission = flag(flags, "emission-species", `${first},${second}`).split(",").map(Number);
  if (emission.length !== 2 || emission.some((s) => !Number.isInteger(s) || s < 0 || s > 255))
    throw new Error("--emission-species requires two chemical IDs");
  const effort = Number(flag(flags, "emission-effort", "0.5"));
  const investment = Number(flag(flags, "emission-investment", "1"));
  if (!(effort >= 0 && effort <= 1 && investment >= 0 && investment <= 3))
    throw new Error("Invalid emission effort or machinery investment");
  return {
    emission,
    effort,
    investment,
    config,
    size: integerFlag(flags, "size", 32),
    founders: integerFlag(flags, "founders", 24),
    sources: integerFlag(flags, "sources", 3),
  };
}
export function strategyGenotype(strategy: Strategy, s: RpsSettings, engine: Engine): Genotype {
  if (strategy === "producer" || strategy.startsWith("family"))
    return emissionGenome(
      engine,
      chemicalContext(engine, s.config),
      s.emission[Number(strategy === "family-b")],
      s.effort,
      s.investment
    );
  const base = chemicalContext(engine, s.config).genotype,
    point = coordinate(s.emission[0]);
  const membrane =
    strategy === "resistant" ? point : { x: point.x < 8 ? 15 : 0, y: point.y < 8 ? 15 : 0 };
  return {
    ...base,
    chromosomes: base.chromosomes.map((c) => ({ ...c, chemistry: { ...c.chemistry, membrane } })),
  };
}
export function rpsScenario(
  name: string,
  strategies: Strategy[],
  s: RpsSettings,
  rare: Strategy | null = null
): QuickScenario {
  return {
    name,
    hypothesis:
      "Paid stress production and membrane compatibility change local injury and resource returns; cyclic dominance and coexistence are unproved.",
    specification: {
      strategies,
      rare,
      settings: s,
      variants: Object.fromEntries(strategies.map((v, i) => [i + 2, v])),
      nutrientDenominator:
        "Continuing supply: uptake/initial inventory percentages are intentionally null; inspect input ledger.",
    },
    target: { x: s.size / 2, y: s.size / 2, radius: 0 },
    create(engine, seed, swap) {
      const w = engine.create(seed, {
        ...s.config,
        width: s.size,
        height: s.size,
        founders: s.founders,
        sourceCount: s.sources,
        sourceEpochs: null,
        sourceZones: null,
        ...frozen,
      });
      const variants = strategies.map((label) => ({
        label,
        genotype: strategyGenotype(label, s, engine),
      }));
      try {
        assignPopulation(w, variants, (i) =>
          rareAssignment(i, variants.length, rare === null ? null : strategies.indexOf(rare), swap)
        );
      } catch (error) {
        w.dispose();
        throw error;
      }
      return w;
    },
  };
}

const PAIRS: [Strategy, Strategy][] = [
  ["producer", "sensitive"],
  ["resistant", "producer"],
  ["sensitive", "resistant"],
];
const JUSTIFICATION =
  "Rare-variant growth requires multiple funded generations. Pairwise causal effects must be established separately; no cyclic dominance is assumed. Fixed horizon, no extension, no mutation.";

function runCase(
  scenario: QuickScenario,
  flags: Flags,
  root: string,
  ticks: number,
  swap: boolean
) {
  const output = join(root, `${scenario.name}-${swap}`);
  if (existsSync(output)) throw new Error(`Evidence exists: ${output}`);
  const options = { seed: integerFlag(flags, "seed", 801), ticks, wallSeconds: 120, swap, output };
  return ticks > 3000
    ? runSelectionPilot(scenario, options, JUSTIFICATION, "rps-pilot")
    : runQuick(scenario, options);
}

function selectCases(which: string, s: RpsSettings, flags: Flags) {
  if (which === "pairwise")
    return PAIRS.flatMap((pair) =>
      [false, true].map((swap) => ({
        scenario: rpsScenario(pair.join("-"), pair, s),
        ticks: integerFlag(flags, "ticks", 3000),
        swap,
      }))
    );
  const ticks = integerFlag(flags, "ticks", 10000);
  if (which === "three-way")
    return [{ scenario: rpsScenario("three-way", STRATEGIES, s), ticks, swap: false }];
  if (which === "families")
    return [{ scenario: rpsScenario("families", FAMILIES, s), ticks, swap: false }];
  if (which.startsWith("family-invade-")) {
    const rare = which.slice("family-invade-".length) as Strategy;
    if (!FAMILIES.includes(rare)) throw new Error(`Unknown family case: ${which}`);
    return [{ scenario: rpsScenario(which, FAMILIES, s, rare), ticks, swap: false }];
  }
  const rare = which.startsWith("invade-") ? (which.slice("invade-".length) as Strategy) : null;
  if (rare === null || !STRATEGIES.includes(rare)) throw new Error(`Unknown rps case: ${which}`);
  return [{ scenario: rpsScenario(which, STRATEGIES, s, rare), ticks, swap: false }];
}

export async function runRps(flags: Flags): Promise<void> {
  const engine = await loadEngine();
  const which = flag(flags, "case", "list"),
    s = rpsSettings(flags, engine);
  const root = flag(flags, "output", "harness/artifacts/rps");
  if (which === "list") {
    console.log(
      [
        "pairwise: producer-sensitive, resistant-producer, sensitive-resistant; both placements, 3,000 ticks",
        "three-way: all three strategies together, 10,000 ticks (pilot)",
        "invade-<strategy>: that strategy starts at 10% among the other two, 10,000 ticks (pilot)",
        "families / family-invade-<family-a|family-b|sensitive>: two emission coordinates with matching membranes and a distant membrane; no identity-based recognition",
        `settings: ${JSON.stringify(s)}`,
      ].join("\n")
    );
    return;
  }
  mkdirSync(root, { recursive: true });
  for (const test of selectCases(which, s, flags))
    await runCase(test.scenario, flags, root, test.ticks, test.swap);
}

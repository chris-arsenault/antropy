/** Generic source-composition comparisons. Diagnostic roles never become browser founders. */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { type Engine } from "../../src/engine/client";
import { type EngineConfig as Config, type Genotype } from "../../src/engine/types";
import { loadEngine } from "../numerical/engine";
import {
  assignPopulation,
  rareAssignment,
  behaviorChange,
  frozen,
  type Variant,
} from "./engineFixtures";
import { allocationGenome, chemicalContext } from "./chemicalGenotypes";
export type { Variant } from "./engineFixtures";
import { chemicalConfig, twoSourceMixtures } from "./sourceSettings";
import { type QuickScenario } from "./quickScenario";
import { runQuick, runSelectionPilot } from "./quickRun";
import { type Flags, flag, integerFlag } from "./flags";

export type Diet = "source0-specialist" | "source1-specialist" | "generalist";
export const DIETS: Diet[] = ["source0-specialist", "source1-specialist", "generalist"];
export interface ZoneSettings {
  world: "zones" | "mixed";
  shares: number[];
  firstInvestment: number;
  secondInvestment: number;
  size: number;
  founders: number;
  sources: number;
  preference: boolean;
  config: Config;
}
export function zoneSettings(flags: Flags, engine: Engine): ZoneSettings {
  const world = flag(flags, "world", "zones"),
    config = chemicalConfig(flags, engine);
  if (world !== "zones" && world !== "mixed") throw new Error("--world must be zones or mixed");
  const shares = flag(flags, "shares", "0.9,0.1").split(",").map(Number);
  twoSourceMixtures(shares, config);
  const firstInvestment = Number(flag(flags, "first-investment", "0.75"));
  const secondInvestment = Number(flag(flags, "second-investment", "0.25"));
  const size = integerFlag(flags, "size", 64);
  twoSourceMixtures([firstInvestment, secondInvestment], config);
  return {
    world,
    shares,
    firstInvestment,
    secondInvestment,
    size,
    founders: integerFlag(flags, "founders", 64),
    sources: integerFlag(flags, "sources", 8),
    preference: flag(flags, "preference", "on") !== "off",
    config: { ...config, width: size, height: size },
  };
}
export function dietGenotype(diet: Diet, s: ZoneSettings, engine: Engine): Genotype {
  const shares = {
    generalist: 0.5,
    "source0-specialist": s.firstInvestment,
    "source1-specialist": s.secondInvestment,
  };
  const share = shares[diet];
  const context = chemicalContext(engine, s.config),
    g = allocationGenome(share, context);
  for (const [i, chromosome] of g.chromosomes.entries())
    chromosome.behavior = context.genotype.chromosomes[i].behavior;
  return s.preference && diet !== "generalist"
    ? behaviorChange(engine, g, { chemotaxis: Number(diet === "source1-specialist") })
    : g;
}
const dietVariants = (diets: Diet[], s: ZoneSettings, engine: Engine): Variant[] =>
  diets.map((label) => ({ label, genotype: dietGenotype(label, s, engine) }));

/** Fresh zoned or mixed world with the given genotypes on common founder bodies. */
export function zoneScenario(
  name: string,
  variants: Variant[],
  s: ZoneSettings,
  rare: string | null = null,
  provenance: Record<string, unknown> = {}
): QuickScenario {
  const rareIndex = rare === null ? null : variants.findIndex((v) => v.label === rare);
  if (rareIndex === -1) throw new Error(`Unknown rare variant: ${rare}`);
  return {
    name: `${s.world}-${name}`,
    hypothesis:
      "Test whether spatially separated source compositions change machinery returns and rare-variant growth; coexistence is an unresolved outcome.",
    specification: {
      rare,
      settings: s,
      variants: Object.fromEntries(variants.map((v, i) => [i + 2, v.label])),
      ...provenance,
      nutrientDenominator:
        "Continuing supply: uptake/initial inventory percentages are intentionally null; inspect input ledger.",
    },
    target: { x: s.size / 2, y: s.size / 2, radius: 0 },
    create(engine, seed, swap) {
      const w = engine.create(seed, {
        ...s.config,
        founders: s.founders,
        sourceCount: s.sources,
        sourceEpochs:
          s.world === "mixed"
            ? { phaseTicks: 1, mixtures: twoSourceMixtures([0.5], s.config) }
            : null,
        sourceZones: s.world === "zones" ? twoSourceMixtures(s.shares, s.config) : null,
        ...frozen,
      });
      try {
        assignPopulation(w, variants, (i) => rareAssignment(i, variants.length, rareIndex, swap));
      } catch (error) {
        w.dispose();
        throw error;
      }
      return w;
    },
  };
}

const PAIRS: [Diet, Diet][] = [
  ["source0-specialist", "source1-specialist"],
  ["source0-specialist", "generalist"],
  ["source1-specialist", "generalist"],
];
export const ZONE_JUSTIFICATION =
  "Spatial resource partitioning needs several generations of local replacement before invasion from rarity can be judged. Fixed horizon, no extension, no mutation.";

function selectCases(which: string, s: ZoneSettings, flags: Flags, engine: Engine) {
  if (which === "pairwise")
    return PAIRS.flatMap((pair) =>
      [false, true].map((swap) => ({
        scenario: zoneScenario(pair.join("-vs-"), dietVariants(pair, s, engine), s),
        ticks: integerFlag(flags, "ticks", 3000),
        swap,
      }))
    );
  const ticks = integerFlag(flags, "ticks", 10000);
  if (which === "three-way")
    return [
      {
        scenario: zoneScenario("three-way", dietVariants(DIETS, s, engine), s),
        ticks,
        swap: false,
      },
    ];
  if (which === "guilds" || which.startsWith("guild-invade-"))
    throw new Error(
      "Light-powered guilds are retired. Use chemical-opportunities crossfeeding for source-powered chains; see chemistry migration audit."
    );
  const rare = which.startsWith("invade-") ? (which.slice("invade-".length) as Diet) : null;
  if (rare === null || !DIETS.includes(rare)) throw new Error(`Unknown zones case: ${which}`);
  return [
    { scenario: zoneScenario(which, dietVariants(DIETS, s, engine), s, rare), ticks, swap: false },
  ];
}

/** Runs one contest case under the quick or pilot budget; refuses to overwrite evidence. */
export function runZoneCase(
  scenario: QuickScenario,
  root: string,
  seed: number,
  ticks: number,
  swap: boolean,
  wallSeconds = 120
) {
  const output = join(root, `${scenario.name}-${swap}`);
  if (existsSync(output)) throw new Error(`Evidence exists: ${output}`);
  const options = { seed, ticks, wallSeconds, swap, output };
  return ticks > 3000
    ? runSelectionPilot(scenario, options, ZONE_JUSTIFICATION, "zones-pilot")
    : runQuick(scenario, options);
}

export async function runZones(flags: Flags): Promise<void> {
  const engine = await loadEngine();
  const which = flag(flags, "case", "list"),
    s = zoneSettings(flags, engine);
  const root = flag(flags, "output", "harness/artifacts/zones");
  if (which === "list") {
    console.log(
      [
        "pairwise: source0-vs-source1, each versus generalist; both placements, 3,000 ticks",
        "three-way: all three diets together, 10,000 ticks (pilot)",
        "invade-<diet>: that diet starts at 10% among the other two, 10,000 ticks (pilot)",
        "Source-powered chains: chemical-opportunities --case crossfeeding; nonchemical energy is deferred",
        "--world zones|mixed selects banded or equal mixed deposits",
        `settings: ${JSON.stringify(s)}`,
      ].join("\n")
    );
    return;
  }
  mkdirSync(root, { recursive: true });
  for (const test of selectCases(which, s, flags, engine))
    await runZoneCase(test.scenario, root, integerFlag(flags, "seed", 901), test.ticks, test.swap);
}

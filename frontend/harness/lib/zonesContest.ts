/**
 * A-specialist / B-specialist / generalist contests in zoned versus mixed food worlds.
 * The three constructed genotypes share the founder brain and equal total processing stock;
 * only the A/B processing split differs. The same scenario also hosts contests between actual
 * evolved genotypes taken from a checkpoint. No winner enters the browser default.
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG } from "../../src/sim/config";
import { DEFAULT_CYCLE, type CycleConfig } from "../../src/sim/cycle";
import { controller } from "../../src/sim/controller";
import { diagnosticChanges } from "../../src/sim/controller/diagnostics";
import { type Genotype } from "../../src/sim/genetics/genotype";
import { type World } from "../../src/sim/types";
import { constructed } from "./capabilityFixture";
import { type QuickScenario } from "./quickScenario";
import { runQuick, runSelectionPilot } from "./quickRun";
import { type Flags, flag, integerFlag } from "./flags";

export type Diet = "a-specialist" | "b-specialist" | "generalist";
export const DIETS: Diet[] = ["a-specialist", "b-specialist", "generalist"];
export interface Variant {
  label: string;
  genome: Genotype;
}
export interface ZoneSettings {
  world: "zones" | "mixed";
  shares: number[];
  specialistA: number;
  specialistB: number;
  size: number;
  founders: number;
  sources: number;
  /** Initial dissolved mixed food per raster cell; zero makes deposits the only supply. */
  initialNutrient: number;
  /** Specialists steer on their own food only; off keeps the founder's shared chemotaxis. */
  preference: boolean;
  /** Element cycle constants for the contest world, or null for no cycle. */
  cycle: CycleConfig | null;
  /** Membrane crowding exponent for acquisition pathways. */
  crowding: number;
  /** External deposit release rate. */
  sourceRate: number;
  /** Harvesting stock of the constructed autotroph guild as a multiple of the founder's ratio. */
  autotrophPhoto: number;
  /** Core of the constructed autotroph guild as a multiple of the founder's. */
  autotrophCore: number;
}

/** The documented cycle constants with `--light-supply` and `--light` overrides. */
export function cycleFlags(flags: Flags): CycleConfig {
  return {
    ...DEFAULT_CYCLE,
    light: Number(flag(flags, "light", String(DEFAULT_CYCLE.light))),
    lightSupply: Number(flag(flags, "light-supply", String(DEFAULT_CYCLE.lightSupply))),
    lightRadius: Number(flag(flags, "light-radius", String(DEFAULT_CYCLE.lightRadius))),
  };
}

export function zoneSettings(flags: Flags): ZoneSettings {
  const shares = flag(flags, "shares", "0.9,0.1")
    .split(",")
    .map((v) => Number(v));
  if (shares.some((v) => !Number.isFinite(v) || v < 0 || v > 1))
    throw new Error("--shares must be fractions");
  const world = flag(flags, "world", "zones");
  if (world !== "zones" && world !== "mixed") throw new Error("--world must be zones or mixed");
  return {
    world,
    shares,
    specialistA: Number(flag(flags, "specialist-a", "0.11")),
    specialistB: Number(flag(flags, "specialist-b", "0.02")),
    size: integerFlag(flags, "size", 64),
    founders: integerFlag(flags, "founders", 64),
    sources: integerFlag(flags, "sources", 8),
    initialNutrient: Number(flag(flags, "initial-nutrient", "0")),
    preference: flag(flags, "preference", "on") !== "off",
    cycle: flag(flags, "cycle", "off") === "on" ? cycleFlags(flags) : null,
    crowding: Number(flag(flags, "crowding", String(DEFAULT_CONFIG.machineryCrowding))),
    sourceRate: Number(flag(flags, "source-rate", String(DEFAULT_CONFIG.sourceRate))),
    autotrophPhoto: Number(flag(flags, "autotroph-photo", "3")),
    autotrophCore: Number(flag(flags, "autotroph-core", "0.5")),
  };
}

/** Equal total processing stock (founder 0.08 A + 0.05 B); specialists redistribute it. */
export function dietGenotype(diet: Diet, s: ZoneSettings): Genotype {
  const founder = controller.seed(),
    total = DEFAULT_CONFIG.transporterRatio + DEFAULT_CONFIG.transportBRatio;
  const split = (foodA: number, foodB: number) => ({
    2: Math.log(foodA / DEFAULT_CONFIG.transporterRatio),
    4: Math.log(foodB / DEFAULT_CONFIG.transportBRatio),
  });
  const brain = (food: "A" | "B") =>
    s.preference ? diagnosticChanges(founder, { chemotaxis: food }) : founder;
  if (diet === "a-specialist")
    return constructed(brain("A"), split(s.specialistA, total - s.specialistA));
  if (diet === "b-specialist")
    return constructed(brain("B"), split(s.specialistB, total - s.specialistB));
  return constructed(founder, {});
}
const dietVariants = (diets: Diet[], s: ZoneSettings): Variant[] =>
  diets.map((diet) => ({ label: diet, genome: dietGenotype(diet, s) }));

/**
 * Element-cycle guilds: a small-cored harvester without transport (light per unit ground is
 * finite, so a cheap body with modest pigment is the harvester that lives on light alone), a
 * consumer without harvesting, and the founder mixotroph.
 */
export type Guild = "autotroph" | "heterotroph" | "mixotroph";
export const GUILDS: Guild[] = ["autotroph", "heterotroph", "mixotroph"];
export function guildGenotype(guild: Guild, s: ZoneSettings): Genotype {
  const brain = controller.seed();
  if (guild === "autotroph")
    return constructed(brain, {
      0: Math.log(s.autotrophCore),
      8: Math.log(s.autotrophPhoto),
      2: -3,
      4: -3,
    });
  if (guild === "heterotroph") return constructed(brain, { 8: -3 });
  return constructed(brain, {});
}
const guildVariants = (guilds: Guild[], s: ZoneSettings): Variant[] =>
  guilds.map((guild) => ({ label: guild, genome: guildGenotype(guild, s) }));

function assignment(i: number, n: number, rare: number | null, swap: boolean): number {
  if (rare !== null && i % 10 === 0) return rare;
  const slot = (i + Number(swap)) % n;
  return rare !== null && slot === rare ? (slot + 1) % n : slot;
}
function install(w: World, variants: Variant[], rare: number | null, swap: boolean) {
  for (const [i, variant] of variants.entries()) {
    const id = i + 1;
    w.genomes.set(id, { id, parent: null, born: 0, learned: 0, genome: variant.genome });
  }
  w.nextGenome = variants.length + 1;
  for (const [i, c] of w.cells.entries()) {
    c.genome = assignment(i, variants.length, rare, swap) + 1;
    w.ancestry.get(c.id)!.genome = c.genome;
  }
}

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
      "With A-rich and B-rich regions present at once, each specialist holds its region and invades from rarity; in a mixed world one diet fixes.",
    specification: {
      rare,
      settings: s,
      variants: Object.fromEntries(variants.map((v, i) => [i + 1, v.label])),
      ...provenance,
      nutrientDenominator:
        "Continuing supply: uptake/initial inventory percentages are intentionally null; inspect input ledger.",
    },
    target: { x: s.size / 2, y: s.size / 2, radius: 0 },
    offeredFoodA: 0,
    offeredFoodB: 0,
    create(seed, swap) {
      const w = createWorld(seed, {
        ...DEFAULT_CONFIG,
        width: s.size,
        height: s.size,
        founders: s.founders,
        sourceCount: s.sources,
        initialNutrient: s.initialNutrient,
        foodEpochs: undefined,
        foodZones: s.world === "zones" ? { shares: s.shares } : undefined,
        cycle: s.cycle ?? undefined,
        machineryCrowding: s.crowding,
        sourceRate: s.sourceRate,
        mutationRate: 0,
        physicalMutationRate: 0,
        learning: "static",
        learningRetention: 0,
      });
      install(w, variants, rareIndex, swap);
      return w;
    },
  };
}

const PAIRS: [Diet, Diet][] = [
  ["a-specialist", "b-specialist"],
  ["a-specialist", "generalist"],
  ["b-specialist", "generalist"],
];
export const ZONE_JUSTIFICATION =
  "Spatial resource partitioning needs several generations of local replacement before invasion from rarity can be judged. Fixed horizon, no extension, no mutation.";

function selectCases(which: string, s: ZoneSettings, flags: Flags) {
  if (which === "pairwise")
    return PAIRS.flatMap((pair) =>
      [false, true].map((swap) => ({
        scenario: zoneScenario(pair.join("-vs-"), dietVariants(pair, s), s),
        ticks: integerFlag(flags, "ticks", 3000),
        swap,
      }))
    );
  const ticks = integerFlag(flags, "ticks", 10000);
  if (which === "three-way")
    return [{ scenario: zoneScenario("three-way", dietVariants(DIETS, s), s), ticks, swap: false }];
  if (which === "guilds")
    return [{ scenario: zoneScenario("guilds", guildVariants(GUILDS, s), s), ticks, swap: false }];
  if (which.startsWith("guild-invade-")) {
    const rare = which.slice("guild-invade-".length) as Guild;
    if (!GUILDS.includes(rare)) throw new Error(`Unknown guild: ${rare}`);
    return [
      { scenario: zoneScenario(which, guildVariants(GUILDS, s), s, rare), ticks, swap: false },
    ];
  }
  const rare = which.startsWith("invade-") ? (which.slice("invade-".length) as Diet) : null;
  if (rare === null || !DIETS.includes(rare)) throw new Error(`Unknown zones case: ${which}`);
  return [{ scenario: zoneScenario(which, dietVariants(DIETS, s), s, rare), ticks, swap: false }];
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

export function runZones(flags: Flags): void {
  const which = flag(flags, "case", "list"),
    s = zoneSettings(flags);
  const root = flag(flags, "output", "harness/artifacts/zones");
  if (which === "list") {
    console.log(
      [
        "pairwise: a-vs-b, a-vs-generalist, b-vs-generalist; both placements, 3,000 ticks",
        "three-way: all three diets together, 10,000 ticks (pilot)",
        "invade-<diet>: that diet starts at 10% among the other two, 10,000 ticks (pilot)",
        "guilds / guild-invade-<autotroph|heterotroph|mixotroph>: element-cycle guilds (use --cycle on; --light, --light-supply, --crowding, --source-rate override constants)",
        "--world zones|mixed selects banded or heterogeneous mixed deposits",
        `settings: ${JSON.stringify(s)}`,
      ].join("\n")
    );
    return;
  }
  mkdirSync(root, { recursive: true });
  for (const test of selectCases(which, s, flags))
    runZoneCase(test.scenario, root, integerFlag(flags, "seed", 901), test.ticks, test.swap);
}

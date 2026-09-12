/**
 * Producer / resistant / sensitive toxin contests: the colicin rock-paper-scissors system.
 * Constructed physical genotypes share the founder brain; only toxin effort and two physical
 * targets differ. No assay score selects parents and no winner enters the browser default.
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG } from "../../src/sim/config";
import { controller } from "../../src/sim/controller";
import { diagnosticChanges } from "../../src/sim/controller/diagnostics";
import { type Genotype } from "../../src/sim/genetics/genotype";
import { type World } from "../../src/sim/types";
import { constructed } from "./capabilityFixture";
import { type QuickScenario } from "./quickScenario";
import { runQuick, runSelectionPilot } from "./quickRun";
import { type Flags, flag, integerFlag } from "./flags";

export interface RpsSettings {
  toxinEffort: number;
  producerWeapon: number;
  resistantDefense: number;
  defenseStrength: number;
  immunityStrength: number;
  toxinK: number;
  damageRate: number;
  contactDamageRate: number;
  toxinDecay: number;
  toxinDiffusion: number;
  matrix: "founder" | "off";
  size: number;
  founders: number;
  sources: number;
  sourceRate: number;
}
export type Strategy = "producer" | "resistant" | "sensitive";
export const STRATEGIES: Strategy[] = ["producer", "resistant", "sensitive"];

export function rpsSettings(flags: Flags): RpsSettings {
  const number = (key: string, fallback: number) => {
    const value = Number(flag(flags, key, String(fallback)));
    if (!Number.isFinite(value) || value < 0) throw new Error(`--${key} must be a number`);
    return value;
  };
  return {
    toxinEffort: number("toxin-effort", 0.02),
    producerWeapon: number("producer-weapon", 3),
    resistantDefense: number("resistant-defense", 4),
    defenseStrength: number("defense-strength", DEFAULT_CONFIG.defenseStrength),
    immunityStrength: number("immunity-strength", DEFAULT_CONFIG.immunityStrength),
    toxinK: number("toxin-k", DEFAULT_CONFIG.toxinK),
    damageRate: number("damage-rate", DEFAULT_CONFIG.damageRate),
    contactDamageRate: number("contact-damage", DEFAULT_CONFIG.contactDamageRate),
    toxinDecay: number("toxin-decay", DEFAULT_CONFIG.toxinDecay),
    toxinDiffusion: number("toxin-diffusion", DEFAULT_CONFIG.toxinDiffusion),
    matrix: flag(flags, "matrix", "founder") === "off" ? "off" : "founder",
    size: integerFlag(flags, "size", 32),
    founders: integerFlag(flags, "founders", 24),
    sources: integerFlag(flags, "sources", 3),
    sourceRate: number("source-rate", DEFAULT_CONFIG.sourceRate),
  };
}

const ABSENT = -3;
/** Same founder brain and core; toxin effort and two physical targets define each strategy. */
export function strategyGenotype(strategy: Strategy, s: RpsSettings): Genotype {
  const matrix = s.matrix === "off" ? ("off" as const) : undefined;
  const brain = diagnosticChanges(controller.seed(), { matrix });
  switch (strategy) {
    case "producer":
      return constructed(diagnosticChanges(brain, { toxinEffort: s.toxinEffort }), {
        5: ABSENT,
        6: Math.log(s.producerWeapon),
      });
    case "resistant":
      return constructed(diagnosticChanges(brain, { toxin: "off" }), {
        5: Math.log(s.resistantDefense),
        6: ABSENT,
      });
    default:
      return constructed(diagnosticChanges(brain, { toxin: "off" }), { 5: ABSENT, 6: ABSENT });
  }
}

function install(
  w: World,
  strategies: Strategy[],
  s: RpsSettings,
  rare: number | null,
  swap: boolean
) {
  for (const [i, strategy] of strategies.entries()) {
    const id = i + 1;
    w.genomes.set(id, {
      id,
      parent: null,
      born: 0,
      learned: 0,
      genome: strategyGenotype(strategy, s),
    });
  }
  w.nextGenome = strategies.length + 1;
  for (const [i, c] of w.cells.entries()) {
    c.genome = assignment(i, strategies.length, rare, swap) + 1;
    w.ancestry.get(c.id)!.genome = c.genome;
  }
}
/** Even round-robin placement; a rare invader takes one slot in ten and none of the others. */
function assignment(i: number, n: number, rare: number | null, swap: boolean): number {
  if (rare !== null && i % 10 === 0) return rare;
  const slot = (i + Number(swap)) % n;
  return rare !== null && slot === rare ? (slot + 1) % n : slot;
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
      "Producer beats sensitive through toxin, resistant beats producer through cheaper protection, sensitive beats resistant by paying nothing; local dispersal lets all three persist.",
    specification: {
      strategies,
      rare,
      settings: s,
      variants: Object.fromEntries(strategies.map((v, i) => [i + 1, v])),
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
        sourceRate: s.sourceRate,
        foodEpochs: undefined,
        foodZones: undefined,
        defenseStrength: s.defenseStrength,
        immunityStrength: s.immunityStrength,
        toxinK: s.toxinK,
        damageRate: s.damageRate,
        contactDamageRate: s.contactDamageRate,
        toxinDecay: s.toxinDecay,
        toxinDiffusion: s.toxinDiffusion,
        mutationRate: 0,
        physicalMutationRate: 0,
        learning: "static",
        learningRetention: 0,
      });
      install(w, strategies, s, rare === null ? null : strategies.indexOf(rare), swap);
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
  "Rock-paper-scissors coexistence needs several generations of local replacement; pairwise 3,000-tick contests only establish each dominance. Fixed horizon, no extension, no mutation.";

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
  const rare = which.startsWith("invade-") ? (which.slice("invade-".length) as Strategy) : null;
  if (rare === null || !STRATEGIES.includes(rare)) throw new Error(`Unknown rps case: ${which}`);
  return [{ scenario: rpsScenario(which, STRATEGIES, s, rare), ticks, swap: false }];
}

export function runRps(flags: Flags): void {
  const which = flag(flags, "case", "list"),
    s = rpsSettings(flags);
  const root = flag(flags, "output", "harness/artifacts/rps");
  if (which === "list") {
    console.log(
      [
        "pairwise: producer-sensitive, resistant-producer, sensitive-resistant; both placements, 3,000 ticks",
        "three-way: all three strategies together, 10,000 ticks (pilot)",
        "invade-<strategy>: that strategy starts at 10% among the other two, 10,000 ticks (pilot)",
        `settings: ${JSON.stringify(s)}`,
      ].join("\n")
    );
    return;
  }
  mkdirSync(root, { recursive: true });
  for (const test of selectCases(which, s, flags))
    runCase(test.scenario, flags, root, test.ticks, test.swap);
}

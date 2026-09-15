import { flag, integerFlag, parseFlags, seedsFlag, type Flags } from "./lib/flags";
import { openLedger } from "./lib/ledger";
import { runBacteria } from "./lib/bacteriaRun";
import { loadEngine } from "./numerical/engine";
import { runCapacity } from "./numerical/capacity";
import { compareCheckpoint } from "./lib/bacteriaCompetition";
import { runEcologyAssays } from "./lib/ecologyAssays";
import { runDefaultEcology } from "./lib/defaultEcology";
import { runQuickPanel } from "./lib/quickPanel";
import { runCapabilities } from "./lib/capabilityCli";
import { runCapabilityPilots } from "./lib/capabilityPilots";
import { runRps } from "./lib/rpsContest";
import { runZones } from "./lib/zonesContest";
import { runEvolve } from "./lib/evolveRun";
import { runInvasion } from "./lib/invasion";
import { runSpatialProbe } from "./lib/spatialProbes";
import { runContinuationCheck } from "./lib/continuationCheck";
import { chemicalConfig } from "./lib/sourceSettings";
import { runChemicalOpportunities } from "./lib/chemicalOpportunities";
import { runChemistryPerformance } from "./lib/chemistryPerformance";
import { runViability } from "./lib/viability";
import { requireRegistration } from "./lib/longRun";
import { runResourceEconomy } from "./numerical/resourceEconomy";

async function bacteria(flags: Flags) {
  const engine = await loadEngine(),
    config = chemicalConfig(flags, engine),
    ticks = integerFlag(flags, "ticks", 3000);
  const justification = requireRegistration(flags, ticks);
  for (const [key, name] of Object.entries({
    learning: "learning",
    ploidy: "ploidy",
    transmission: "transmission",
    crossover: "crossover",
    mutationKind: "mutation-kind",
    reproduction: "reproduction",
  }))
    if (flags.values.has(name)) config[key] = flag(flags, name, "");
  if (flags.values.has("learning-retention"))
    config.learningRetention = Number(flag(flags, "learning-retention", ""));
  for (const seed of seedsFlag(flags, "101"))
    runBacteria(
      engine,
      seed,
      ticks,
      flag(flags, "mutation", "true") === "true",
      flag(flags, "output", "harness/artifacts/bacteria"),
      config,
      integerFlag(flags, "wall-seconds", 120),
      justification
    );
}
const handlers: Record<string, (flags: Flags) => Promise<unknown>> = {
  "resource-economy-check": runResourceEconomy,
  viability: runViability,
  "chemistry-performance": runChemistryPerformance,
  "chemical-opportunities": runChemicalOpportunities,
  "continuation-check": runContinuationCheck,
  "spatial-probe": runSpatialProbe,
  rps: runRps,
  zones: runZones,
  evolve: runEvolve,
  invasion: runInvasion,
  "capability-pilots": runCapabilityPilots,
  capabilities: runCapabilities,
  "quick-food-access": runQuickPanel,
  bacteria,
  "ecology-default": (f) =>
    runDefaultEcology(
      seedsFlag(f, "101,102"),
      integerFlag(f, "ticks", 3000),
      flag(f, "output", "harness/artifacts/default-ecology")
    ),
  "ecology-causal": (f) =>
    runEcologyAssays(
      seedsFlag(f, "201,202"),
      integerFlag(f, "ticks", 1200),
      flag(f, "output", "harness/artifacts/strategic-ecology"),
      flag(f, "mechanism", "all")
    ),
  "bacteria-capacity": capacity,
  "bacteria-compare": (f) =>
    compareCheckpoint(
      flag(f, "checkpoint", ""),
      flag(f, "candidate", "2") === "representative"
        ? "representative"
        : integerFlag(f, "candidate", 2),
      seedsFlag(f, "201,202"),
      integerFlag(f, "ticks", 3000),
      flag(f, "output", "harness/artifacts/bacteria")
    ),
};
const [command, ...arguments_] = process.argv.slice(2),
  flags = parseFlags(command === "sql" ? [] : arguments_);
if (command === "recent" || command === "sql") {
  const db = openLedger();
  try {
    console.log(
      JSON.stringify(
        command === "recent"
          ? db
              .prepare("SELECT id,experiment,seed,ticks,summary FROM runs ORDER BY id DESC LIMIT ?")
              .all(integerFlag(flags, "n", 5))
          : db.prepare(arguments_.join(" ")).all(),
        null,
        2
      )
    );
  } finally {
    db.close();
  }
} else if (handlers[command]) await handlers[command](flags);
else throw new Error(`Commands: ${Object.keys(handlers).join(", ")}, recent, sql`);

function capacity(f: Flags) {
  for (const key of f.values.keys())
    if (key !== "output")
      throw new Error(
        "bacteria-capacity has fixed registered workloads; only --output is accepted"
      );
  return runCapacity(flag(f, "output", "harness/artifacts/numerical-capacity"));
}

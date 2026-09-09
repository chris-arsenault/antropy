import { flag, integerFlag, parseFlags, seedsFlag } from "./lib/flags";
import { openLedger } from "./lib/ledger";
import { runBacteria, recordMeasurement } from "./lib/bacteriaRun";
import { createWorld } from "../src/sim/world";
import { DEFAULT_CONFIG, type Config } from "../src/sim/config";
import { compareCheckpoint } from "./lib/bacteriaCompetition";

const [command, ...arguments_] = process.argv.slice(2),
  flags = parseFlags(command === "sql" ? [] : arguments_);
if (command === "bacteria-capacity") {
  recordMeasurement(
    createWorld(integerFlag(flags, "seed", 101), {
      ...DEFAULT_CONFIG,
      founders: integerFlag(flags, "population", 2000),
      mutationRate: 0,
      physicalMutationRate: 0,
    }),
    integerFlag(flags, "ticks", 100),
    flag(flags, "output", "harness/artifacts/bacteria"),
    "Initialization load probe, not sustained ecology",
    "bacteria-capacity"
  );
} else if (command === "bacteria") {
  const regime = flag(flags, "regime", "persistent");
  if (regime !== "persistent" && regime !== "transient") throw new Error("Invalid regime");
  for (const seed of seedsFlag(flags, "101"))
    runBacteria(
      seed,
      integerFlag(flags, "ticks", 3000),
      regime,
      flag(flags, "mutation", "true") === "true",
      flag(flags, "output", "harness/artifacts/bacteria"),
      {
        learning: flag(flags, "learning", DEFAULT_CONFIG.learning) as Config["learning"],
        learningRetention: Number(
          flag(flags, "learning-retention", String(DEFAULT_CONFIG.learningRetention))
        ),
        ploidy: flag(flags, "ploidy", DEFAULT_CONFIG.ploidy) as Config["ploidy"],
        transmission: flag(
          flags,
          "transmission",
          DEFAULT_CONFIG.transmission
        ) as Config["transmission"],
        crossover: flag(flags, "crossover", DEFAULT_CONFIG.crossover) as Config["crossover"],
        mutationKind: flag(
          flags,
          "mutation-kind",
          DEFAULT_CONFIG.mutationKind
        ) as Config["mutationKind"],
        reproduction: flag(
          flags,
          "reproduction",
          DEFAULT_CONFIG.reproduction
        ) as Config["reproduction"],
      }
    );
} else if (command === "bacteria-compare") {
  compareCheckpoint(
    flag(flags, "checkpoint", ""),
    integerFlag(flags, "candidate", 2),
    seedsFlag(flags, "201,202"),
    integerFlag(flags, "ticks", 3000),
    flag(flags, "output", "harness/artifacts/bacteria")
  );
} else if (command === "recent" || command === "sql") {
  const db = openLedger();
  const rows =
    command === "recent"
      ? db
          .prepare("SELECT id,experiment,seed,ticks,summary FROM runs ORDER BY id DESC LIMIT ?")
          .all(integerFlag(flags, "n", 5))
      : db.prepare(arguments_.join(" ")).all();
  console.log(JSON.stringify(rows, null, 2));
  db.close();
} else throw new Error("Commands: bacteria, bacteria-compare, bacteria-capacity, recent, sql");

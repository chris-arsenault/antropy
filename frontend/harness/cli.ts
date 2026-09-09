import { runForagerComparison } from "./experiments/foragerComparison";
import { runColonySurvival } from "./experiments/colonySurvival";
import { runColonyDataset } from "./experiments/colonyDataset";
import { runColonyNetworkEvaluation } from "./experiments/colonyNetworkEvaluation";
import { runColonyParity } from "./experiments/colonyParity";
import { runColonyTraps } from "./experiments/colonyTraps";
import { runColonyDecisions } from "./experiments/colonyDecisions";
import { runColonyYield } from "./experiments/colonyYield";
import { runColonyOutcomes } from "./experiments/colonyOutcomes";
import { runRegisteredProbe } from "./experiments/registeredProbe";
import { runRegisteredCheckpoint } from "./experiments/registeredCheckpoint";
import { runOptimizeColony } from "./experiments/optimizeColony";
import { runOptimizeRnn } from "./experiments/optimizeRnn";
import { runTrainRnn } from "./experiments/trainRnn";
import { integerFlag, parseFlags, type Flags } from "./lib/flags";
import { openLedger } from "./lib/ledger";
import { runKnowledgeColony } from "./experiments/knowledgeColony";
import { runColonyCapacity } from "./experiments/colonyCapacity";
import { runConstruction } from "./experiments/construction";
import { runConstructionColony } from "./experiments/constructionColony";
import { runConstructionPressures } from "./experiments/constructionPressures";
import { runClimatePanel } from "./experiments/climatePanel";
import { runDefaultPressureAudit } from "./experiments/defaultPressureAudit";
import { runCollectiveWork } from "./experiments/collectiveWork";

function recent(arguments_: readonly string[]): void {
  const flags = parseFlags(arguments_);
  const count = integerFlag(flags, "n", 10);
  const rows = openLedger()
    .prepare(
      `SELECT id, experiment, driver, seed, ticks, git, started, wall_ms, summary
       FROM runs ORDER BY id DESC LIMIT ?`
    )
    .all(count) as Record<string, unknown>[];
  for (const row of rows.reverse()) console.log(JSON.stringify(row));
}

function sql(arguments_: readonly string[]): void {
  if (arguments_.length === 0) throw new Error("sql query required");
  console.log(JSON.stringify(openLedger().prepare(arguments_.join(" ")).all(), null, 2));
}

async function main(): Promise<void> {
  const [command, ...arguments_] = process.argv.slice(2);
  const colonyCommands: Record<string, (flags: Flags) => void> = {
    "collective-work": runCollectiveWork,
    "default-pressure-audit": runDefaultPressureAudit,
    construction: runConstruction,
    "construction-pressures": runConstructionPressures,
    "climate-panel": runClimatePanel,
    "construction-colony": runConstructionColony,
    "colony-capacity": runColonyCapacity,
    "knowledge-colony": runKnowledgeColony,
    "colony-dataset": runColonyDataset,
    "colony-evaluate": runColonyNetworkEvaluation,
    "colony-parity": runColonyParity,
    "colony-traps": runColonyTraps,
    "colony-decisions": runColonyDecisions,
    "colony-yield": runColonyYield,
    "colony-outcomes": runColonyOutcomes,
    "registered-probe": runRegisteredProbe,
    "registered-checkpoint": runRegisteredCheckpoint,
  };
  if (Object.hasOwn(colonyCommands, command))
    return colonyCommands[command](parseFlags(arguments_));
  if (command === "colony-survival") {
    runColonySurvival(parseFlags(arguments_));
    return;
  }
  if (command === "colony-optimize") {
    await runOptimizeColony(parseFlags(arguments_));
    return;
  }
  if (command === "forager-comparison") {
    runForagerComparison(parseFlags(arguments_));
    return;
  }
  if (command === "train-rnn") {
    runTrainRnn(parseFlags(arguments_));
    return;
  }
  if (command === "optimize-rnn") {
    await runOptimizeRnn(parseFlags(arguments_));
    return;
  }
  if (command === "recent") {
    recent(arguments_);
    return;
  }
  if (command === "sql") {
    sql(arguments_);
    return;
  }
  throw new Error(
    "usage: harness <colony-survival|colony-dataset|colony-evaluate|colony-parity|colony-traps|colony-decisions|colony-yield|colony-outcomes|registered-probe|registered-checkpoint|colony-optimize|forager-comparison|train-rnn|optimize-rnn|recent|sql> [flags]"
  );
}

await main();

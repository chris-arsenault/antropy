import { applyConfigOverrides, configPreset } from "../src/sim/config";
import { formatSummary, runColony } from "./lib/colonyRun";
import { DRIVER_NAMES, makeDriver } from "./lib/drivers";
import { flag, intFlag, parseFlags, seedsOf, type Flags } from "./lib/flags";
import { openLedger, recordRun } from "./lib/ledger";
import { applyPatches } from "./lib/patch";
import { runCalibrate } from "./experiments/calibrate";
import { runCalibrateColonyEconomy } from "./experiments/calibrateColonyEconomy";
import { runDerive } from "./experiments/derive";
import { runDeriveDigger } from "./experiments/deriveDigger";
import { runDeriveColonyLoop } from "./experiments/deriveColonyLoop";
import { runBakeColonyRun, runCloneColonyLoop } from "./experiments/cloneColonyLoop";
import { runColonyLoopRobustness } from "./experiments/colonyLoopRobustness";
import { runCorrectColonyEnergy } from "./experiments/correctColonyEnergy";
import { runOptimizeColonyLoop } from "./experiments/optimizeColonyLoop";
import { runOptimizeColonyEnergy } from "./experiments/optimizeColonyEnergy";
import { runDeriveVivo } from "./experiments/deriveVivo";
import { runColonyLoop } from "./experiments/colonyLoopRunner";
import { runEvaluateColonyCohort } from "./experiments/evaluateColonyCohort";
import { runDeterminism } from "./determinism";

/**
 * Harness CLI — the measurement instrument layer (Appendix C, O-layer).
 * Runs land in harness/ledger.db; nothing here executes in a test tier.
 *
 *   pnpm harness run --driver shelter --seeds 4200,4201 --ticks 14000
 *   pnpm harness run --driver rung1 --config phase2 --ticks 20000  (base case)
 *   ... --config phase2 --flag nestDecay=true   (toggle one feature back on)
 *   pnpm harness tournament --seeds 4200 --ticks 28000
 *   pnpm harness ladder --ticks 8000
 *   pnpm harness calibrate --ticks 4000
 *   pnpm harness calibrate-colony-economy --profile baseline:1:1:1:1:1
 *   pnpm harness recent [n]
 *   pnpm harness sql "select ..."
 *   pnpm harness determinism --seed 8001 --warmup 700 --span 500
 *
 * Shared flags: --patch TABLE.key=value (repeatable), --cadence N,
 * --label text, --follow antId, --vault N, --queen-surface.
 */
export interface RunPlan {
  experiment: string;
  driverName: string;
  overrides: { vaultDepth?: number; queenOnSurface?: boolean };
  seed: number;
}

export function executeRuns(flags: Flags, plans: RunPlan[]): void {
  const ticks = intFlag(flags, "ticks", 14_000);
  const cadence = intFlag(flags, "cadence", 250);
  const label = flag(flags, "label", "");
  const follow = flags.values.has("follow") ? intFlag(flags, "follow", 0) : null;
  const patches = flags.values.get("patch") ?? [];
  const simConfig = applyConfigOverrides(
    configPreset(flag(flags, "config", "full")),
    flags.values.get("flag") ?? []
  );
  const db = openLedger();

  const restore = applyPatches(patches);
  try {
    for (const plan of plans) {
      const driver = makeDriver(plan.driverName, plan.overrides);
      const start = Date.now();
      const result = runColony({
        driver,
        seed: plan.seed,
        ticks,
        cadence,
        followAntId: follow,
        simConfig,
      });
      const runId = recordRun(
        db,
        {
          experiment: plan.experiment,
          label,
          driver: driver.name,
          seed: plan.seed,
          ticks,
          cadence,
          params: { vaultDepth: driver.vaultDepth, queenOnSurface: driver.queenOnSurface },
          patches,
          summary: result.summary,
          wallMs: Date.now() - start,
        },
        result.series,
        result.trace
      );
      console.log(`[run ${runId}] ${formatSummary(driver.name, plan.seed, result.summary)}`);
    }
  } finally {
    restore();
  }
}

function cmdRun(flags: Flags): void {
  const driverName = flag(flags, "driver", "");
  if (!driverName) {
    throw new Error(`--driver required (one of: ${DRIVER_NAMES.join(", ")})`);
  }
  const overrides: RunPlan["overrides"] = {};
  if (flags.values.has("vault")) {
    overrides.vaultDepth = intFlag(flags, "vault", 0);
  }
  if (flags.values.has("queen-surface")) {
    overrides.queenOnSurface = true;
  }
  const plans = seedsOf(flags, "4200").map((seed) => ({
    experiment: "single",
    driverName,
    overrides,
    seed,
  }));
  executeRuns(flags, plans);
}

function cmdTournament(flags: Flags): void {
  const plans = seedsOf(flags, "4200").flatMap((seed) =>
    ["surface", "shelter", "architect"].map((driverName) => ({
      experiment: "tournament",
      driverName,
      overrides: {},
      seed,
    }))
  );
  executeRuns(flags, plans);
}

function cmdLadder(flags: Flags): void {
  if (!flags.values.has("ticks")) {
    flags.values.set("ticks", ["8000"]);
  }
  const plans = seedsOf(flags, "8101").flatMap((seed) =>
    ["rung1", "rung2", "rung2-degraded"].map((driverName) => ({
      experiment: "ladder",
      driverName,
      overrides: {},
      seed,
    }))
  );
  executeRuns(flags, plans);
}

function cmdRecent(flags: Flags): void {
  const n = intFlag(flags, "n", 20);
  const db = openLedger();
  const rows = db
    .prepare(
      `SELECT id, experiment, driver, seed, ticks, git, started, wall_ms, summary
       FROM runs ORDER BY id DESC LIMIT ?`
    )
    .all(n) as Record<string, unknown>[];
  for (const row of rows.reverse()) {
    const s = JSON.parse(row.summary as string) as Record<string, unknown>;
    console.log(
      `#${row.id} ${row.started} [${row.git}] ${row.experiment}/${row.driver}` +
        ` seed=${row.seed} ticks=${row.ticks} (${((row.wall_ms as number) / 1000).toFixed(0)}s)` +
        ` → ${formatSummary(row.driver as string, row.seed as number, s)}`
    );
  }
}

function cmdSql(argv: string[]): void {
  const db = openLedger();
  const rows = db.prepare(argv.join(" ")).all();
  console.log(JSON.stringify(rows, null, 1));
}

const ASYNC_EXPERIMENTS: Record<string, (flags: Flags) => Promise<void>> = {
  "derive-colony-loop": runDeriveColonyLoop,
  "optimize-colony-loop": runOptimizeColonyLoop,
  "optimize-colony-energy": runOptimizeColonyEnergy,
  "calibrate-colony-economy": runCalibrateColonyEconomy,
  "evaluate-colony-cohort": runEvaluateColonyCohort,
  "robustness-colony-loop": runColonyLoopRobustness,
};

function handleDerivation(command: string, rest: string[]): boolean {
  const asyncExperiment = ASYNC_EXPERIMENTS[command];
  if (asyncExperiment) {
    void asyncExperiment(parseFlags(rest));
    return true;
  }
  if (command === "derive") {
    runDerive(parseFlags(rest));
    return true;
  }
  if (command === "derive-digger") {
    runDeriveDigger(parseFlags(rest));
    return true;
  }
  if (command === "clone-colony-loop") {
    runCloneColonyLoop(parseFlags(rest));
    return true;
  }
  if (command === "bake-colony-run") {
    runBakeColonyRun(parseFlags(rest));
    return true;
  }
  if (command === "correct-colony-energy") {
    runCorrectColonyEnergy(parseFlags(rest));
    return true;
  }
  if (command === "colony-loop") {
    runColonyLoop(parseFlags(rest));
    return true;
  }
  return false;
}

function main(): void {
  const [command, ...rest] = process.argv.slice(2);
  if (handleDerivation(command, rest)) {
    return;
  }
  switch (command) {
    case "run":
      return cmdRun(parseFlags(rest));
    case "tournament":
      return cmdTournament(parseFlags(rest));
    case "ladder":
      return cmdLadder(parseFlags(rest));
    case "calibrate":
      return runCalibrate(parseFlags(rest));
    case "derive-vivo":
      void runDeriveVivo(parseFlags(rest));
      return;
    case "determinism":
      return runDeterminism(parseFlags(rest));
    case "recent":
      return cmdRecent(parseFlags(rest));
    case "sql":
      return cmdSql(rest);
    default:
      throw new Error(
        "usage: harness <run|tournament|ladder|calibrate|calibrate-colony-economy|evaluate-colony-cohort|derive|derive-vivo|derive-digger|derive-colony-loop|clone-colony-loop|bake-colony-run|robustness-colony-loop|correct-colony-energy|optimize-colony-loop|optimize-colony-energy|colony-loop|determinism|recent|sql> [flags]"
      );
  }
}

main();

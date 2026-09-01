import {
  axisSweep,
  DEFAULT_ECONOMY,
  runEconomyPoint,
  type CalibrationLedger,
} from "../../src/sim/calibration";
import { sensorOracle } from "../../src/sim/oracles/policies";
import { flag, intFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

/**
 * §B.6 calibration sweep as a harness experiment: per-axis economy
 * excursions under the rung-2 oracle, plus the oracle-vs-seeded gap at
 * defaults. Each point lands as one ledger run (no time series — the
 * economy points are the samples).
 */
export function runCalibrate(flags: Flags): void {
  const ticks = intFlag(flags, "ticks", 4000);
  const seed = intFlag(flags, "seed", 9100);
  const label = flag(flags, "label", "");
  const db = openLedger();

  const record = (point: string, driver: string, ledger: CalibrationLedger, wallMs: number) => {
    const runId = recordRun(
      db,
      {
        experiment: "calibrate",
        label,
        driver,
        seed,
        ticks,
        cadence: 0,
        params: { point },
        patches: [],
        summary: ledger as unknown as Record<string, unknown>,
        wallMs,
      },
      [],
      []
    );
    console.log(`[run ${runId}] ${point}/${driver}: ${JSON.stringify(ledger)}`);
  };

  for (const point of axisSweep()) {
    const start = Date.now();
    const ledger = runEconomyPoint(seed, point, ticks, sensorOracle);
    record(point.name, "rung2", ledger, Date.now() - start);
  }
  const start = Date.now();
  const seeded = runEconomyPoint(seed, DEFAULT_ECONOMY, ticks);
  record("defaults", "seeded", seeded, Date.now() - start);
}

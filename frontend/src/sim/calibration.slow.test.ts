import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { axisSweep, DEFAULT_ECONOMY, formatLedger, runEconomyPoint } from "./calibration";
import { sensorOracle } from "./oracles/policies";

// Slow tier: §B.6 viable-region measurement. This test IS the harness —
// `pnpm calibrate` runs it and the ledgers land in test-results/
// calibration.txt; docs/calibration.md records the interpreted numbers.
const RUN_TICKS = 4000;

function record(block: string): void {
  mkdirSync("test-results", { recursive: true });
  appendFileSync("test-results/calibration.txt", `${block}\n`);
}

describe("calibration sweep (§B.6)", () => {
  it("defaults sit in the viable region's interior under the rung-2 oracle", { timeout: 300_000 }, () => {
    const ledgers = axisSweep().map((point) => runEconomyPoint(9100, point, RUN_TICKS, sensorOracle));
    const summary = ledgers.map(formatLedger).join("\n");
    record(`calibration sweep @${RUN_TICKS} ticks\n${summary}`);

    const byName = new Map(ledgers.map((ledger) => [ledger.name, ledger]));
    const center = byName.get("defaults");
    expect(center?.survived).toBe(true);
    expect(center?.merit).toBeGreaterThan(1);
    // Interior, not edge: doubling any axis must not kill the colony, and
    // at least one axis must tolerate its 4× cut (margin below defaults).
    for (const name of ["foodTarget*2", "foodEnergy*2", "spawn*2"]) {
      expect(byName.get(name)?.survived, name).toBe(true);
    }
    const cuts = ["foodTarget/4", "foodEnergy/4", "spawn/4"];
    expect(cuts.some((name) => byName.get(name)?.survived)).toBe(true);
  });

  it("measures the oracle-vs-seeded gap at defaults", { timeout: 300_000 }, () => {
    const oracle = runEconomyPoint(9100, DEFAULT_ECONOMY, RUN_TICKS, sensorOracle);
    const seeded = runEconomyPoint(9100, DEFAULT_ECONOMY, RUN_TICKS);
    record(
      `oracle-vs-seeded gap @${RUN_TICKS} ticks\noracle: ${formatLedger(oracle)}\nseeded: ${formatLedger(seeded)}`
    );
    expect(oracle.survived).toBe(true);
    // The seeded colony rides its claustral stockpile this long at defaults;
    // the recorded gap is the merit difference, not survival.
    expect(seeded.survived).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { withPatched } from "../calibration";
import { EGG_EXPOSURE } from "../tunables";
import { makeContenders, makeIncrements, runTournamentColony } from "./tournament";

/**
 * Slow tier: the §B.8 tournament gates (ADR-0011). The world must make
 * the seeded underground lifestyle viable and surface living strictly
 * inferior on the asset ledgers — never lethal (Rule 6). Measured numbers
 * are recorded in docs/calibration.md; gates pin the ordering with slack
 * below the measured margins.
 */
const RUN_TICKS = 28_000;
const SEED = 4200;

describe("bootstrap tournament (§B.8, ADR-0011)", () => {
  it("surface living is survivable but strictly inferior; underground is viable", { timeout: 900_000 }, () => {
    const [surfaceSpec, shelterSpec, architectSpec] = makeContenders();
    const surface = runTournamentColony(SEED, surfaceSpec, RUN_TICKS);
    const shelter = runTournamentColony(SEED, shelterSpec, RUN_TICKS);
    const architect = runTournamentColony(SEED, architectSpec, RUN_TICKS);

    // Viability of the underground lifestyle (the bootstrap requirement).
    expect(shelter.survived).toBe(true);
    expect(shelter.quarters[2].ants).toBeGreaterThanOrEqual(8);
    expect(shelter.merit).toBeGreaterThan(1500);

    // Surface is survivable (colony persists into the harsh quarter)...
    expect(surface.quarters[2].ants).toBeGreaterThan(0);
    // ...but strictly inferior on the master ledger (worker-days — legal
    // plume homing removed the compass subsidy that had inverted this)
    // and on brood survival.
    expect(surface.eggSurvival).toBeLessThan(0.75);
    expect(shelter.eggSurvival).toBeGreaterThan(0.8);
    expect(surface.workerDays).toBeLessThan(shelter.workerDays * 0.6);

    // The vault protects brood at least as well as the chamber.
    expect(architect.eggSurvival).toBeGreaterThanOrEqual(shelter.eggSurvival - 0.02);
    expect(architect.vaultDepth).toBeGreaterThanOrEqual(4);
  });

  it("rule 7: the first construction increment does not degrade the ledger", { timeout: 900_000 }, () => {
    const [dig0, dig1] = makeIncrements();
    const base = runTournamentColony(SEED, dig0, RUN_TICKS);
    const one = runTournamentColony(SEED, dig1, RUN_TICKS);
    expect(one.workerDays).toBeGreaterThanOrEqual(base.workerDays * 0.95);
    expect(one.eggSurvival).toBeGreaterThanOrEqual(base.eggSurvival - 0.05);
  });

  it("ablation: removing egg exposure collapses the brood-survival edge", { timeout: 1_200_000 }, () => {
    const [surfaceSpec, shelterSpec] = makeContenders();
    withPatched(EGG_EXPOSURE, { deathChancePerTick: 0 }, () => {
      const surface = runTournamentColony(SEED, surfaceSpec, 12_000);
      const shelter = runTournamentColony(SEED, shelterSpec, 12_000);
      // The brood channel's edge rests on this liability and only on it:
      // with it off, surface brood survives like chamber brood (§B.8.2
      // per-channel ablation). Worker-day edges from retreat and homing
      // dynamics legitimately remain.
      expect(surface.eggSurvival).toBeGreaterThan(0.99);
      expect(Math.abs(surface.eggSurvival - shelter.eggSurvival)).toBeLessThan(0.01);
    });
  });
});

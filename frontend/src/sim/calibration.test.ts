import { describe, expect, it } from "vitest";
import { DEFAULT_ECONOMY, runEconomyPoint, withEconomy } from "./calibration";
import { sensorOracle } from "./oracles/policies";
import { ENERGY, FOOD_GOVERNOR } from "./tunables";

describe("calibration harness", () => {
  it("restores tunables after an override, even on throw", () => {
    const before = { food: ENERGY.foodEnergy, target: FOOD_GOVERNOR.targetCount };
    expect(() =>
      withEconomy({ ...DEFAULT_ECONOMY, foodEnergy: 9 }, () => {
        expect(ENERGY.foodEnergy).toBe(9);
        throw new Error("boom");
      })
    ).toThrow("boom");
    expect(ENERGY.foodEnergy).toBe(before.food);
    expect(FOOD_GOVERNOR.targetCount).toBe(before.target);
  });

  it("marks precondition-failing points inviable instead of throwing", () => {
    const dead = runEconomyPoint(9001, { ...DEFAULT_ECONOMY, name: "dead", maxSpawnPerPass: 0 }, 1);
    expect(dead.viable).toBe(false);
    expect(dead.ratios).toBeNull();
  });

  it("smoke: produces a full ledger for a short oracle run", () => {
    const ledger = runEconomyPoint(9002, DEFAULT_ECONOMY, 300, sensorOracle);
    expect(ledger.viable).toBe(true);
    expect(ledger.survived).toBe(true);
    expect(ledger.ants).toBeGreaterThan(0);
    expect(ledger.ratios).not.toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { type ColonyEnergyVerdict } from "../colonyEnergyWorker";
import {
  profilePatches,
  summarizeControllerPopulation,
  type ControllerEnergyResult,
} from "./colonyEconomy";

function verdict(balance: number, positiveCount: number, gathered: number): ColonyEnergyVerdict {
  return {
    balances: [balance],
    positiveCount,
    medianBalance: balance,
    meanBalance: balance,
    worstBalance: balance,
    meanGathered: gathered,
    meanBurned: gathered - balance,
    meanPheromoneEnergyBurned: 0,
  };
}

describe("colony economy calibration", () => {
  it("scales food and tank together while pricing every active work cost", () => {
    const patches = profilePatches({
      name: "example",
      energyScale: 2,
      workScale: 0.5,
      signalScale: 0.25,
      foodDensityScale: 3,
      foodScentScale: 2,
    });

    expect(patches).toContain("ENERGY.foodEnergy=4.8");
    expect(patches).toContain("ENERGY.max=16");
    expect(patches).toContain("ENERGY.stepCost=0.000001875");
    expect(patches).toContain("ENERGY.depositCostPerUnit=0.0000078125");
    expect(patches).toContain("DIG.cost.foodPickup=0.00000625");
    expect(patches).toContain("FOOD_GOVERNOR.targetCount=4800");
    expect(patches).toContain("FOOD_GOVERNOR.maxSpawnPerPass=120");
    expect(patches).toContain("SCENT.foodSourceStrength=1.6");
  });

  it("requires food gathering and positive energy in most worlds", () => {
    const results: ControllerEnergyResult[] = [
      { source: "a", verdict: verdict(4, 3, 5) },
      { source: "b", verdict: verdict(1, 2, 2) },
      { source: "idle", verdict: verdict(0, 3, 0) },
      { source: "c", verdict: verdict(-2, 1, 1) },
    ];

    const summary = summarizeControllerPopulation(results, 3);

    expect(summary.activeCount).toBe(3);
    expect(summary.supportedCount).toBe(2);
    expect(summary.supportedFraction).toBe(0.5);
    expect(summary.positiveEpisodeFraction).toBe(0.75);
    expect(summary.medianControllerBalance).toBe(0.5);
    expect(summary.balanceSpread).toBe(6);
  });
});

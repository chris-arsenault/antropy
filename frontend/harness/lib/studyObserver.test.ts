import { describe, expect, it } from "vitest";
import { createWorld, stepWorld } from "../../src/sim/world";
import { DEFAULT_CONFIG } from "../../src/sim/config";
import { attachObserver, type FlowChannel } from "../../src/sim/observation";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { budgetStats, percent } from "../../src/sim/budgetStats";

describe("physical observation contract", () => {
  it("leaves complete state unchanged and reconciles resolver flows", () => {
    const config = { ...DEFAULT_CONFIG, founders: 4 };
    const observed = createWorld(101, config),
      plain = createWorld(101, config);
    const sums = new Map<FlowChannel, number>();
    const detach = attachObserver(observed, {
      flow: (f) => sums.set(f.channel, (sums.get(f.channel) ?? 0) + f.amount),
      life: () => {},
    });
    for (let i = 0; i < 100; i++) {
      stepWorld(observed);
      stepWorld(plain);
    }
    detach();
    expect(checkpointToJson(observed)).toBe(checkpointToJson(plain));
    const l = observed.ledger;
    const expected: Partial<Record<FlowChannel, number>> = {
      food_a: l.absorbedA,
      food_b: l.absorbedB,
      toxin: l.toxinEmitted,
      matrix: l.matrixEmitted,
      motors: l.motors,
      synthesis: l.secretion,
      maintenance: l.metabolism,
      learning: l.learning,
      repair: l.repair,
      construction: l.construction,
      catabolic_loss: l.catabolismLoss,
      constructed: l.constructedMaterial,
      catabolized: l.metabolicWaste - (sums.get("repair_material") ?? 0),
      damage: l.damageReceived,
      repaired: l.repaired,
      division: l.division,
    };
    for (const [channel, value] of Object.entries(expected))
      expect(sums.get(channel as FlowChannel) ?? 0, channel).toBeCloseTo(value, 9);
    const b = budgetStats(l);
    expect(b.repairEnergyPercent).toBe(percent(l.repair, b.dissipated));
    expect(percent(3, 4800)).toBe(0.0625);
    expect(percent(0, 0)).toBeNull();
  });
});

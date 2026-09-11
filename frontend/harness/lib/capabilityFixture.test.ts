import { expect, it } from "vitest";
import { capabilityScreens } from "./capabilityCases";
import { capabilityScenario } from "./capabilityFixture";
import { heldMaterial, heldEnergy, balance } from "../../src/sim/accounting";
import { controller } from "../../src/sim/controller";
import { diagnosticChanges } from "../../src/sim/controller/diagnostics";
import { INPUTS } from "../../src/sim/interface";
import { HIDDEN } from "../../src/sim/controller/rnn";

it("funds mature stocks without a genotype-dependent initial material or energy grant", () => {
  for (const test of capabilityScreens().filter((c) => c.mature)) {
    const a = capabilityScenario(test).create(701, false),
      b = capabilityScenario(test).create(701, true);
    expect(heldMaterial(a)).toBeCloseTo(heldMaterial(b), 10);
    expect(heldEnergy(a) + a.ledger.construction).toBeCloseTo(
      heldEnergy(b) + b.ledger.construction,
      10
    );
    expect(balance(a)).toBeCloseTo(0, 10);
    const packets = a.cells.map((c) =>
      Object.values(c.body).reduce((sum, v) => sum + v, c.reserve)
    );
    expect(Math.max(...packets) - Math.min(...packets)).toBeLessThan(1e-12);
  }
});

it("recurrent ablation preserves feed-forward weights and the input genome", () => {
  const base = controller.seed(),
    copy = base.weights.slice();
  const changed = diagnosticChanges(base, { recurrence: "zero" });
  const start = INPUTS * HIDDEN,
    end = start + HIDDEN * HIDDEN;
  expect(base.weights).toEqual(copy);
  expect(changed.weights.slice(0, start)).toEqual(copy.slice(0, start));
  expect(changed.weights.slice(start, end).every((w) => w === 0)).toBe(true);
  expect(changed.weights.slice(end)).toEqual(copy.slice(end));
});

// @vitest-environment node
import { beforeAll, expect, it } from "vitest";
import { type Engine } from "../../src/engine/client";
import { type CellState, type Summary } from "../../src/engine/types";
import { loadEngine } from "../numerical/engine";
import { capabilityScreens } from "./capabilityCases";
import { capabilityScenario } from "./capabilityFixture";
import { behaviorChange } from "./engineFixtures";
import { chemicalContext } from "./chemicalGenotypes";
let engine: Engine;
beforeAll(async () => {
  engine = await loadEngine();
});
it("funds mature targets without genotype-dependent grants", () => {
  for (const test of capabilityScreens(engine).filter((c) => c.mature)) {
    const a = capabilityScenario(test).create(engine, 701, false),
      b = capabilityScenario(test).create(engine, 701, true);
    try {
      const x = a.command<Summary>("summary"),
        y = b.command<Summary>("summary");
      expect(x.heldMaterial).toBeCloseTo(y.heldMaterial, 10);
      expect(x.heldEnergy + x.ledger.flows.construction).toBeCloseTo(
        y.heldEnergy + y.ledger.flows.construction,
        10
      );
      expect(x.energyResidual).toBeCloseTo(0, 9);
      const frame = a.command<{ cells: { cell: CellState }[] }>("assayFrame");
      const packets = frame.cells.map(({ cell }) =>
        cell.body.reduce((sum, v) => sum + v, cell.inventory.material)
      );
      expect(Math.max(...packets) - Math.min(...packets)).toBeLessThan(1e-12);
      if (test.key.startsWith("motor-"))
        expect(frame.cells[1].cell.body[1] / frame.cells[0].cell.body[1]).toBeCloseTo(4, 10);
    } finally {
      a.dispose();
      b.dispose();
    }
  }
});
it("recurrent ablation preserves feed-forward weights and its source genome", () => {
  const base = chemicalContext(engine).genotype,
    copy = structuredClone(base);
  const changed = behaviorChange(engine, base, { recurrence: "zero" });
  const before = base.chromosomes[0].behavior.weights,
    after = changed.chromosomes[0].behavior.weights;
  expect(base).toEqual(copy);
  expect(after.slice(0, 56 * 24)).toEqual(before.slice(0, 56 * 24));
  expect(after.slice(56 * 24, 56 * 24 + 24 * 24).every((w) => w === 0)).toBe(true);
  expect(after.slice(56 * 24 + 24 * 24)).toEqual(before.slice(56 * 24 + 24 * 24));
});

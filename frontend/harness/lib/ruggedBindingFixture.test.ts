// @vitest-environment node
import { beforeAll, expect, it } from "vitest";
import { type Engine } from "../../src/engine/client";
import { type CellState, type Genotype, type Summary } from "../../src/engine/types";
import { loadEngine } from "../numerical/engine";
import { bindingGenotype, bindingScenario } from "./ruggedBindingFixture";

let engine: Engine;
beforeAll(async () => {
  engine = await loadEngine();
});
it("changes exactly the two declared loci and preserves transformation genes", () => {
  const world = engine.create(27, { preset: "diagnostic", founders: 1, sourceCount: 0 });
  try {
    const base = world.command<Genotype>("genotype", { id: 1 });
    const variants = [0, 1, 2, 3].map((i) => bindingGenotype(base, i));
    for (let i = 1; i < 4; i++) {
      const restored = structuredClone(variants[i]);
      const key = restored.chromosomes[0].chemistry.keys!.transporters[0];
      key.weights[0] = key.weights[4] = -1;
      expect(restored).toEqual(variants[0]);
    }
    expect(variants[1].chromosomes[0].chemistry.keys!.transporters[0].weights[0]).toBe(1);
    expect(variants[2].chromosomes[0].chemistry.keys!.transporters[0].weights[4]).toBe(1);
    expect(variants[3].chromosomes[0].chemistry.keys!.transporters[0].weights[0]).toBe(1);
    expect(variants[3].chromosomes[0].chemistry.keys!.transporters[0].weights[4]).toBe(1);
  } finally {
    world.dispose();
  }
});
it("matches all shared founder packets and swaps variants without changing positions", () => {
  const scenario = bindingScenario(3, false, null);
  const a = scenario.create(engine, 27, false),
    b = scenario.create(engine, 27, true);
  try {
    const ac = a.command<{ cells: { cell: CellState }[] }>("assayFrame").cells.map((c) => c.cell);
    const bc = b.command<{ cells: { cell: CellState }[] }>("assayFrame").cells.map((c) => c.cell);
    expect(ac).toHaveLength(8);
    expect(new Set(ac.map((c) => c.genome)).size).toBe(4);
    for (let i = 0; i < 8; i++) {
      expect(ac[i].inventory).toEqual(ac[0].inventory);
      expect(ac[i].boundMaterial).toEqual(ac[0].boundMaterial);
      expect([ac[i].x, ac[i].y, ac[i].heading, ac[i].energy]).toEqual([
        bc[i].x,
        bc[i].y,
        bc[i].heading,
        bc[i].energy,
      ]);
      expect(ac[i].genome).not.toBe(bc[i].genome);
    }
    for (const world of [a, b]) {
      const s = world.command<Summary>("summary");
      expect(s.tick).toBe(0);
      expect(Math.abs(s.materialResidual)).toBeLessThan(1e-8);
      expect(Math.abs(s.energyResidual)).toBeLessThan(1e-8);
    }
  } finally {
    a.dispose();
    b.dispose();
  }
});

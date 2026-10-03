// @vitest-environment node
import { beforeAll, expect, it } from "vitest";
import { type Engine } from "../../src/engine/client";
import { type CellState, type Genotype } from "../../src/engine/types";
import { loadEngine } from "../numerical/engine";
import {
  consequenceGenotype,
  consequenceScenario,
  consequenceGenomes,
} from "./chemicalConsequenceFixture";

let engine: Engine;
beforeAll(async () => {
  engine = await loadEngine();
});
it("changes only the declared enzyme or membrane scalar, with identical transformations and capacities", () => {
  const world = engine.create(27, { preset: "diagnostic", founders: 1, sourceCount: 0 });
  try {
    const base = world.command<Genotype>("genotype", { id: 1 });
    const genotypes = [0, 1, 2, 3].map((v) => consequenceGenotype(base, v));
    for (let v = 0; v < 4; v++) {
      const g = structuredClone(genotypes[v]);
      const keys = g.chromosomes[0].chemistry.keys!;
      expect(keys.enzymes[0].weights[4]).toBe(v & 1 ? 1 : -1);
      expect(keys.membrane.weights[4]).toBe(v & 2 ? 1 : -1);
      keys.enzymes[0].weights[4] = keys.membrane.weights[4] = -1;
      expect(g).toEqual(genotypes[0]);
    }
  } finally {
    world.dispose();
  }
});
it("matches shared packets and positions before stepping, with zero initial free fuel", () => {
  const scenario = consequenceScenario(
    { variant: 3, lambda: 6, supplied: true, enzymeActive: true },
    true
  );
  const a = scenario.create(engine, 27, false),
    b = scenario.create(engine, 27, true);
  try {
    const ac = a.command<{ cells: { cell: CellState }[] }>("assayFrame").cells.map((c) => c.cell);
    const bc = b.command<{ cells: { cell: CellState }[] }>("assayFrame").cells.map((c) => c.cell);
    expect(
      consequenceGenomes(a)
        .map((g) => g.variant)
        .sort()
    ).toEqual([0, 1, 2, 3]);
    for (let i = 0; i < 4; i++) {
      expect(ac[i].inventory.material).toBe(0);
      expect(ac[i].boundMaterial).toEqual(ac[0].boundMaterial);
      expect(ac[i].body).toEqual(ac[0].body);
      expect([ac[i].x, ac[i].y, ac[i].energy, ac[i].heading]).toEqual([
        bc[i].x,
        bc[i].y,
        bc[i].energy,
        bc[i].heading,
      ]);
      expect(ac[i].genome).not.toBe(bc[i].genome);
    }
    expect(a.command<{ tick: number }>("summary").tick).toBe(0);
    expect(a.command("environment")).toEqual(b.command("environment"));
  } finally {
    a.dispose();
    b.dispose();
  }
});

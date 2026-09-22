// @vitest-environment node
import { it, expect } from "vitest";
import { loadEngine } from "./numerical/engine";
import { chemicalContext } from "./lib/chemicalGenotypes";
import { type CellState, type Genotype, type Definition } from "../src/engine/types";
import { sampleCohort, cohortWorld, cohortCounts } from "./epochCohort";

it("samples individuals reproducibly without changing source physics or filtering genotypes", async () => {
  const engine = await loadEngine(),
    w = engine.create(1, { width: 24, height: 24, founders: 4, sourceCount: 0 });
  try {
    const before = w.snapshot(),
      a = sampleCohort(w, 2, 200);
    expect(a).toEqual(sampleCohort(w, 2, 200));
    expect(new Set(a.map((s) => s.cell)).size).toBe(4);
    expect(w.snapshot()).toEqual(before);
  } finally {
    w.dispose();
  }
});
it("swaps inherited cohorts on common funded bodies and keeps descendant assignments", async () => {
  const engine = await loadEngine(),
    context = chemicalContext(engine, { width: 24, height: 24, sourceCount: 0 });
  const a = context.genotype,
    b = structuredClone(a);
  b.chromosomes[0].physical[0] = Math.fround(0.1);
  const first = cohortWorld(engine, [a, a], [b, b], context.config, 1, 0.2, false),
    second = cohortWorld(engine, [a, a], [b, b], context.config, 1, 0.2, true);
  try {
    const cells = (w: typeof first.world) =>
      w.command<{ cells: { cell: CellState }[] }>("assayFrame").cells.map(({ cell: c }) => ({
        id: c.id,
        x: c.x,
        y: c.y,
        body: c.body,
        brain: c.brain,
        inventory: c.inventory,
        energy: c.energy,
      }));
    expect(cells(first.world)).toEqual(cells(second.world));
    const assigned = (w: typeof first.world) =>
      w.command<{ cells: CellState[] }>("frame").cells[0].genome;
    expect(
      first.world.command<Genotype>("genotype", { id: assigned(first.world) }).chromosomes
    ).toEqual(a.chromosomes);
    expect(
      second.world.command<Genotype>("genotype", { id: assigned(second.world) }).chromosomes
    ).toEqual(b.chromosomes);
    expect(cohortCounts(first.world, first.postIds)).toEqual({ pre: 2, post: 2, postShare: 50 });
    first.world.step(10);
    expect(first.world.command<Definition>("definition").config).toMatchObject({
      learningRetention: 0,
    });
  } finally {
    first.world.dispose();
    second.world.dispose();
  }
});

import { it, expect } from "vitest";
import { createWorld, stepWorld } from "../src/sim/world";
import { DEFAULT_CONFIG } from "../src/sim/config";
import { seedGenotype } from "../src/sim/genetics/genotype";
import { checkpointToJson } from "../src/persist/checkpoint";
import { sampleCohort, cohortWorld, cohortCounts } from "./epochCohort";

it("samples individuals reproducibly without altering the source or filtering genotypes", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 4 });
  const before = checkpointToJson(w),
    a = sampleCohort(w, 2, 200);
  expect(a).toEqual(sampleCohort(w, 2, 200));
  expect(new Set(a.map((s) => s.cell)).size).toBe(4);
  expect(checkpointToJson(w)).toBe(before);
});
it("swaps inherited cohorts without changing funded bodies, private state or random streams", () => {
  const a = seedGenotype(DEFAULT_CONFIG),
    b = seedGenotype(DEFAULT_CONFIG);
  b.chromosomes[0].physical[0] = 0.1;
  const first = cohortWorld([a, a], [b, b], DEFAULT_CONFIG, 1, 0.2, false);
  const second = cohortWorld([a, a], [b, b], DEFAULT_CONFIG, 1, 0.2, true);
  expect(first.world.cells).toEqual(second.world.cells);
  expect(first.world.rng).toEqual(second.world.rng);
  expect(first.world.genomes.get(1)!.genome).toBe(a);
  expect(second.world.genomes.get(1)!.genome).toBe(b);
  expect(cohortCounts(first.world, first.postIds)).toEqual({ pre: 2, post: 2, postShare: 50 });
  for (let tick = 0; tick < 10; tick++) stepWorld(first.world);
  expect(first.world.genomes.size).toBe(4);
  expect(first.world.config.learningRetention).toBe(0);
});

import { expect, it } from "vitest";
import { createWorld } from "./world";
import { DEFAULT_CONFIG } from "./config";
import { seedGenotype } from "./genetics/genotype";
import { distinctSequences } from "./genetics/identity";
import { inheritedStats } from "./inheritedStats";
import { scaleBody } from "./body";

it("deduplicates copied sequences and unlabelled diploid homologs, but keeps genuine changes", () => {
  const a = seedGenotype(DEFAULT_CONFIG),
    b = seedGenotype(DEFAULT_CONFIG);
  const changed = seedGenotype(DEFAULT_CONFIG);
  changed.chromosomes[0].physical[0] = 0.1;
  expect(distinctSequences([a, b, changed])).toBe(2);
  const diploid = { chromosomes: [a.chromosomes[0], changed.chromosomes[0]] };
  expect(distinctSequences([diploid, { chromosomes: [...diploid.chromosomes].reverse() }, a])).toBe(
    2
  );
});
it("separates grown bodies from inherited targets and compares descendants to their own founder", () => {
  const world = createWorld(1, { ...DEFAULT_CONFIG, founders: 2 });
  const before = inheritedStats(world);
  world.cells[0].body = scaleBody(world.cells[0].body, 1.7);
  expect(inheritedStats(world).traits).toEqual(before.traits);
  const genome = seedGenotype(world.config);
  genome.chromosomes[0].physical[0] = Math.log(1.2);
  world.genomes.set(2, { id: 2, parent: 1, born: 0, genome, learned: 0 });
  Object.assign(world.cells[1], { genome: 2, lineage: 1, parent: 1 });
  const stats = inheritedStats(world);
  expect(stats.traits[0].relative!.mean).toBeCloseTo(1.1, 6);
  expect(stats.uniqueSequences).toBe(2);
  expect(stats.largestShare).toBe(1);
  expect(stats.controllerDistance!.max).toBe(0);
});

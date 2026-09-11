import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { type World } from "../sim/types";
import { controller } from "../sim/controller";
import { createRandomState } from "../sim/random";
import { seedGenotype } from "../sim/genetics/genotype";
import { checkpointToJson, restoreWorld } from "../persist/checkpoint";
import {
  branch,
  familyCounts,
  relatedness,
  continuesThroughChildren,
  familyOrigin,
} from "./ancestry";
import { geneticDistance } from "./geneticDistance";
import { traitSnapshot, effortSnapshot } from "./traits";
import { COLOR_MODES, populationColors } from "../ui/populationColors";

// An explicit genealogy fixture, independent of ecological birth timing.
function record(world: World, id: number, parent: number) {
  const ancestor = world.ancestry.get(parent)!;
  world.ancestry.set(id, { ...ancestor, id, parent, born: id });
  return {
    ...world.cells[0],
    id,
    parent,
    lineage: ancestor.lineage,
    generation: branch(world, parent).generation + 1,
  };
}
function genealogy() {
  const world = createWorld(5, { ...DEFAULT_CONFIG, founders: 2 });
  for (let id = 3; id <= 10; id++) record(world, id, id === 3 ? 1 : id - 1);
  const sibling = record(world, 11, 9),
    cousin = record(world, 12, 8);
  world.cells = [record(world, 13, 10), sibling, cousin];
  return world;
}
it("uses stable recent branches, including branching without genetic changes", () => {
  const world = genealogy();
  expect(branch(world, 5)).toEqual({ generation: 3, family: 1 });
  expect(branch(world, 6)).toEqual({ generation: 4, family: 6 });
  expect(branch(world, 13)).toEqual({ generation: 9, family: 10 });
  expect(familyCounts(world)).toEqual([
    [6, 1],
    [10, 1],
    [11, 1],
  ]);
  expect(familyOrigin(world, 10).parent).toBe(6);
  expect(continuesThroughChildren(world, 1)).toBe(true);
  expect(continuesThroughChildren(world, 2)).toBe(false);
  const copy = { ...world, ancestry: new Map(world.ancestry) };
  expect(familyCounts(copy)).toEqual(familyCounts(world));
  expect(world.cells.every((c) => c.genome === world.cells[0].genome)).toBe(true);
});
it("measures parent links through the nearest common ancestor", () => {
  const world = genealogy();
  expect(relatedness(world, 13, 13)).toEqual({ ancestor: 13, links: 0 });
  expect(relatedness(world, 13, 10)).toEqual({ ancestor: 10, links: 1 });
  expect(relatedness(world, 10, 11)).toEqual({ ancestor: 9, links: 2 });
  expect(relatedness(world, 13, 12)).toEqual({ ancestor: 8, links: 4 });
  expect(relatedness(world, 12, 13)).toEqual(relatedness(world, 13, 12));
  expect(relatedness(world, 13, 2)).toBeNull();
  expect(relatedness(world, 13, 100)).toBeNull();
});
it("keeps physical distance independent of controller distance", () => {
  const a = seedGenotype(DEFAULT_CONFIG),
    physical = seedGenotype(DEFAULT_CONFIG);
  physical.chromosomes[0].physical[1] = 0.2;
  expect(geneticDistance(a, physical).physical).toBeCloseTo(0.2 / Math.sqrt(8));
  expect(geneticDistance(a, physical).controller).toBe(0);
  const behavioral = {
    chromosomes: [
      {
        ...a.chromosomes[0],
        behavior: controller.mutate(
          a.chromosomes[0].behavior,
          createRandomState(3),
          1,
          0.01,
          "uniform"
        ),
      },
    ],
  };
  expect(geneticDistance(a, behavioral).physical).toBe(0);
  expect(geneticDistance(a, behavioral).controller).toBeGreaterThan(0);
});
it("reports inherited targets regardless of current growth and samples every organism", () => {
  const world = createWorld(4, { ...DEFAULT_CONFIG, founders: 2 });
  const before = traitSnapshot(world);
  world.cells[0].body.motor *= 2;
  world.cells[0].body.core *= 3;
  expect(traitSnapshot(world)).toEqual(before);
  for (const trait of before) expect(trait.bins.reduce((a, b) => a + b, 0)).toBe(2);
  world.cells[0].action.swim = 0;
  world.cells[1].action.swim = 1;
  world.cells[0].action.turn = -1;
  expect(effortSnapshot(world)[0].bins).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
  expect(effortSnapshot(world)[1].bins[9]).toBe(1);
  world.cells = [];
  expect(traitSnapshot(world).every((t) => t.stats === null && t.bins.every((n) => n === 0))).toBe(
    true
  );
});
it("observation and color modes preserve saves and deterministic continuation", () => {
  const world = createWorld(4, { ...DEFAULT_CONFIG, founders: 2 });
  const saved = checkpointToJson(world),
    copy = restoreWorld(saved);
  for (const mode of Object.keys(COLOR_MODES) as (keyof typeof COLOR_MODES)[])
    world.cells.forEach(populationColors(world, mode, 1));
  traitSnapshot(world);
  effortSnapshot(world);
  relatedness(world, 1, 2);
  expect(familyCounts(copy)).toEqual(familyCounts(world));
  expect(checkpointToJson(world)).toBe(saved);
  for (let tick = 0; tick < 10; tick++) {
    stepWorld(world);
    stepWorld(copy);
  }
  expect(checkpointToJson(world)).toBe(checkpointToJson(copy));
});

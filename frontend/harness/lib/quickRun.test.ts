import { describe, expect, it } from "vitest";
import { foodAccess } from "./foodAccess";
import { QuickObserver } from "./quickObserver";
import { validateQuickOptions } from "./quickRun";
import { checkpointToJson } from "../../src/persist/checkpoint";
import { balance, materialBalance, total } from "../../src/sim/accounting";
import { stepWorld } from "../../src/sim/world";
import { flow, life } from "../../src/sim/observation";

describe("short mechanism fixtures", () => {
  it("swaps only genotype assignment and ancestry, with equal funded food and bodies", () => {
    const scenario = foodAccess("brief"),
      a = scenario.create(701, false),
      b = scenario.create(701, true);
    expect(total(a.nutrient)).toBeCloseTo(96, 10);
    expect(total(foodAccess("persistent").create(701, false).nutrient)).toBeCloseTo(96, 10);
    expect(a.cells.filter((c) => c.genome === 1)).toHaveLength(8);
    for (const c of b.cells) {
      c.genome = 3 - c.genome;
      b.ancestry.get(c.id)!.genome = c.genome;
    }
    expect(checkpointToJson(a)).toBe(checkpointToJson(b));
    expect(balance(a)).toBeCloseTo(0, 10);
    expect(materialBalance(a)).toBeCloseTo(0, 10);
  });
  it("observation leaves inference, physics and accounting unchanged", () => {
    const scenario = foodAccess("brief"),
      a = scenario.create(701, false),
      b = scenario.create(701, false);
    const observer = new QuickObserver(a, scenario);
    observer.frame();
    for (let i = 0; i < 20; i++) {
      observer.beforeStep();
      stepWorld(a);
      stepWorld(b);
      observer.afterStep();
      observer.frame();
    }
    observer.close();
    expect(checkpointToJson(a)).toBe(checkpointToJson(b));
    expect(balance(a)).toBeCloseTo(0, 9);
    expect(materialBalance(a)).toBeCloseTo(0, 9);
    expect(a.ledger.toxinEmitted + a.ledger.matrixEmitted + a.ledger.emitted).toBe(0);
  });
  it("refuses an unbounded or long experiment", () => {
    const options = { seed: 1, swap: false, output: "unused", ticks: 3000, wallSeconds: 120 };
    expect(() => validateQuickOptions(options)).not.toThrow();
    for (const ticks of [0, -1, 3001, 1.5, NaN])
      expect(() => validateQuickOptions({ ...options, ticks })).toThrow();
    expect(() => validateQuickOptions({ ...options, wallSeconds: Infinity })).toThrow();
  });
  it("keeps descendant flows and births in the initial ancestry group after genome changes", () => {
    const scenario = foodAccess("brief"),
      world = scenario.create(701, false);
    const observer = new QuickObserver(world, scenario);
    const cell = world.cells[0],
      initialGenome = cell.genome;
    world.genomes.set(999, { ...world.genomes.get(initialGenome)!, id: 999 });
    cell.genome = 999;
    flow(world, cell, "food_a", 2);
    life(world, cell, "birth");
    observer.beforeStep();
    const result = observer.result().find((g) => g.genome === initialGenome)!;
    expect(result.flows.food_a).toBe(2);
    expect(result.birthsPerInitialCell).toBe(1 / result.initialCells);
    expect(result.living).toBe(result.initialCells);
    expect(observer.frame().cells[0].group).toBe(initialGenome);
    observer.close();
  });
});

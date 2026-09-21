// @vitest-environment node
import { beforeAll, expect, it } from "vitest";
import { type Engine } from "../../src/engine/client";
import { type CellState, type Summary } from "../../src/engine/types";
import { loadEngine } from "../numerical/engine";
import { foodAccess } from "./foodAccess";
import { QuickObserver } from "./quickObserver";
import { validateQuickOptions } from "./quickRun";
import { expectPhysicalState } from "./physicalAssertions";
let engine: Engine;
beforeAll(async () => {
  engine = await loadEngine();
});

it("swaps assignments with equal positions, funded packets and finite food", () => {
  const scenario = foodAccess("brief"),
    a = scenario.create(engine, 701, false),
    b = scenario.create(engine, 701, true);
  try {
    const environment = a.command<{ extracellular: { amount: number } }>("environment");
    expect(environment.extracellular.amount).toBeCloseTo(96, 5);
    expect(a.command("environment")).toEqual(b.command("environment"));
    const ac = a.command<{ cells: CellState[] }>("frame").cells,
      bc = b.command<{ cells: CellState[] }>("frame").cells;
    const genomes = [...new Set(ac.map((c) => c.genome))].sort((x, y) => x - y);
    expect(genomes).toHaveLength(2);
    expect(ac.filter((c) => c.genome === genomes[0])).toHaveLength(8);
    ac.forEach((c, i) => {
      expect(c.genome + bc[i].genome).toBe(genomes[0] + genomes[1]);
      expect([c.x, c.y, c.heading, c.energy]).toEqual([
        bc[i].x,
        bc[i].y,
        bc[i].heading,
        bc[i].energy,
      ]);
    });
    expect(a.command<Summary>("summary").materialResidual).toBeCloseTo(0, 9);
    expect(a.command<Summary>("summary").energyResidual).toBeCloseTo(0, 9);
  } finally {
    a.dispose();
    b.dispose();
  }
});
it("records the causal trace without changing physics or neural memory", () => {
  const scenario = foodAccess("brief"),
    a = scenario.create(engine, 701, false),
    b = engine.restore(a.snapshot());
  const observer = new QuickObserver(a, scenario);
  try {
    observer.frame();
    for (let i = 0; i < 16; i++) {
      a.step();
      b.step();
      observer.frame();
    }
    expectPhysicalState(a, b);
    const groups = observer.result(),
      total = a.command<Summary>("summary").ledger.flows;
    expect(groups.reduce((n, g) => n + g.flows.imported, 0)).toBeCloseTo(total.imported, 10);
    expect(groups.reduce((n, g) => n + g.flows.motors, 0)).toBeCloseTo(total.motors, 10);
  } finally {
    observer.close();
    a.dispose();
    b.dispose();
  }
});
it("rejects unbounded or unregistered long experiments", () => {
  const options = { seed: 1, swap: false, output: "unused", ticks: 3000, wallSeconds: 120 };
  expect(() => validateQuickOptions(options)).not.toThrow();
  for (const ticks of [0, -1, 3001, 1.5, NaN])
    expect(() => validateQuickOptions({ ...options, ticks })).toThrow();
  expect(() => validateQuickOptions({ ...options, wallSeconds: Infinity })).toThrow();
  expect(() => validateQuickOptions({ ...options, seed: -1 })).toThrow();
});

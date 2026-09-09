import { expect, it } from "vitest";
import { createWorld, stepWorld } from "./world";
import { DEFAULT_CONFIG } from "./config";
import { moveBodies, resolveContacts } from "./movement";
import { distance } from "./geometry";
import { observe } from "./sensors";
import { reproduce } from "./reproduction";
import { radius } from "./geometry";
import { fundDivision } from "./testSupport";

it("resolves body contact across the periodic seam", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 2 });
  Object.assign(w.cells[0], { x: 0.1, y: 20 });
  Object.assign(w.cells[1], { x: 79.9, y: 20 });
  resolveContacts(w);
  expect(distance(w.cells[0], w.cells[1], w.config)).toBeCloseTo(
    radius(w.cells[0], w.config) + radius(w.cells[1], w.config),
    10
  );
  expect(w.cells.every((c) => c.contacts.some((v) => v === 1))).toBe(true);
});
it("bounded locomotion cannot tunnel through a stationary cell", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 2, thermalEnergy: 0 });
  Object.assign(w.cells[0], { x: 10, y: 20, heading: 0, action: { swim: 1, turn: 0, secrete: 0 } });
  Object.assign(w.cells[1], { x: 11, y: 20, heading: 0 });
  moveBodies(w);
  expect(w.cells[0].x).toBeLessThan(w.cells[1].x);
  expect(distance(w.cells[0], w.cells[1], w.config)).toBeGreaterThanOrEqual(
    radius(w.cells[0], w.config) + radius(w.cells[1], w.config) - 1e-10
  );
});
it("remote chemical and source metadata cannot change current local inputs", () => {
  const a = createWorld(7, { ...DEFAULT_CONFIG, founders: 1 }),
    b = createWorld(7, { ...DEFAULT_CONFIG, founders: 1 });
  Object.assign(a.cells[0], { x: 5, y: 5 });
  Object.assign(b.cells[0], { x: 5, y: 5 });
  b.chemical[40 * b.config.width + 40] = 1000;
  b.sources[0].x = 40;
  expect(observe(a, a.cells[0])).toEqual(observe(b, b.cells[0]));
});
it("a population safety limit pauses without deleting cells or manufacturing offspring", () => {
  const w = createWorld(5, { ...DEFAULT_CONFIG, founders: 1, maxPopulation: 1 });
  fundDivision(w);
  reproduce(w);
  expect(w.cells).toHaveLength(1);
  expect(w.ledger.births).toBe(0);
  expect(w.stopReason).toContain("safety limit");
});
it("secretion becomes visible to all receptors only on the following step", () => {
  const w = createWorld(12, { ...DEFAULT_CONFIG, founders: 2 });
  stepWorld(w);
  expect(w.ledger.emitted).toBeGreaterThan(0);
  expect(w.cells.every((c) => c.inputs[4] === 0)).toBe(true);
  stepWorld(w);
  expect(w.cells.some((c) => c.inputs[4] > 0)).toBe(true);
});

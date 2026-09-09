import { expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { createWorld, stepWorld } from "./world";
import { balance, total, absorb } from "./resources";
import { diffuse, sample } from "./fields";
import { initializeReceptors, observe } from "./sensors";
import { moveBodies } from "./movement";
import { reproduce } from "./reproduction";
import { distance } from "./geometry";
import { act, createState, seed } from "./controller/rnn";

it("conserves diffusing nutrient across a periodic seam and accounts for decay", () => {
  const c = { ...DEFAULT_CONFIG, width: 8, height: 8, dt: 3 };
  const field = new Float64Array(64);
  field[0] = 10;
  const loss = diffuse(field, c, 2, 0.1);
  expect(total(field) + loss).toBeCloseTo(10, 10);
  expect(field.every((v) => v >= 0)).toBe(true);
  expect(field[1]).toBeCloseTo(field[7], 12);
  expect(sample(field, { x: 8, y: 0 }, c)).toBe(sample(field, { x: 0, y: 0 }, c));
});
it("provides an adapting phasic response without a newborn spike", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 1 });
  const cell = w.cells[0];
  expect(observe(w, cell)[1]).toBe(0);
  w.nutrient.fill(2);
  const initial = observe(w, cell)[1];
  for (let i = 0; i < 100; i++) observe(w, cell);
  expect(initial).toBeGreaterThan(0.5);
  expect(Math.abs(observe(w, cell)[1])).toBeLessThan(0.001);
  expect(observe(w, cell)[2]).toBe(0);
  initializeReceptors(w, cell);
  expect(observe(w, cell)[1]).toBe(0);
});
it("seeded RNN turns toward higher local nutrient with mirrored responses", () => {
  const left = new Float32Array(15),
    right = left.slice();
  left[3] = 0.1;
  right[3] = -0.1;
  const a = act(seed(), left, createState()),
    b = act(seed(), right, createState());
  expect(a.turn).toBeLessThan(0);
  expect(b.turn).toBeGreaterThan(0);
  expect(a.turn).toBeCloseTo(-b.turn, 10);
});
it("shares scarce local uptake without iteration priority", () => {
  const w = createWorld(2, { ...DEFAULT_CONFIG, founders: 2, initialNutrient: 0 });
  Object.assign(w.cells[0], { x: 5, y: 5, energy: 0 });
  Object.assign(w.cells[1], { x: 5, y: 5, energy: 0 });
  w.nutrient[5 * w.config.width + 5] = 0.0001;
  absorb(w);
  expect(w.cells[0].energy).toBeCloseTo(w.cells[1].energy, 12);
  expect(w.cells[0].energy * 2 + total(w.nutrient)).toBeCloseTo(0.0001, 12);
});
it("limits secretion and motion together to the available energy", () => {
  const w = createWorld(3, { ...DEFAULT_CONFIG, founders: 1 });
  const cell = w.cells[0];
  cell.energy = 0.0015;
  cell.action = { swim: 1, turn: 1, secrete: 1 };
  const start = cell.energy;
  moveBodies(w);
  expect(cell.energy).toBeGreaterThanOrEqual(0);
  expect(start - cell.energy).toBeCloseTo(w.ledger.motors + w.ledger.secretion, 12);
  expect(total(w.chemical)).toBeCloseTo(w.ledger.emitted, 12);
  expect(w.ledger.secretion).toBeCloseTo(w.ledger.emitted * w.config.secretionCost, 12);
});
it("division conserves resources, records ancestry and resets private state", () => {
  const w = createWorld(4, { ...DEFAULT_CONFIG, founders: 1, mutationRate: 0 });
  const parent = w.cells[0];
  parent.mass = 2;
  parent.energy = 3;
  parent.brain.hidden.fill(0.5);
  parent.brain.task = 123;
  reproduce(w);
  expect(w.cells).toHaveLength(2);
  expect(w.cells.reduce((s, c) => s + c.energy + c.mass, 0) + w.ledger.division).toBeCloseTo(5, 12);
  expect(w.cells.every((c) => c.parent === parent.id && c.genome === 1 && c.brain.task === 0)).toBe(
    true
  );
  expect(w.cells[0].brain.hidden.every((v) => v === 0)).toBe(true);
  expect(distance(w.cells[0], w.cells[1], w.config)).toBeGreaterThan(0.9);
  expect(w.ancestry.get(parent.id)?.cause).toBe("division");
});
it("physically born mutants inherit a genome without selecting on score", () => {
  const w = createWorld(5, { ...DEFAULT_CONFIG, founders: 1, mutationRate: 1 });
  w.cells[0].mass = 2;
  w.cells[0].energy = 3;
  reproduce(w);
  expect(w.ledger.mutations).toBe(2);
  expect(w.genomes.size).toBe(3);
  for (const cell of w.cells) expect(w.genomes.get(cell.genome)?.parent).toBe(1);
});
it("bounds resource residual through integrated movement and development", () => {
  const w = createWorld(6, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 8,
    sourceCount: 2,
  });
  for (let tick = 0; tick < 160; tick++) stepWorld(w);
  expect(Math.abs(balance(w))).toBeLessThan(1e-8);
  expect(Math.abs(w.ledger.emitted - w.ledger.chemicalLoss - total(w.chemical))).toBeLessThan(1e-9);
  expect(w.cells.every((c) => c.energy >= 0)).toBe(true);
});

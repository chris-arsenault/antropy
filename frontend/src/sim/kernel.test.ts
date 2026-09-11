import { expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { createWorld, stepWorld } from "./world";
import { absorb } from "./resources";
import { balance, materialBalance, total } from "./accounting";
import { fundDivision } from "./testSupport";
import { diffuse, sample } from "./fields";
import { initializeReceptors, observe } from "./sensors";
import { moveBodies } from "./movement";
import { reproduce } from "./reproduction";
import { distance } from "./geometry";
import { act, createState, seed } from "./controller/rnn";
import { INPUTS } from "./interface";

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
  const left = new Float32Array(INPUTS),
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
  Object.assign(w.cells[0], { x: 5, y: 5, reserve: 0 });
  Object.assign(w.cells[1], { x: 5, y: 5, reserve: 0 });
  w.nutrient[5 * w.config.width + 5] = 0.0001;
  absorb(w);
  expect(w.cells[0].reserve).toBeCloseTo(w.cells[1].reserve, 12);
  expect(w.cells[0].reserve * 2 + total(w.nutrient)).toBeCloseTo(0.0001, 12);
});
it("limits secretion and motion together to the available energy", () => {
  const w = createWorld(3, { ...DEFAULT_CONFIG, founders: 1, secretionRate: 0.06 });
  const cell = w.cells[0];
  cell.energy = 0.0015;
  cell.action = { ...cell.action, swim: 1, turn: 1, secrete: 1 };
  const start = cell.energy;
  moveBodies(w);
  expect(cell.energy).toBeGreaterThanOrEqual(0);
  expect(start - cell.energy).toBeCloseTo(w.ledger.motors + w.ledger.secretion, 12);
  expect(total(w.chemical)).toBeCloseTo(w.ledger.emitted, 12);
  expect(w.ledger.secretion).toBeCloseTo(w.ledger.emitted * w.config.secretionCost, 12);
});
it("division conserves resources, records ancestry and resets private state", () => {
  const w = createWorld(4, {
    ...DEFAULT_CONFIG,
    founders: 1,
    mutationRate: 0,
    physicalMutationRate: 0,
    learningRetention: 0,
  });
  const parent = fundDivision(w);
  parent.brain.hidden.fill(0.5);
  parent.brain.traces.fill(0.5);
  parent.brain.task = 123;
  reproduce(w);
  expect(w.cells).toHaveLength(2);
  expect(Math.abs(balance(w))).toBeLessThan(1e-9);
  expect(Math.abs(materialBalance(w))).toBeLessThan(1e-9);
  expect(w.cells.every((c) => c.parent === parent.id && c.genome === 1 && c.brain.task === 0)).toBe(
    true
  );
  expect(w.cells[0].brain.hidden.every((v) => v === 0)).toBe(true);
  expect(w.cells.every((c) => c.brain.traces.every((v) => v === 0))).toBe(true);
  expect(distance(w.cells[0], w.cells[1], w.config)).toBeGreaterThan(0.9);
  expect(w.ancestry.get(parent.id)?.cause).toBe("division");
});
it("physically born mutants inherit a genome without selecting on score", () => {
  const w = createWorld(5, { ...DEFAULT_CONFIG, founders: 1, mutationRate: 1 });
  fundDivision(w);
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
  expect(w.cells.every((c) => c.energy >= 0 && c.reserve >= 0)).toBe(true);
  expect(Math.abs(materialBalance(w))).toBeLessThan(1e-8);
});

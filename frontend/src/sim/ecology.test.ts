import { expect, it } from "vitest";
import { createWorld } from "./world";
import { DEFAULT_CONFIG } from "./config";
import { heldMaterial, heldEnergy, materialBalance, balance, total } from "./accounting";
import { advanceFields } from "./ecologyFields";
import { absorb } from "./resources";
import { materialCapacity } from "./body";
import { damageCells, repairCell } from "./interference";
import { moveBodies } from "./movement";
import { reproduce } from "./reproduction";
import { fundDivision } from "./testSupport";
import { type World } from "./types";
import { matrixAllows } from "./matrix";

const small = { ...DEFAULT_CONFIG, width: 16, height: 16, founders: 1, sourceCount: 0 };
function initial(world: World): void {
  world.ledger.initialMaterial = heldMaterial(world);
  world.ledger.initial = heldEnergy(world);
}
function conserved(world: World): void {
  expect(Math.abs(materialBalance(world))).toBeLessThan(1e-8);
  expect(Math.abs(balance(world))).toBeLessThan(1e-8);
}
it("finite heterogeneous deposits transfer inventory without counting leakage as new supply", () => {
  const w = createWorld(101, { ...small, founders: 0, sourceCount: 8, foodEpochs: undefined });
  expect(new Set(w.sources.map((s) => s.radius)).size).toBe(8);
  expect(w.sources.some((s) => s.foodA > s.foodB)).toBe(true);
  expect(w.sources.some((s) => s.foodB > s.foodA)).toBe(true);
  const before = w.sources.reduce((s, p) => s + p.foodA + p.foodB, 0);
  advanceFields(w);
  expect(w.sources.reduce((s, p) => s + p.foodA + p.foodB, 0)).toBeLessThan(before);
  expect(w.ledger.supplied).toBe(0);
  conserved(w);
});
it("both processing pathways share storage space and conserve scarce substrate", () => {
  const w = createWorld(2, { ...small, initialNutrient: 10 });
  const cell = w.cells[0],
    capacity = materialCapacity(cell.body, w.config);
  cell.reserve = capacity - 0.001;
  initial(w);
  absorb(w);
  expect(cell.reserve).toBeCloseTo(capacity, 12);
  expect(w.ledger.absorbedA).toBeGreaterThan(0);
  expect(w.ledger.absorbedB).toBeGreaterThan(0);
  conserved(w);
});
it("toxin harms its producer, built defense reduces damage, and repair has material and energy costs", () => {
  const a = createWorld(3, small),
    b = createWorld(3, small);
  a.toxin.fill(0.1);
  b.toxin.fill(0.1);
  b.cells[0].body.defense *= 4;
  damageCells(a);
  damageCells(b);
  expect(a.cells[0].damage).toBeGreaterThan(b.cells[0].damage);
  const cell = a.cells[0];
  cell.action.repair = 1;
  initial(a);
  const damage = cell.damage,
    reserve = cell.reserve,
    energy = cell.energy;
  repairCell(a, cell);
  expect(cell.damage).toBeGreaterThan(0);
  expect(cell.damage).toBeLessThan(damage);
  expect(cell.reserve).toBeLessThan(reserve);
  expect(cell.energy).toBeLessThan(energy);
  conserved(a);
});
it("damage survives division and lethal damage returns actual material as detritus", () => {
  const w = createWorld(4, small),
    parent = fundDivision(w);
  parent.damage = 0.4;
  reproduce(w);
  expect(w.cells).toHaveLength(2);
  expect(w.cells.every((c) => c.damage === 0.4)).toBe(true);
  const material = heldMaterial(w);
  w.cells[0].damage = 1;
  reproduce(w);
  expect(w.ledger.damageDeaths).toBe(1);
  expect(total(w.detritus)).toBeGreaterThan(0);
  expect(heldMaterial(w)).toBeCloseTo(material, 10);
  conserved(w);
});
it("matrix binds finite toxin, releases excess as it decays and conserves transport", () => {
  const w = createWorld(5, { ...small, founders: 0, matrixDecay: 0.5, toxinDecay: 0 });
  w.matrix[0] = 1;
  w.boundToxin[0] = w.config.matrixCapacity;
  w.toxin[0] = 1;
  initial(w);
  advanceFields(w);
  expect(w.boundToxin[0]).toBeLessThanOrEqual(w.matrix[0] * w.config.matrixCapacity + 1e-12);
  expect(total(w.detritus)).toBeGreaterThan(0);
  expect(w.toxin.every((v) => v >= 0)).toBe(true);
  conserved(w);
});
it("dense matrix blocks its own builders and local offspring placement", () => {
  const w = createWorld(6, { ...small, thermalEnergy: 0, matrixMode: "solid" });
  w.matrix.fill(10);
  initial(w);
  const cell = w.cells[0],
    x = cell.x,
    y = cell.y;
  cell.action.swim = 1;
  moveBodies(w);
  expect(cell.x).toBe(x);
  expect(cell.y).toBe(y);
  expect(w.ledger.matrixBlocked).toBeGreaterThan(0);
  fundDivision(w);
  reproduce(w);
  expect(w.cells).toHaveLength(1);
  expect(w.ledger.blockedDivisions).toBe(1);
  conserved(w);
});
it("all three secretions share affordable precursor and energy", () => {
  const w = createWorld(7, { ...small, secretionRate: 0.06 }),
    cell = w.cells[0];
  cell.reserve = 0.0001;
  cell.energy = 0.02;
  cell.action = { ...cell.action, swim: 1, secrete: 1, toxin: 1, matrix: 1 };
  initial(w);
  moveBodies(w);
  expect(cell.reserve).toBeGreaterThanOrEqual(0);
  expect(cell.energy).toBeGreaterThanOrEqual(0);
  expect(w.ledger.toxinEmitted).toBeGreaterThan(0);
  expect(w.ledger.emitted).toBeGreaterThan(0);
  expect(w.ledger.matrixEmitted).toBeGreaterThan(0);
  conserved(w);
});
it("contact displacement cannot jump a thin matrix barrier with a clear destination", () => {
  const w = createWorld(8, { ...small, matrixMode: "solid" });
  for (let y = 0; y < w.config.height; y++) w.matrix[y * w.config.width + 8] = 10;
  expect(matrixAllows(w, { x: 6, y: 8 }, { x: 10, y: 8 }, 0.4)).toBe(false);
  expect(matrixAllows(w, { x: 6, y: 8 }, { x: 6, y: 9 }, 0.4)).toBe(true);
  w.config.matrixMode = "porous";
  expect(matrixAllows(w, { x: 6, y: 8 }, { x: 10, y: 8 }, 0.4)).toBe(true);
});

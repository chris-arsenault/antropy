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
import { DEFAULT_CYCLE, footprint, oxygenBalance } from "./cycle";
import { metabolize } from "./development";
import { stepWorld } from "./world";

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
  const w = createWorld(101, {
    ...small,
    founders: 0,
    sourceCount: 8,
    foodEpochs: undefined,
    foodZones: undefined,
  });
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
it("the element cycle fixes carbon with light, respires with oxygen, and conserves material and energy", () => {
  const cycle = { ...DEFAULT_CYCLE, exchangeRate: 0 };
  const w = createWorld(8, { ...small, founders: 1, initialNutrient: 0, cycle });
  const cell = w.cells[0];
  cell.body.photo = 0.2 * cell.body.core;
  cell.reserve = 0;
  cell.energy = 0.1;
  initial(w);
  const carbonBefore = total(w.carbon),
    oxygenBefore = total(w.oxygen);
  for (let i = 0; i < 50; i++) stepWorld(w);
  expect(w.ledger.fixed).toBeGreaterThan(0);
  // Fixed carbon returns through respiration, so the pool cannot exceed its start without exchange.
  expect(total(w.carbon)).toBeLessThanOrEqual(carbonBefore + 1e-9);
  expect(w.ledger.lightEnergy).toBeCloseTo(w.ledger.fixed * w.config.nutrientEnergy, 10);
  expect(w.ledger.oxygenProduced).toBeGreaterThan(0);
  expect(Math.abs(oxygenBalance(w))).toBeLessThan(1e-8);
  expect(w.ledger.metabolicWaste).toBe(0);
  expect(w.ledger.exuded).toBeCloseTo(w.ledger.fixed * cycle.exudation, 10);
  expect(total(w.nutrient) + total(w.nutrientB)).toBeGreaterThan(0);
  conserved(w);
  expect(total(w.oxygen)).toBeGreaterThan(oxygenBefore - w.ledger.oxygenConsumed);
});
it("light supply per raster cell caps fixation and is shared by cells on the same ground", () => {
  const harvester = (lightSupply: number, founders: number) => {
    const w = createWorld(8, {
      ...small,
      founders,
      initialNutrient: 0,
      cycle: { ...DEFAULT_CYCLE, lightSupply },
    });
    // Every harvester stands on one raster cell's corner, so its carbon stencil is that cell
    // alone and its light footprint is the same thirteen cells.
    for (const cell of w.cells) {
      cell.body.photo = 0.5 * cell.body.core;
      cell.reserve = 0;
      cell.x = Math.floor(w.cells[0].x);
      cell.y = Math.floor(w.cells[0].y);
    }
    initial(w);
    metabolize(w);
    return w;
  };
  const unlimited = harvester(0, 1),
    capped = harvester(0.001, 1),
    crowded = harvester(0.001, 2);
  expect(capped.ledger.fixed).toBeGreaterThan(0);
  expect(capped.ledger.fixed).toBeLessThan(unlimited.ledger.fixed);
  const ground = footprint(DEFAULT_CYCLE.lightRadius).length;
  expect(ground).toBe(13);
  expect(capped.ledger.fixed).toBeCloseTo(ground * 0.001 * capped.config.dt, 12);
  // Two harvesters on the same ground share its supply: together they fix what one fixes alone.
  expect(crowded.ledger.fixed).toBeCloseTo(capped.ledger.fixed, 12);
  conserved(capped);
  conserved(crowded);
});
it("oxygen-poor water lowers catabolic yield and the atmosphere restores oxygen", () => {
  const cycle = { ...DEFAULT_CYCLE, exchangeRate: 0 };
  const rich = createWorld(9, { ...small, cycle }),
    poor = createWorld(9, { ...small, cycle });
  poor.oxygen.fill(0);
  for (const w of [rich, poor]) {
    w.cells[0].reserve = 0.5;
    w.cells[0].energy = 0;
    initial(w);
    stepWorld(w);
  }
  expect(poor.cells[0].energy).toBeLessThan(rich.cells[0].energy);
  expect(poor.cells[0].energy).toBeGreaterThan(0);
  const restoring = createWorld(9, {
    ...small,
    founders: 0,
    cycle: { ...DEFAULT_CYCLE, exchangeRate: 1 },
  });
  restoring.oxygen.fill(0);
  restoring.carbon.fill(0);
  restoring.ledger.initialOxygen = 0;
  initial(restoring);
  stepWorld(restoring);
  expect(total(restoring.oxygen)).toBeGreaterThan(0);
  expect(total(restoring.carbon)).toBeGreaterThan(0);
  expect(restoring.ledger.carbonExchanged).toBeCloseTo(total(restoring.carbon), 8);
  expect(Math.abs(oxygenBalance(restoring))).toBeLessThan(1e-8);
  conserved(restoring);
});
it("without the cycle no harvesting stock is built and waste leaves as before", () => {
  const w = createWorld(10, { ...small, cycle: undefined });
  expect(w.cells[0].body.photo).toBe(0);
  w.cells[0].reserve = 0.5;
  initial(w);
  stepWorld(w);
  expect(w.ledger.metabolicWaste).toBeGreaterThan(0);
  expect(w.ledger.fixed).toBe(0);
  expect(total(w.carbon)).toBe(0);
  conserved(w);
});
it("installed toxin machinery carries immunity proportional to stock, without ownership", () => {
  const none = createWorld(4, { ...small, immunityStrength: 0 }),
    some = createWorld(4, small),
    more = createWorld(4, small);
  more.cells[0].body.weapon *= 4;
  for (const w of [none, some, more]) {
    w.toxin.fill(0.1);
    damageCells(w);
  }
  expect(none.cells[0].damage).toBeGreaterThan(some.cells[0].damage);
  expect(some.cells[0].damage).toBeGreaterThan(more.cells[0].damage);
  expect(more.cells[0].damage).toBeGreaterThan(0);
  const bare = createWorld(4, small);
  bare.cells[0].body.weapon = 1e-12;
  bare.toxin.fill(0.1);
  damageCells(bare);
  expect(bare.cells[0].damage).toBeCloseTo(none.cells[0].damage, 6);
});
it("contact injury reaches only touching neighbours of toxin machinery and spares the immune", () => {
  const w = createWorld(6, { ...small, founders: 3, contactDamageRate: 5 });
  const [producer, touching, distant] = w.cells;
  producer.body.weapon = 0.06 * producer.body.core;
  touching.body.weapon = 1e-12;
  distant.body.weapon = 1e-12;
  Object.assign(producer, { x: 5, y: 5 });
  Object.assign(touching, { x: 5 + 0.8, y: 5 });
  Object.assign(distant, { x: 10, y: 10 });
  damageCells(w);
  expect(touching.damage).toBeGreaterThan(1e-4);
  expect(distant.damage).toBe(0);
  expect(producer.damage).toBeLessThan(1e-9);
  const immune = createWorld(6, { ...small, founders: 2, contactDamageRate: 5 });
  immune.cells[0].body.weapon = 0.06 * immune.cells[0].body.core;
  immune.cells[1].body.weapon = 0.06 * immune.cells[1].body.core;
  Object.assign(immune.cells[0], { x: 5, y: 5 });
  Object.assign(immune.cells[1], { x: 5.8, y: 5 });
  damageCells(immune);
  expect(immune.cells[1].damage).toBeLessThan(touching.damage / 10);
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

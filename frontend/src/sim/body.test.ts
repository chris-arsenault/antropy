import { expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { createWorld, stepWorld } from "./world";
import { seedGenotype } from "./genetics/genotype";
import { blueprint } from "./phenotype";
import { bodyRadius, basal, locomotion, scaleBody, structuralMass } from "./body";
import { balance, materialBalance, heldEnergy, heldMaterial, total } from "./accounting";
import { metabolize } from "./development";
import { uptakeRate } from "./resources";
import { moveBodies } from "./movement";
import { reproduce } from "./reproduction";
import { fundDivision } from "./testSupport";

it("motor genes change an independent construction target, not existing machinery", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 1 }),
    cell = w.cells[0];
  const normal = blueprint(w.genomes.get(1)!.genome, w.config),
    rates = locomotion(cell, w.config);
  const altered = seedGenotype(w.config);
  altered.chromosomes[0].physical[1] = 1;
  w.genomes.get(1)!.genome = altered;
  const target = blueprint(altered, w.config);
  expect(target.motor).toBeGreaterThan(normal.motor);
  expect(target.core).toBe(normal.core);
  expect(target.transport).toBe(normal.transport);
  expect(target.storage).toBe(normal.storage);
  expect(locomotion(cell, w.config)).toEqual(rates);
  expect(structuralMass(target)).toBeGreaterThan(structuralMass(normal));
});
it("installed motors add volume and idle maintenance as well as available power", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 1 }),
    cell = w.cells[0];
  const modified = { ...cell, body: { ...cell.body, motor: cell.body.motor * 2 } };
  expect(bodyRadius(modified, w.config)).toBeGreaterThan(bodyRadius(cell, w.config));
  expect(basal(modified, w.config)).toBeGreaterThan(basal(cell, w.config));
  expect(locomotion(modified, w.config).speed).toBeGreaterThan(locomotion(cell, w.config).speed);
  expect(modified.body.transport).toBe(cell.body.transport);
});
it("construction consumes both material and energy and stops when material is unavailable", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 1, catabolicRate: 0 }),
    cell = w.cells[0];
  const mass = structuralMass(cell.body),
    reserve = cell.reserve,
    energy = cell.energy;
  metabolize(w);
  const built = structuralMass(cell.body) - mass;
  expect(built).toBeGreaterThan(0);
  expect(reserve - cell.reserve).toBeCloseTo(built, 12);
  expect(energy - cell.energy).toBeCloseTo(
    w.ledger.metabolism + built * w.config.constructionEnergy,
    12
  );
  expect(Math.abs(balance(w))).toBeLessThan(1e-9);
  expect(Math.abs(materialBalance(w))).toBeLessThan(1e-9);
  cell.reserve = 0;
  const before = { ...cell.body };
  metabolize(w);
  expect(cell.body).toEqual(before);
});
it("catabolism turns stored nutrient into usable energy and material waste with explicit efficiency", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 1, growthRate: 0 }),
    cell = w.cells[0];
  const reserve = cell.reserve,
    energy = cell.energy;
  metabolize(w);
  expect(reserve - cell.reserve).toBeCloseTo(w.ledger.metabolicWaste, 12);
  expect(cell.energy - energy + w.ledger.metabolism).toBeCloseTo(
    w.ledger.metabolicWaste * w.config.nutrientEnergy * w.config.catabolicEfficiency,
    12
  );
  expect(Math.abs(balance(w))).toBeLessThan(1e-9);
  expect(Math.abs(materialBalance(w))).toBeLessThan(1e-9);
});
it("diffusion limits transporter uptake and stored food changes actual collision geometry", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 1, nutrientDiffusion: 1e-6 }),
    cell = w.cells[0];
  const limit = 4 * Math.PI * w.config.nutrientDiffusion * bodyRadius(cell, w.config);
  expect(uptakeRate(w, cell, 1)).toBeLessThan(limit);
  expect(uptakeRate(w, cell, 1)).toBeGreaterThan(0.99 * limit);
  expect(bodyRadius({ ...cell, reserve: cell.reserve * 2 }, w.config)).toBeGreaterThan(
    bodyRadius(cell, w.config)
  );
});
it("motors share installed power and secretion requires physical precursor material", () => {
  const w = createWorld(1, { ...DEFAULT_CONFIG, founders: 1 }),
    cell = w.cells[0];
  cell.reserve = 0;
  cell.action = { ...cell.action, swim: 1, turn: 1, secrete: 1 };
  moveBodies(w);
  expect(cell.action.swim ** 2 + cell.action.turn ** 2).toBeCloseTo(1, 12);
  expect(w.ledger.motors).toBeCloseTo(locomotion(cell, w.config).power * w.config.dt, 12);
  expect(w.ledger.emitted).toBe(0);
  expect(total(w.chemical)).toBe(0);
});
it("physical mutations inherit real stocks rather than materializing a newly specified body", () => {
  const w = createWorld(7, {
    ...DEFAULT_CONFIG,
    founders: 1,
    mutationRate: 0,
    physicalMutationRate: 1,
    physicalMutationScale: 0.5,
  });
  const parent = fundDivision(w),
    expected = scaleBody(parent.body, 0.5);
  const material = heldMaterial(w),
    energy = heldEnergy(w);
  reproduce(w);
  expect(w.cells).toHaveLength(2);
  expect(w.cells.every((c) => JSON.stringify(c.body) === JSON.stringify(expected))).toBe(true);
  expect(blueprint(w.genomes.get(w.cells[0].genome)!.genome, w.config)).not.toEqual(expected);
  expect(heldMaterial(w)).toBeCloseTo(material, 12);
  expect(heldEnergy(w) + w.ledger.division).toBeCloseTo(energy, 12);
});
it("starvation and chemical decay preserve both ledgers through an integrated resource loss", () => {
  const w = createWorld(9, {
    ...DEFAULT_CONFIG,
    founders: 1,
    initialNutrient: 0,
    sourceCount: 0,
    maintenance: 1,
  });
  for (let i = 0; i < 200 && !w.stopReason; i++) stepWorld(w);
  expect(w.ledger.deaths).toBe(1);
  expect(Math.abs(balance(w))).toBeLessThan(1e-9);
  expect(Math.abs(materialBalance(w))).toBeLessThan(1e-9);
});

/** Roadmap-two levers: family chemistry, predation, disturbance, gene transfer and sharing. */
import { expect, it } from "vitest";
import { createWorld } from "./world";
import { DEFAULT_CONFIG } from "./config";
import { heldMaterial, heldEnergy, materialBalance, balance, total } from "./accounting";
import { PHYSICAL_LOCI, TINT_LOCUS } from "./body";
import { damageCells } from "./interference";
import { affordActions, emitActions } from "./secretion";
import { initializeReceptors } from "./sensors";
import { reproduce } from "./reproduction";
import { disturb } from "./disturbance";
import { transferGenes } from "./transfer";
import { shareReserves } from "./sharing";
import { type World } from "./types";

const small = { ...DEFAULT_CONFIG, width: 16, height: 16, founders: 1, sourceCount: 0 };
function initial(world: World): void {
  world.ledger.initialMaterial = heldMaterial(world);
  world.ledger.initial = heldEnergy(world);
}
function conserved(world: World): void {
  expect(Math.abs(materialBalance(world))).toBeLessThan(1e-8);
  expect(Math.abs(balance(world))).toBeLessThan(1e-8);
}
it("family chemistry: producers are immune to the toxin type they make and sense the other", () => {
  const family = (types: 1 | 2) => {
    const w = createWorld(11, { ...small, founders: 2, toxinTypes: types });
    for (const [i, cell] of w.cells.entries()) {
      const genome = structuredClone(w.genomes.get(1)!.genome);
      genome.chromosomes[0].physical[TINT_LOCUS] = i === 0 ? -3 : 3;
      w.genomes.set(i + 1, { id: i + 1, parent: null, born: 0, learned: 0, genome });
      cell.genome = i + 1;
      cell.body.weapon = 0.1 * cell.body.core;
    }
    w.nextGenome = 3;
    return w;
  };
  // Type A toxin in the water: the A producer barely notices, the B producer is hurt and senses it.
  const typed = family(2);
  typed.toxin.fill(0.1);
  damageCells(typed);
  const [producerA, producerB] = typed.cells;
  // Tint ±3 leaves each producer a 5% share of the other type, so immunity is strong, not total.
  expect(producerB.damage).toBeGreaterThan(5 * producerA.damage);
  initializeReceptors(typed, producerA);
  initializeReceptors(typed, producerB);
  expect(producerB.receptors[3]).toBeGreaterThan(5 * producerA.receptors[3]);
  // Emission follows the tint, and both toxin fields sit inside the material balance.
  for (const cell of typed.cells) {
    cell.reserve = 0.5;
    cell.action = { ...cell.action, toxin: 1 };
  }
  initial(typed);
  affordActions(typed, producerA);
  emitActions(typed, producerA);
  affordActions(typed, producerB);
  emitActions(typed, producerB);
  expect(total(typed.toxinB)).toBeGreaterThan(0);
  expect(typed.ledger.toxinEmitted).toBeCloseTo(
    total(typed.toxin) - 0.1 * typed.toxin.length + total(typed.toxinB),
    8
  );
  conserved(typed);
  // With one toxin type the tint is silent and both producers share the same immunity.
  const plain = family(1);
  plain.toxin.fill(0.1);
  damageCells(plain);
  expect(plain.cells[0].damage).toBeCloseTo(plain.cells[1].damage, 12);
});
it("predation feeds a contact-killed cell to the touching producer and conserves material", () => {
  const w = createWorld(12, { ...small, founders: 2, contactDamageRate: 10, preyYield: 0.5 });
  const [predator, prey] = w.cells;
  predator.body.weapon = 0.2 * predator.body.core;
  prey.body.weapon = 0;
  prey.x = predator.x + 0.3;
  prey.y = predator.y;
  prey.damage = 0.999;
  prey.reserve = 0.4;
  const before = predator.reserve;
  initial(w);
  damageCells(w);
  expect(prey.damage).toBe(1);
  reproduce(w);
  expect(w.cells).toHaveLength(1);
  expect(w.ledger.preyed).toBeGreaterThan(0);
  expect(predator.reserve - before).toBeCloseTo(w.ledger.preyed, 12);
  expect(total(w.detritus)).toBeCloseTo(w.ledger.deathMaterial - w.ledger.preyed, 12);
  conserved(w);
  // A predator dying in the same pass cannot eat; the corpse goes to detritus and nothing leaks.
  const both = createWorld(12, { ...small, founders: 2, contactDamageRate: 10, preyYield: 0.5 });
  both.cells[0].body.weapon = 0.2 * both.cells[0].body.core;
  both.cells[1].x = both.cells[0].x + 0.3;
  both.cells[1].y = both.cells[0].y;
  both.cells[0].damage = 1;
  both.cells[1].damage = 1;
  initial(both);
  reproduce(both);
  expect(both.cells).toHaveLength(0);
  expect(both.ledger.preyed).toBe(0);
  expect(total(both.detritus)).toBeCloseTo(both.ledger.deathMaterial, 12);
  conserved(both);
  // Without the lever the same death goes entirely to detritus.
  const plain = createWorld(12, { ...small, founders: 2, contactDamageRate: 10 });
  plain.cells[0].body.weapon = 0.2 * plain.cells[0].body.core;
  plain.cells[1].x = plain.cells[0].x + 0.3;
  plain.cells[1].y = plain.cells[0].y;
  plain.cells[1].damage = 1;
  reproduce(plain);
  expect(plain.ledger.preyed).toBe(0);
  expect(total(plain.detritus)).toBeCloseTo(plain.ledger.deathMaterial, 12);
});
it("disturbance mixes a disc, kills a share of its cells into detritus, and conserves material", () => {
  const w = createWorld(13, {
    ...small,
    founders: 12,
    initialNutrient: 1,
    disturbance: { meanInterval: 1e-9, radius: 100, mortality: 0.5, mixing: 1 },
  });
  w.nutrient[0] = 5;
  initial(w);
  const before = w.cells.length;
  expect(disturb(w)).toBe(true);
  expect(w.ledger.disturbances).toBe(1);
  expect(w.ledger.disturbanceDeaths).toBe(before - w.cells.length);
  expect(w.ledger.disturbanceDeaths).toBeGreaterThan(0);
  expect(w.ledger.disturbanceDeaths).toBeLessThan(before);
  expect(new Set(w.nutrient).size).toBe(1);
  expect(total(w.detritus)).toBeCloseTo(w.ledger.deathMaterial, 12);
  conserved(w);
  const quiet = createWorld(13, { ...small, founders: 12 });
  expect(disturb(quiet)).toBe(false);
});
it("gene transfer copies one physical locus between touching cells into a new genotype record", () => {
  const pair = (transferRate: number) => {
    const w = createWorld(14, { ...small, founders: 2, transferRate });
    const donor = structuredClone(w.genomes.get(1)!.genome);
    for (let i = 0; i < PHYSICAL_LOCI; i++) donor.chromosomes[0].physical[i] = 1 + i / 10;
    w.genomes.set(2, { id: 2, parent: null, born: 0, learned: 0, genome: donor });
    w.nextGenome = 3;
    w.cells[1].genome = 2;
    w.ancestry.get(w.cells[1].id)!.genome = 2;
    w.cells[1].x = w.cells[0].x + 0.3;
    w.cells[1].y = w.cells[0].y;
    transferGenes(w);
    return w;
  };
  const w = pair(1e9);
  expect(w.ledger.transfers).toBeGreaterThan(0);
  const recipient = w.cells[0],
    record = w.genomes.get(recipient.genome)!;
  expect(recipient.genome).not.toBe(1);
  expect(record.parent).toBe(1);
  const physical = record.genome.chromosomes[0].physical,
    changed = [...physical].filter((v) => v !== 0);
  expect(changed.length).toBeGreaterThan(0);
  expect(changed.every((v) => v >= 1 && v <= 1 + (PHYSICAL_LOCI - 1) / 10)).toBe(true);
  expect(w.ancestry.get(recipient.id)!.genome).toBe(recipient.genome);
  expect(recipient.body).toEqual(pair(0).cells[0].body);
  expect(pair(0).ledger.transfers).toBe(0);
});
it("sharing moves stored nutrient from the richer to the poorer touching cell and conserves it", () => {
  const w = createWorld(15, { ...small, founders: 2, sharingRate: 5 });
  const [rich, poor] = w.cells;
  poor.x = rich.x + 0.3;
  poor.y = rich.y;
  rich.reserve = 0.8;
  poor.reserve = 0.1;
  initial(w);
  shareReserves(w);
  expect(w.ledger.shared).toBeGreaterThan(0);
  expect(rich.reserve).toBeLessThan(0.8);
  expect(poor.reserve).toBeGreaterThan(0.1);
  expect(rich.reserve).toBeGreaterThanOrEqual(poor.reserve);
  expect(rich.reserve + poor.reserve).toBeCloseTo(0.9, 12);
  conserved(w);
  const apart = createWorld(15, { ...small, founders: 2, sharingRate: 5 });
  apart.cells[1].x = apart.cells[0].x + 5;
  apart.cells[0].reserve = 0.8;
  shareReserves(apart);
  expect(apart.ledger.shared).toBe(0);
});

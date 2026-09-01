import { describe, expect, it } from "vitest";
import { SEX_MALE } from "./ant";
import { foundColony } from "./colony";
import { rnnController } from "./controller/rnn";
import { createWorld, spawnAnt, stepWorld, type World } from "./world";

/** Keep a nuptial pool alive — the lay pathway itself is unit-gated. */
function ensureMales(world: World, count: number): void {
  const living = world.ants.filter((ant) => ant.alive && ant.sex === SEX_MALE).length;
  const mother = world.ants.find((ant) => ant.alive && ant.sex !== SEX_MALE);
  if (!mother) {
    return;
  }
  for (let i = living; i < count; i++) {
    const genome = rnnController.haploidOffspring(mother.genome, world.rng);
    spawnAnt(world, {
      x: mother.x,
      y: mother.y,
      z: mother.z,
      heading: 0,
      energy: 1,
      sex: SEX_MALE,
      lineageId: mother.lineageId,
      patrilineId: mother.patrilineId,
      motherId: mother.id,
      fatherId: 0,
      genome,
      controllerState: rnnController.createState(),
      traits: rnnController.physical(genome),
    });
  }
}

// Slow tier (long simulation runs): excluded from `make test`; run with
// `make test-slow`. Cloud CI runs the full suite.
/**
 * Assists stand in for evolved delivery/laying so the loop machinery is
 * gated deterministically: top up stockpiles (delivery proxy), keep a small
 * nuptial pool alive (channel 2 proxy), and compress queen-egg incubation
 * (brood-survival odds are covered by the unit gates).
 */
function runAssists(world: World, t: number): void {
  for (const egg of world.eggs) {
    if (egg.queenDestined === 1 && egg.incubationRemaining > 60) {
      egg.incubationRemaining = 60;
    }
  }
  if (t % 500 === 0) {
    for (const colony of world.colonies) {
      colony.stockpile += 2.0;
      colony.queenLifespanTicks = 8000;
    }
    ensureMales(world, 3);
  }
}

describe("metapopulation loop (M4 gate)", () => {
  it("cycles founding and collapse over a long assisted run", { timeout: 240_000 }, () => {
    const world = createWorld(4100);
    const first = foundColony(world);
    first.queenLifespanTicks = 8000;

    for (let t = 0; t < 24_000; t++) {
      stepWorld(world);
      runAssists(world, t);
    }

    expect(world.foundings).toBeGreaterThanOrEqual(1);
    expect(world.collapses).toBeGreaterThanOrEqual(1);
    expect(world.colonies.length).toBeGreaterThanOrEqual(1);
    expect(world.ants.length).toBeGreaterThan(0);
  });
});

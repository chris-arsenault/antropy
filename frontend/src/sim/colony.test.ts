import { describe, expect, it } from "vitest";
import { SEX_MALE } from "./ant";
import { foundColony } from "./colony";
import { tryEat } from "./actions";
import { addEgg } from "./eggs";
import { rnnController } from "./controller/rnn";
import { COLONY, QUEEN } from "./tunables";
import { createWorld, spawnAnt, stepWorld } from "./world";

describe("colony founding", () => {
  it("creates a polyandrous queen with distinct patrilines in the first brood", () => {
    const world = createWorld(4001);
    const colony = foundColony(world);

    expect(colony.sperm.length).toBe(COLONY.spermCount);
    expect(world.ants.length).toBeGreaterThan(COLONY.initialWorkers / 2);
    const patrilines = new Set(world.ants.map((ant) => ant.patrilineId));
    expect(patrilines.size).toBeGreaterThan(1);
  });

  it("spawns every founder on the surface, never down the shaft", () => {
    for (const seed of [4001, 4002, 4003]) {
      const world = createWorld(seed);
      const colony = foundColony(world);
      for (const ant of world.ants) {
        const surface = world.surfaceMap[ant.z * world.grid.sizeX + ant.x];
        expect(ant.y).toBeGreaterThanOrEqual(surface - 1);
        expect(ant.y).toBeGreaterThan(colony.y + 1);
      }
    }
  });
});

describe("eggs", () => {
  it("lays from the stockpile, incubates, and hatches a juvenile", { timeout: 30_000 }, () => {
    const world = createWorld(4003);
    const colony = foundColony(world);
    world.ants = []; // isolate the egg lifecycle
    colony.stockpile = 5;

    for (let t = 0; t <= COLONY.eggIntervalMin + 1 && world.eggs.length === 0; t++) {
      stepWorld(world);
    }
    expect(world.eggs.length).toBeGreaterThan(0);
    expect(colony.stockpile).toBeLessThan(5);

    const egg = world.eggs[0];
    for (let t = 0; t < COLONY.incubationTicks + 1; t++) {
      stepWorld(world);
    }
    const hatched = world.ants.find((ant) => ant.patrilineId === egg.patrilineId);
    expect(hatched).toBeDefined();
    const juvenile = hatched as NonNullable<typeof hatched>;
    expect(juvenile.bodyScale).toBeLessThan(juvenile.traits.bodyScale);
  });

  it("lets an ant eat an egg", () => {
    const world = createWorld(4003);
    foundColony(world);
    const ant = world.ants[0];
    ant.heading = 0;
    const genome = rnnController.seed(world.rng);
    addEgg(world, {
      id: 999,
      x: ant.x + 1,
      y: ant.y,
      z: ant.z,
      genome,
      energy: 0.3,
      incubationRemaining: 500,
      sex: 0,
      queenDestined: 0,
      lineageId: 1,
      patrilineId: 1,
      motherId: 0,
      fatherId: 1,
    });
    ant.energy = 0.1;

    tryEat(world, ant);
    expect(world.eggs.length).toBe(0);
    expect(ant.energy).toBeGreaterThan(0.1);
  });
});

function injectMales(world: ReturnType<typeof createWorld>, count: number): void {
  for (let i = 0; i < count; i++) {
    const mother = world.ants[i];
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

describe("real founding and collapse (spec §9.1)", () => {
  it("lays a merit-fathered queen egg from a provisioned stockpile", () => {
    const world = createWorld(4004);
    const colony = foundColony(world);
    colony.stockpile = QUEEN.eggThreshold + 2;
    colony.lastQueenEggTick = -QUEEN.eggIntervalMin;
    colony.patrilineDeliveries.set(colony.sperm[2].patrilineId, 50);

    stepWorld(world);
    const queenEgg = world.eggs.find((egg) => egg.queenDestined === 1);
    expect(queenEgg).toBeDefined();
    const egg = queenEgg as NonNullable<typeof queenEgg>;
    expect(egg.fatherId).toBe(colony.sperm[2].patrilineId);
    expect(egg.energy).toBeCloseTo(QUEEN.eggEndowment);
  });

  it("founds a new colony through flight and mating, killing the mates", () => {
    const world = createWorld(4006);
    const colony = foundColony(world);
    const maleCount = 3;
    injectMales(world, maleCount);
    colony.stockpile = QUEEN.eggThreshold + 2;
    colony.lastQueenEggTick = -QUEEN.eggIntervalMin;
    stepWorld(world);
    const queenEgg = world.eggs.find((egg) => egg.queenDestined === 1);
    expect(queenEgg).toBeDefined();
    (queenEgg as NonNullable<typeof queenEgg>).incubationRemaining = 1;

    stepWorld(world);
    expect(world.foundings).toBe(1);
    expect(world.colonies.length).toBe(2);
    const daughter = world.colonies[1];
    expect(daughter.sperm.length).toBe(maleCount);
    expect(world.ants.filter((ant) => ant.sex === SEX_MALE && ant.alive).length).toBe(0);
  });

  it("fails founding loudly when no males exist", () => {
    const world = createWorld(4007);
    const colony = foundColony(world);
    colony.stockpile = QUEEN.eggThreshold + 2;
    colony.lastQueenEggTick = -QUEEN.eggIntervalMin;
    stepWorld(world);
    const queenEgg = world.eggs.find((egg) => egg.queenDestined === 1);
    (queenEgg as NonNullable<typeof queenEgg>).incubationRemaining = 1;

    stepWorld(world);
    expect(world.foundingFailures).toBe(1);
    expect(world.colonies.length).toBe(1);
  });

  it("collapses the colony when the queen ages out", () => {
    const world = createWorld(4008);
    const colony = foundColony(world);
    colony.queenAge = colony.queenLifespanTicks;
    stepWorld(world);
    expect(world.colonies.length).toBe(0);
    expect(world.collapses).toBe(1);
  });

  it("collapses the colony after sustained starvation past the grace", () => {
    const world = createWorld(4009);
    const colony = foundColony(world);
    colony.stockpile = 0;
    colony.starvingSince = 0;
    world.tick = QUEEN.starvationGraceTicks + 1;
    stepWorld(world);
    expect(world.colonies.length).toBe(0);
    expect(world.collapses).toBe(1);
  });

  it("survives a brief empty stockpile within the grace", () => {
    const world = createWorld(4010);
    const colony = foundColony(world);
    colony.stockpile = 0;
    stepWorld(world);
    expect(world.colonies.length).toBe(1);
    expect(colony.starvingSince).toBeGreaterThanOrEqual(0);
  });
});

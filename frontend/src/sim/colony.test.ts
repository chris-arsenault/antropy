import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { tryEat } from "./actions";
import { addEgg } from "./eggs";
import { rnnController } from "./controller/rnn";
import { COLONY } from "./tunables";
import { createWorld, stepWorld } from "./world";

describe("colony founding", () => {
  it("creates a polyandrous queen with distinct patrilines in the first brood", () => {
    const world = createWorld(4001);
    const colony = foundColony(world);

    expect(colony.sperm.length).toBe(COLONY.spermCount);
    expect(world.ants.length).toBeGreaterThan(COLONY.initialWorkers / 2);
    const patrilines = new Set(world.ants.map((ant) => ant.patrilineId));
    expect(patrilines.size).toBeGreaterThan(1);
  });
});

describe("eggs", () => {
  it("lays from the stockpile, incubates, and hatches a juvenile", () => {
    const world = createWorld(4002);
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

describe("merit-weighted succession (M6 gate)", () => {
  it("replaces the queen from the top patriline and refreshes sperm", () => {
    const world = createWorld(4004);
    const colony = foundColony(world);
    const beforeQueenTraits = rnnController.physical(colony.queenGenome);
    const beforePatrilines = colony.sperm.map((s) => s.patrilineId);
    colony.patrilineDeliveries.set(beforePatrilines[2], 50);
    colony.queenAge = colony.queenLifespanTicks;

    stepWorld(world);
    expect(colony.successions).toBe(1);
    expect(colony.queenAge).toBe(0);
    expect(rnnController.physical(colony.queenGenome)).not.toEqual(beforeQueenTraits);
    for (const sperm of colony.sperm) {
      expect(beforePatrilines).not.toContain(sperm.patrilineId);
    }
  });
});

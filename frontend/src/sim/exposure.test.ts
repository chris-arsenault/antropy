import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { addEgg, stepEggs } from "./eggs";
import { rnnController } from "./controller/rnn";
import { MICROCLIMATE } from "./tunables";
import { surfaceStress } from "./weather";
import { createWorld } from "./world";

describe("climate-keyed egg exposure", () => {
  it("kills surface eggs at midday and spares deep eggs", () => {
    const world = createWorld(7010);
    // Park the clock at a midday peak.
    world.tick = Math.round(MICROCLIMATE.dayTicks / 4);
    expect(surfaceStress(world.tick)).toBeGreaterThan(4);
    const y = surfaceSpawnY(world.grid, 60, 60) as number;
    const genome = rnnController.seed(world.rng);
    addEgg(world, {
      id: 1,
      x: 60,
      y,
      z: 60,
      genome,
      energy: 1,
      incubationRemaining: 100_000,
      sex: 0,
      queenDestined: 0,
      lineageId: 1,
      patrilineId: 1,
      motherId: 1,
      fatherId: 1,
    });
    for (let i = 0; i < 3000 && world.eggs.length > 0; i++) {
      stepEggs(world);
    }
    expect(world.eggsPerished, `laid=${world.eggsLaid} perished=${world.eggsPerished}`).toBe(1);
  });
});

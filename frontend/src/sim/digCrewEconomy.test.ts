import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHASE2_CONFIG } from "./config";
import { diggerSeedVector, rnnController, setRuntimeSeedBase } from "./controller/rnn";
import { measureNest } from "./nestMetrics";
import { createWorld, populateDiggers, stepWorld } from "./world";

/**
 * What a seeded digging crew actually costs when metabolism has
 * consequences. The crew has no foraging reflex by design (the seed spec
 * is three reflexes), so it digs on its starting energy: this measures
 * how much nest that budget buys before the crew runs out.
 */
describe("digging crew economy", () => {
  it("measures nest size against the crew's energy budget", { timeout: 120_000 }, () => {
    const world = createWorld(1, rnnController, { ...PHASE2_CONFIG, mortality: true });
    world.foodBase = 0;
    world.foodTarget = 0;
    setRuntimeSeedBase(diggerSeedVector());
    populateDiggers(world, 9);
    setRuntimeSeedBase(null);
    const site = { x: Math.floor(world.grid.sizeX / 2), z: Math.floor(world.grid.sizeZ / 2) };
    const surfaceY = world.ants[0].y;

    const lines: string[] = [];
    for (let t = 1; t <= 6000; t++) {
      stepWorld(world);
      if (t % 500 === 0) {
        const shape = measureNest(world, site, surfaceY);
        const meanEnergy =
          world.ants.reduce((a, b) => a + b.energy, 0) / Math.max(1, world.ants.length);
        lines.push(
          `t=${t} ants=${world.ants.length} meanEnergy=${meanEnergy.toFixed(2)} ` +
            `volume=${shape.volume} levels=${shape.levels} maxWidth=${shape.maxWidth}`
        );
      }
    }
    mkdirSync("test-results", { recursive: true });
    appendFileSync("test-results/dig-crew.txt", lines.join("\n") + "\n");
    expect(lines.length).toBe(12);
  });
});

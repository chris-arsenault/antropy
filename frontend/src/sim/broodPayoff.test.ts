import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { foundColony } from "./colony";
import { LADDER_STEP10D_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxel } from "./grid";
import { Material } from "./materials";
import { expectedEggSurvival } from "./oracles/broodLedger";
import { createWorld, mutateVoxel } from "./world";

const HARSH_MIDDAY_TICK = 30_500;
const OBSERVATION_TICKS = 600;

describe("brood payoff gradient", () => {
  it.each([10_401, 10_402, 10_403])(
    "each incremental depth improves expected survival in founded world %i",
    (seed) => {
      const survival: number[] = [];

      for (let extraDepth = 0; extraDepth <= 3; extraDepth++) {
        const world = createWorld(seed, rnnController, {
          ...LADDER_STEP10D_CONFIG,
          reproduction: false,
          motorJitter: false,
        });
        world.tick = HARSH_MIDDAY_TICK;
        const colony = foundColony(world);
        const y = colony.y - extraDepth;
        for (let carveY = colony.y - 1; carveY >= y; carveY--) {
          expect(getVoxel(world.grid, colony.x, carveY, colony.z)).not.toBe(Material.ROCK);
          mutateVoxel(world, colony.x, carveY, colony.z, Material.AIR);
        }
        survival.push(
          expectedEggSurvival(
            world,
            { x: colony.x, y, z: colony.z },
            HARSH_MIDDAY_TICK,
            OBSERVATION_TICKS
          )
        );
      }

      mkdirSync("test-results", { recursive: true });
      appendFileSync(
        "test-results/brood-payoff.txt",
        JSON.stringify({ seed, survivalByExtraDepth: survival }) + "\n"
      );

      expect(survival[0]).toBeGreaterThan(0);
      expect(survival[0]).toBeLessThan(1);
      for (let index = 1; index < survival.length; index++) {
        expect(survival[index]).toBeGreaterThan(survival[index - 1]);
      }
      expect(survival[3]).toBe(1);
    }
  );
});

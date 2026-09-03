import { describe, expect, it } from "vitest";
import { surfaceSpawnY } from "./ant";
import { PHASE2_CONFIG } from "./config";
import { OUTPUT_COUNT } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { deterministicMotorJitter } from "./motorJitter";
import { createWorld, spawnAnt, stepWorld } from "./world";

function twinHeadings(enabled: boolean): number[] {
  const world = createWorld(12_401, rnnController, {
    ...PHASE2_CONFIG,
    motorJitter: enabled,
  });
  world.foodBase = 0;
  world.foodTarget = 0;
  const x = 96;
  const z = 96;
  const y = surfaceSpawnY(world.grid, x, z);
  if (y === null) {
    throw new Error("motor-jitter arena has no surface");
  }
  const genome = rnnController.seed(world.rng);
  const traits = rnnController.physical(genome);
  for (let i = 0; i < 2; i++) {
    spawnAnt(world, {
      x,
      y,
      z,
      heading: 0,
      energy: 1,
      lineageId: 0,
      patrilineId: 0,
      motherId: 0,
      fatherId: 0,
      genome,
      controllerState: rnnController.createState(),
      traits,
    });
  }
  const idle = new Float32Array(OUTPUT_COUNT);
  world.policyOverride = () => idle;
  stepWorld(world);
  return world.ants.map((ant) => ant.heading);
}

describe("deterministic motor jitter", () => {
  it("is stable for one ant-tick, bounded, and distinct across ants", () => {
    const values = Array.from({ length: 32 }, (_, index) =>
      deterministicMotorJitter(91, index + 1, 700)
    );

    expect(deterministicMotorJitter(91, 4, 700)).toBe(deterministicMotorJitter(91, 4, 700));
    expect(values.every((value) => value >= -1 && value < 1)).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });

  it("breaks co-located oracle lockstep without breaking replay determinism", () => {
    const first = twinHeadings(true);
    const replay = twinHeadings(true);

    expect(first[0]).not.toBe(first[1]);
    expect(replay).toEqual(first);
  });

  it("can be disabled for exact assay worlds", () => {
    expect(twinHeadings(false)).toEqual([0, 0]);
  });
});

import { describe, expect, it } from "vitest";
import { decodeCheckpoint, encodeCheckpoint, restoreCheckpoint } from "./checkpoint";
import { createWorld, stepWorld, summarizeWorld } from "../sim/world";
import { FORAGER_CONFIG, PROGRAMMED_LIFECYCLE_CONFIG } from "../sim/config";
import { createCheckpoint } from "./checkpoint";
import { maintainColony } from "../sim/lifecycle";
import { totalEnergy } from "../sim/resources";
import { programmedColony } from "../sim/policies/colony";

it("persists nutritional density and rejects the old energy-only checkpoint shape", () => {
  const world = createWorld(
    7,
    "programmed-lifecycle",
    {
      ...PROGRAMMED_LIFECYCLE_CONFIG,
      foodEnergyDensity: 0.75,
    },
    false
  );
  world.ant.cargo = 3;
  world.economy.initial = totalEnergy(world);
  stepWorld(world);
  const checkpoint = createCheckpoint(world),
    restored = restoreCheckpoint(checkpoint);
  for (let tick = 0; tick < 5; tick++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
  expect(() => restoreCheckpoint({ ...checkpoint, version: 4 })).toThrow("canonical 2D");
});

describe("2D checkpoints", () => {
  it("preserves exactly the same state through the training policy hook", () => {
    const left = createWorld(9, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
    const right = createWorld(9, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
    for (let tick = 0; tick < 20; tick++) {
      stepWorld(left);
      stepWorld(right, programmedColony);
    }
    expect(createCheckpoint(right)).toEqual(createCheckpoint(left));
  });

  it("continues the deterministic world exactly", () => {
    const original = createWorld(9, "programmed", FORAGER_CONFIG, false);
    for (let tick = 0; tick < 30; tick++) stepWorld(original);
    const restored = decodeCheckpoint(encodeCheckpoint(original));
    for (let tick = 0; tick < 20; tick++) {
      stepWorld(original);
      stepWorld(restored);
    }
    expect(summarizeWorld(restored)).toEqual(summarizeWorld(original));
    expect([...restored.grid.cells]).toEqual([...original.grid.cells]);
  });

  it("continues a changing population, developing brood and resource ledger exactly", () => {
    const world = createWorld(9, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
    world.ant.age = world.config.workerLifespan;
    world.queen.layingAge = world.config.layingInterval;
    maintainColony(world);
    const restored = restoreCheckpoint(createCheckpoint(world));
    for (let tick = 0; tick < 20; tick++) {
      stepWorld(world);
      stepWorld(restored);
    }
    expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
  });

  it("restores an extinct worker population without adding founders or reusing IDs", () => {
    const world = createWorld(9, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
    for (const ant of world.ants) ant.energy = 0;
    world.economy.initial = totalEnergy(world);
    maintainColony(world);
    const restored = restoreCheckpoint(createCheckpoint(world));
    expect(restored.ants).toHaveLength(0);
    expect(restored.nextAntId).toBe(10);
    expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
    for (let tick = 0; tick < 5; tick++) {
      stepWorld(world);
      stepWorld(restored);
    }
    expect(restored.ants).toHaveLength(0);
    expect(summarizeWorld(restored).energy).toBe(0);
    expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
  });

  it("rejects the former checkpoint shape", () => {
    expect(() => restoreCheckpoint({ version: 22, grid: [], ants: [] })).toThrow(
      "canonical 2D simulation"
    );
  });
});

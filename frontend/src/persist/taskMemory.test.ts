import { expect, it } from "vitest";
import { PROGRAMMED_LIFECYCLE_CONFIG } from "../sim/config";
import { IDLE_ACTION } from "../sim/controller/contract";
import { createWorld, stepWorld } from "../sim/world";
import { overrideTask } from "../sim/taskMemory";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";
import { createAnt } from "../sim/ant";
import { programmedColony } from "../sim/policies/colony";

it("keeps byte writes local, persistent and visible on the next decision", () => {
  const world = createWorld(4, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
  const seen: number[] = [];
  stepWorld(world, (frame, ant) => {
    seen.push(frame.task);
    return { ...IDLE_ACTION, task: ant.id === 1 ? 255 : null };
  });
  expect(seen.every((value) => value === 0)).toBe(true);
  stepWorld(world, (frame, ant) => {
    expect(frame.task).toBe(ant.id === 1 ? 255 : 0);
    return IDLE_ACTION;
  });
  expect(world.ants[0]).toMatchObject({ task: 255, taskAge: 1, taskChanges: 1 });
  expect(world.taskOverrides).toBe(0);
  expect(createAnt(world, 999).task).toBe(0);
});

it("persists diagnostic overrides and rejects invalid register state", () => {
  const world = createWorld(4, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
  overrideTask(world, 1, 7);
  const checkpoint = createCheckpoint(world);
  const restored = restoreCheckpoint(checkpoint);
  expect(createCheckpoint(restored)).toEqual(checkpoint);
  expect(restored.taskOverrides).toBe(1);
  expect(() => overrideTask(world, 1, 256)).toThrow("byte");
  expect(() => overrideTask(world, 1, -1)).toThrow("byte");
  expect(() => overrideTask(world, 999, 1)).toThrow("living ant");
  expect(() => restoreCheckpoint({ ...checkpoint, version: 5 })).toThrow("canonical 2D");
  checkpoint.ants[0].task = 0.5;
  expect(() => restoreCheckpoint(checkpoint)).toThrow("task memory");
});

it("preserves programmed physical choices regardless of its diagnostic register", () => {
  const world = createWorld(4, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
  for (let tick = 0; tick < 64; tick++)
    stepWorld(world, (frame) => {
      const reference = programmedColony(frame);
      const changed = programmedColony({ ...frame, task: 255 });
      expect({ ...changed, task: null }).toEqual({ ...reference, task: null });
      return reference;
    });
});

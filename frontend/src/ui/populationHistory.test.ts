import { expect, it } from "vitest";
import { createWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { appendPoint, appendRecent, populationPoint } from "./populationHistory";

it("retains the observation origin and founder shares in bounded histories", () => {
  const world = createWorld(1, { ...DEFAULT_CONFIG, founders: 2 });
  let history = [populationPoint(world)];
  for (let tick = 1; tick <= 1000; tick++) {
    world.tick = tick;
    history = appendPoint(history, world);
  }
  expect(history.length).toBeLessThanOrEqual(240);
  expect(history[0].tick).toBe(0);
  expect(history.at(-1)!.tick).toBe(1000);
  expect(history[0].lineages).toEqual([
    [1, 1],
    [2, 1],
  ]);
  expect(appendPoint(history, world)).toEqual(history);
});

it("keeps recent decision samples at full cadence with a bounded tick window", () => {
  const world = createWorld(1, { ...DEFAULT_CONFIG, founders: 2 });
  let recent: ReturnType<typeof populationPoint>[] = [];
  for (let tick = 100; tick <= 3000; tick += 100) {
    world.tick = tick;
    recent = appendRecent(recent, populationPoint(world));
  }
  expect(recent).toHaveLength(20);
  expect(recent[0].tick).toBe(1100);
  expect(appendRecent(recent, populationPoint(world))).toEqual(recent);
  const samples = recent.flatMap((p) => p.efforts[0].bins).reduce((a, b) => a + b, 0);
  expect(samples).toBe(40);
});

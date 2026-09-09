import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { FORAGER_CONFIG } from "../sim/config";
import { WAIT } from "../sim/colony/contract";
import { applyRequest } from "../sim/colony/resolve";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";

it("persists the linear genome, acquired knowledge, task and route without aliasing snapshots", () => {
  const world = createWorld(1, "colony-lgp", FORAGER_CONFIG, false);
  applyRequest(world, world.ant, { ...WAIT, kind: "acquire", destination: -1, task: 255 });
  const saved = createCheckpoint(world),
    restored = restoreCheckpoint(saved);
  applyRequest(world, world.ant, { ...WAIT, kind: "forward" });
  expect(saved.ants[0].decision.route!.cursor).toBe(0);
  applyRequest(restored, restored.ant, { ...WAIT, kind: "forward" });
  for (let i = 0; i < 5; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
});

it("rejects corrupt programs and nonphysical routes before continuing a checkpoint", () => {
  const world = createWorld(1, "colony-lgp", FORAGER_CONFIG, false);
  applyRequest(world, world.ant, { ...WAIT, kind: "acquire", destination: -1 });
  const saved = createCheckpoint(world);
  expect(() =>
    restoreCheckpoint({ ...saved, linearGenome: { version: 1, instructions: [] } })
  ).toThrow("linear");
  saved.ants[0].decision.route!.cells[1] = 0;
  expect(() => restoreCheckpoint(saved)).toThrow("nonphysical");
});

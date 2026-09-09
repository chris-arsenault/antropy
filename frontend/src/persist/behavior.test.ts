import { expect, it } from "vitest";
import { constructionFixture } from "../sim/construction/fixture";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";
import { FORAGER_CONFIG } from "../sim/config";
import { actColonyWorker } from "../sim/colony/actors";
import { stepWorld } from "../sim/world";

it("persists private focus and bounded behavior events through deterministic continuation", () => {
  const { world } = constructionFixture("colony-programmed", 1, {
    environment: {
      ...FORAGER_CONFIG.environment,
      collectiveWork: true,
      autonomousConstruction: true,
    },
  });
  world.ant.decision.focus = { x: world.ant.x, y: world.ant.y, since: 0, backed: true };
  const checkpoint = createCheckpoint(world);
  const restored = restoreCheckpoint(checkpoint);
  for (let i = 0; i < 4; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
  expect(checkpoint.ants[0].decision.focus).not.toBeNull();
  actColonyWorker(world, world.ant);
  expect(checkpoint.behavior.counts).not.toBe(world.behavior.counts);
});

it("rejects malformed memory and instrumentation rather than silently resetting it", () => {
  const { world } = constructionFixture();
  const checkpoint = createCheckpoint(world);
  checkpoint.behavior.counts.cuts = -1;
  expect(() => restoreCheckpoint(checkpoint)).toThrow("behavior ledger");
  checkpoint.behavior.counts.cuts = 0;
  checkpoint.ants[0].decision.focus = { x: -1, y: 21, since: 0, backed: true };
  expect(() => restoreCheckpoint(checkpoint)).toThrow("private worksite");
});

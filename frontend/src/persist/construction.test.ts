import { expect, it } from "vitest";
import { constructionFixture } from "../sim/construction/fixture";
import { createCheckpoint, restoreCheckpoint } from "./checkpoint";
import { requestConstruction } from "../sim/construction/sites";
import { applyRequest } from "../sim/colony/resolve";
import { WAIT } from "../sim/colony/contract";
import { Material } from "../sim/materials";
import { setCell } from "../sim/grid";
import { stepWorld } from "../sim/world";
import { expireWorkHistory } from "../sim/construction/history";

it("preserves partial digging and completes identically after checkpoint restore", () => {
  const { world } = constructionFixture("colony-lgp");
  setCell(world.grid, 24, 21, Material.CLAY);
  const job = requestConstruction(world, "dig", { x: 24, y: 21 }, { x: 30, y: 21 });
  applyRequest(world, world.ant, { ...WAIT, kind: "claim", destination: job.id });
  applyRequest(world, world.ant, { ...WAIT, kind: "dig" });
  const saved = createCheckpoint(world),
    restored = restoreCheckpoint(saved);
  expect(createCheckpoint(restored)).toEqual(saved);
  for (let i = 0; i < 25; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(createCheckpoint(restored)).toEqual(createCheckpoint(world));
});

it("preserves a carried queen and rejects missing carriers, impossible loads and cache aliases", () => {
  const { world } = constructionFixture();
  world.ant.x = 24;
  applyRequest(world, world.ant, { ...WAIT, kind: "attach-queen" });
  const checkpoint = createCheckpoint(world);
  expect(createCheckpoint(restoreCheckpoint(checkpoint))).toEqual(checkpoint);
  const missing = structuredClone(checkpoint);
  missing.queen.carrier = 900;
  expect(() => restoreCheckpoint(missing)).toThrow(/carrier/);
  const loaded = structuredClone(checkpoint);
  loaded.ants[0].cargo = 1;
  expect(() => restoreCheckpoint(loaded)).toThrow(/carrier/);
  const duplicate = structuredClone(checkpoint);
  duplicate.construction.caches.push(duplicate.construction.caches[0]);
  expect(() => restoreCheckpoint(duplicate)).toThrow(/cache/);
});

it("rejects forged construction claims and unaccounted spoil", () => {
  const { world } = constructionFixture();
  const checkpoint = createCheckpoint(world);
  checkpoint.ants[0].job = -7000;
  expect(() => restoreCheckpoint(checkpoint)).toThrow(/claim/);
  const material = createCheckpoint(world);
  material.ants[0].spoil = Material.CLAY;
  expect(() => restoreCheckpoint(material)).toThrow(/conserve/);
});

it("keeps completion totals after work memory expires and rejects corrupt totals", () => {
  const { world } = constructionFixture();
  const job = requestConstruction(world, "queen", world.queen, { x: 30, y: 21 });
  applyRequest(world, world.ant, { ...WAIT, kind: "claim", destination: job.id });
  expect(applyRequest(world, world.ant, { ...WAIT, kind: "finish" })).toBe("success");
  expect(applyRequest(world, world.ant, { ...WAIT, kind: "finish" })).toBe("blocked");
  world.tick = world.config.knowledgeDuration + 1;
  expireWorkHistory(world);
  expect(world.construction.jobs).toHaveLength(0);
  const saved = createCheckpoint(world);
  expect(restoreCheckpoint(saved).construction.completed.queen).toBe(1);
  saved.construction.completed.queen = -1;
  expect(() => restoreCheckpoint(saved)).toThrow(/construction state/);
});

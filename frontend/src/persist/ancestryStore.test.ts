import { expect, it } from "vitest";
import { AncestryStore } from "../sim/ancestryStore";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { checkpointToJson, restoreWorld } from "../persist/checkpoint";
import { relatedness } from "../observe/ancestry";

it("packs closed lifetimes without losing exact parentage or mutable living records", () => {
  const records = new AncestryStore();
  for (let id = 1; id <= 10000; id++)
    records.set(id, {
      id,
      parent: id === 1 ? null : id - 1,
      lineage: 1,
      genome: 1,
      born: id - 1,
      ended: id === 10000 ? null : id,
      cause: id === 10000 ? "alive" : "division",
    });
  const original = [...records.values()];
  records.compact();
  expect(records.hasPages).toBe(true);
  expect([...records.values()]).toEqual(original);
  expect(records.packed().active.length).toBeLessThanOrEqual(2048);
  const restored = AncestryStore.unpack(records.packed());
  expect([...restored.values()]).toEqual(original);
  restored.get(10000)!.ended = 10001;
  expect(restored.get(10000)!.ended).toBe(10001);
  restored.delete(10);
  expect(restored.has(10)).toBe(false);
  expect(restored.size).toBe(9999);
});

it("continues the physical state with a synthetic accumulated ancestry fixture", () => {
  const world = createWorld(4, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 1,
    sourceCount: 0,
  });
  const records = world.ancestry as AncestryStore;
  for (let id = 1; id <= 10000; id++)
    records.set(id, {
      id,
      parent: id === 1 ? null : id - 1,
      lineage: 1,
      genome: 1,
      born: id - 1,
      ended: id === 10000 ? null : id,
      cause: id === 10000 ? "alive" : "division",
    });
  Object.assign(world.cells[0], { id: 10000, parent: 9999, born: 9999, generation: 9999 });
  world.nextCell = 10001;
  world.tick = 10000;
  records.compact();
  const restored = restoreWorld(checkpointToJson(world));
  expect(relatedness(restored, 1, 10000)).toEqual({ ancestor: 1, links: 9999 });
  for (let i = 0; i < 10; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(checkpointToJson(restored)).toBe(checkpointToJson(world));
});

it("rejects oversized page identities and incomplete packed ancestry", () => {
  expect(() =>
    AncestryStore.unpack({
      encoding: "ancestry-f64-v1",
      pages: [[100000, ""]],
      active: [],
      count: 0,
    })
  ).toThrow("page ID");
  expect(() =>
    AncestryStore.unpack({ encoding: "ancestry-f64-v1", pages: [], active: [], count: 1 })
  ).toThrow("count");
});

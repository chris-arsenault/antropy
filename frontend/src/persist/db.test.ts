// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { saveLocal, loadLocal, listRecoveries } from "./db";
import { createWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { checkpointToJson, restoreWorld } from "./checkpoint";
import { saveObservation } from "./observation";

beforeEach(() => vi.stubGlobal("indexedDB", new IDBFactory()));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const meta = { runId: "run", seed: 101, reason: "automatic" as const };
it("compresses and restores exact checkpoints while retaining manual recovery separately", async () => {
  await saveLocal("manual checkpoint", { ...meta, tick: 1, reason: "manual" });
  for (let tick = 2; tick <= 9; tick++) {
    vi.spyOn(Date, "now").mockReturnValue(tick * 1000);
    await saveLocal(`checkpoint at ${tick}`, { ...meta, tick });
  }
  const records = await listRecoveries();
  expect(records.map((r) => r.tick).sort((a, b) => a - b)).toEqual([1, 4, 5, 6, 7, 8, 9]);
  expect(await loadLocal(records.find((r) => r.tick === 9)!.id)).toBe("checkpoint at 9");
  expect(await loadLocal(records.find((r) => r.reason === "manual")!.id)).toBe("manual checkpoint");
  vi.restoreAllMocks();
});
it("preserves completed recovery when a later transaction aborts", async () => {
  await saveLocal("first", { ...meta, tick: 1 });
  vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
    throw new Error("quota unavailable");
  });
  await expect(saveLocal("second", { ...meta, tick: 2 })).rejects.toThrow("quota unavailable");
  vi.restoreAllMocks();
  expect(await loadLocal()).toBe("first");
});
it("saves and restores observation and recovery IDs without crypto.randomUUID", async () => {
  const getRandomValues = crypto.getRandomValues.bind(crypto);
  vi.stubGlobal("crypto", { getRandomValues });
  const world = createWorld(101, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 1,
    sourceCount: 0,
  });
  const physical = checkpointToJson(world);
  const observation = saveObservation(world);
  const text = checkpointToJson(world, "test", observation);
  await saveLocal(text, { ...meta, tick: world.tick, runId: observation.runId });
  const records = await listRecoveries();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  expect(records[0].id).toMatch(uuid);
  expect(records[0].runId).toMatch(uuid);
  expect(records[0].id).not.toBe(records[0].runId);
  const restored = restoreWorld(await loadLocal());
  expect(saveObservation(restored).runId).toBe(observation.runId);
  expect(checkpointToJson(world)).toBe(physical);
  expect(checkpointToJson(restored)).toBe(physical);
});

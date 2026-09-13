import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { observeSpatial, spatialHistory } from "../observe/spatialHistory";
import { checkpointToJson, restoreWorld } from "./checkpoint";
import { saveObservation } from "./observation";
import { retainedRecoveries, RECOVERY_BYTES, type RecoveryMetadata } from "./recoveryPolicy";

it("restores scientific state, region identity and observation history independently", () => {
  const world = createWorld(9, {
    ...DEFAULT_CONFIG,
    width: 24,
    height: 24,
    founders: 5,
    sourceCount: 1,
  });
  observeSpatial(world);
  for (let i = 0; i < 30; i++) {
    stepWorld(world);
    observeSpatial(world);
  }
  const physical = checkpointToJson(world);
  const saved = checkpointToJson(world, "test-source", saveObservation(world));
  expect(checkpointToJson(world)).toBe(physical);
  const restored = restoreWorld(saved);
  expect(spatialHistory(restored)).toEqual(spatialHistory(world));
  expect(saveObservation(restored).runId).toBe(saveObservation(world).runId);
  expect(checkpointToJson(restored)).toBe(physical);
  for (let i = 0; i < 5; i++) {
    stepWorld(world);
    stepWorld(restored);
  }
  expect(checkpointToJson(restored)).toBe(checkpointToJson(world));
});

it("rejects future observation clocks without changing checkpoint physics", () => {
  const world = createWorld(1, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 1,
    sourceCount: 0,
  });
  const saved = JSON.parse(checkpointToJson(world, "test", saveObservation(world)));
  saved.observation.spatial.tick = 100;
  expect(() => restoreWorld(JSON.stringify(saved))).toThrow("observation clock");
});

it("rejects malformed display records rather than restoring a crashing observer", () => {
  const world = createWorld(1, {
    ...DEFAULT_CONFIG,
    width: 16,
    height: 16,
    founders: 4,
    sourceCount: 1,
  });
  observeSpatial(world);
  const saved = JSON.parse(checkpointToJson(world, "test", saveObservation(world)));
  delete saved.observation.spatial.regions[0].foodA;
  expect(() => restoreWorld(JSON.stringify(saved))).toThrow("observation number");
});

const record = (id: number, reason: RecoveryMetadata["reason"]): RecoveryMetadata => ({
  id: String(id),
  runId: "one",
  tick: id * 10,
  seed: 101,
  createdAt: id,
  reason,
  bytes: 100,
  rawBytes: 1000,
});
it("retains the latest six automatic and two manual checkpoints without mutating the input", () => {
  const records = Array.from({ length: 10 }, (_, i) => record(i, "automatic"));
  records.push(record(10, "manual"), record(11, "manual"), record(12, "manual"));
  expect([...retainedRecoveries(records)].sort()).toEqual([
    "11",
    "12",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ]);
  expect(records).toHaveLength(13);
  expect(() =>
    retainedRecoveries([{ ...record(13, "automatic"), bytes: RECOVERY_BYTES + 1 }])
  ).toThrow("budget");
});

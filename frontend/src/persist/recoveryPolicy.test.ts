import { expect, it } from "vitest";
import { RECOVERY_BYTES, retainedRecoveries, type RecoveryMetadata } from "./recoveryPolicy";

function record(tick: number, bytes: number, reason: "automatic" | "manual" = "automatic") {
  return {
    id: String(tick),
    runId: "run",
    tick,
    seed: 27,
    createdAt: tick,
    reason,
    bytes,
    rawBytes: 0,
  };
}

it("rotates large automatic saves within the byte budget instead of rejecting the next save", () => {
  let records: RecoveryMetadata[] = [];
  for (let tick = 1; tick <= 12; tick++) {
    records.push(record(tick, 55_419_868));
    const keep = retainedRecoveries(records);
    records = records.filter((r) => keep.has(r.id));
    expect(keep.has(String(tick))).toBe(true);
    expect(records.reduce((sum, r) => sum + r.bytes, 0)).toBeLessThanOrEqual(RECOVERY_BYTES);
  }
  expect(records.map((r) => r.tick)).toEqual([9, 10, 11, 12]);
});

it("prioritizes the newest save and manual points while expiring automatic history", () => {
  const records = Array.from({ length: 8 }, (_, i) =>
    record(i, 60 * 1024 * 1024, i < 2 ? "manual" : "automatic")
  );
  expect(retainedRecoveries(records)).toEqual(new Set(["7", "1", "0", "6"]));
});

it("expires old manual points when necessary to preserve the newest automatic recovery", () => {
  const records = [record(1, 100_000_000, "manual"), record(2, 100_000_000, "manual")];
  records.push(record(3, 180_000_000));
  expect(retainedRecoveries(records)).toEqual(new Set(["3"]));
});

it("accepts an exact budget fit and rejects a newest save that cannot fit by itself", () => {
  expect(retainedRecoveries([])).toEqual(new Set());
  expect(retainedRecoveries([record(1, 1), record(2, RECOVERY_BYTES)])).toEqual(new Set(["2"]));
  expect(() => retainedRecoveries([record(1, 1), record(2, RECOVERY_BYTES + 1)])).toThrow(
    "Newest recovery exceeds"
  );
});

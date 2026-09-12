import { expect, it } from "vitest";
import { createWorld, stepWorld } from "../sim/world";
import { DEFAULT_CONFIG } from "../sim/config";
import { foodEpoch } from "../sim/foodEpochs";
import { newDeposit } from "../sim/deposits";
import { balance, materialBalance } from "../sim/accounting";
import { checkpointToJson, restoreWorld } from "./checkpoint";

const small = {
  ...DEFAULT_CONFIG,
  width: 16,
  height: 16,
  founders: 2,
  sourceCount: 2,
  sourceLifetime: 1,
  sourceGap: 1,
  foodEpochs: undefined,
  foodZones: undefined,
};
const schedule = { phaseTicks: 15, shares: [0.8, 0.2] };

it("owns its food schedule independently of the caller's configuration", () => {
  const foodEpochs = { phaseTicks: 15, shares: [0.8, 0.2] };
  const world = createWorld(5, { ...small, foodEpochs });
  foodEpochs.shares[0] = 0.1;
  expect(world.config.foodEpochs?.shares).toEqual([0.8, 0.2]);
});
it("changes newly arriving composition while preserving supply geometry and inventory", () => {
  const a = createWorld(5, { ...small, foodEpochs: schedule }),
    b = createWorld(5, small);
  for (const tick of [0, 14, 15, 29, 30]) {
    a.tick = tick;
    b.tick = tick;
    const old = structuredClone(a.sources);
    const left = newDeposit(a),
      right = newDeposit(b);
    expect(left.foodA / (left.foodA + left.foodB)).toBeCloseTo(foodEpoch(schedule, tick).share, 14);
    expect(left.foodA + left.foodB).toBeCloseTo(right.foodA + right.foodB, 12);
    expect({ ...left, foodA: 0, foodB: 0 }).toEqual({ ...right, foodA: 0, foodB: 0 });
    expect(a.environmentRng).toEqual(b.environmentRng);
    expect(a.sources).toEqual(old);
  }
});
it("places deposit slots across bands with band composition, keeping inventory and draws", () => {
  const zones = { shares: [0.9, 0.1] };
  const a = createWorld(5, { ...small, foodZones: zones }),
    b = createWorld(5, small);
  for (let i = 0; i < 12; i++) {
    const left = newDeposit(a, i),
      right = newDeposit(b, i);
    const band = i % 2;
    expect(Math.floor(left.x / (small.width / 2))).toBe(band);
    expect(left.foodA / (left.foodA + left.foodB)).toBeCloseTo(zones.shares[band], 14);
    expect(left.foodA + left.foodB).toBeCloseTo(right.foodA + right.foodB, 12);
    expect({ ...left, x: 0, foodA: 0, foodB: 0 }).toEqual({ ...right, x: 0, foodA: 0, foodB: 0 });
    expect(a.environmentRng).toEqual(b.environmentRng);
  }
  expect(() => createWorld(1, { ...small, foodZones: zones, foodEpochs: schedule })).toThrow(
    "alternatives"
  );
  expect(() => createWorld(1, { ...small, foodZones: { shares: [0.5] } })).toThrow("Food zone");
});
it.each([
  { foodEpochs: undefined },
  { foodEpochs: schedule },
  { foodZones: { shares: [0.9, 0.1] } },
])("preserves scheduled, zoned or unscheduled continuation and budgets", (layout) => {
  {
    const a = createWorld(6, { ...small, ...layout });
    for (let i = 0; i < 14; i++) stepWorld(a);
    const b = restoreWorld(checkpointToJson(a));
    expect(b.config.foodEpochs).toEqual(a.config.foodEpochs);
    expect(b.config.foodZones).toEqual(a.config.foodZones);
    for (let i = 0; i < 46; i++) {
      stepWorld(a);
      stepWorld(b);
    }
    expect(checkpointToJson(a)).toBe(checkpointToJson(b));
    expect(Math.abs(balance(a))).toBeLessThan(1e-8);
    expect(Math.abs(materialBalance(a))).toBeLessThan(1e-8);
  }
});
it.each([
  { phaseTicks: 0, shares: [0.8] },
  { phaseTicks: 1.5, shares: [0.8] },
  { phaseTicks: 10, shares: [] },
  { phaseTicks: 10, shares: [1.1] },
  { phaseTicks: 10, shares: [NaN] },
])("rejects an invalid persisted food schedule", (foodEpochs) => {
  expect(() => createWorld(1, { ...small, foodEpochs })).toThrow("Food epoch");
});

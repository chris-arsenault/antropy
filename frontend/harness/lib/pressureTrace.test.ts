import { expect, it } from "vitest";
import { constructionFixture } from "../../src/sim/construction/fixture";
import { stepWorld } from "../../src/sim/world";
import { encodeCheckpoint, decodeCheckpoint } from "../../src/persist/checkpoint";
import { attachPressureTrace } from "./pressureTrace";
import { FORAGER_CONFIG } from "../../src/sim/config";

it("observes actual decisions without changing the persisted trajectory", () => {
  const { world } = constructionFixture("colony-programmed", 1, {
    environment: {
      ...FORAGER_CONFIG.environment,
      autonomousConstruction: true,
      microclimate: true,
    },
  });
  const control = decodeCheckpoint(encodeCheckpoint(world));
  const trace = attachPressureTrace(world);
  for (let i = 0; i < 4; i++) {
    stepWorld(world);
    stepWorld(control);
  }
  // One worker and the queen each receive a controller turn.
  expect(trace.decisions()).toBe(8);
  expect(trace.sampled.decisions).toBe(2);
  expect(trace.sampled["dig:enumerated"]).toBe(2);
  const actual = JSON.parse(encodeCheckpoint(world)) as Record<string, unknown>;
  const expected = JSON.parse(encodeCheckpoint(control)) as Record<string, unknown>;
  for (const key of Object.keys(actual)) expect(actual[key], key).toEqual(expected[key]);
  trace.detach();
  stepWorld(world);
  expect(trace.decisions()).toBe(8);
});

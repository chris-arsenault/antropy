import { expect, it } from "vitest";
import { loadColonyModel } from "./colonyArtifacts";
import { outcomeMutation, outcomeSeed } from "./colonySearch";
import {
  createDirectionalState,
  directionalLogits,
} from "../../src/sim/controller/directionalNetwork";
import { validateDirectionalModel } from "../../src/sim/controller/directionalModel";

it("initializes the carrying-preserving shape without changing archived recurrent inference", () => {
  const archived = loadColonyModel("harness/artifacts/directional-2026-09-07/final-history.json");
  if (archived.version === 1 || archived.version === 5)
    throw new Error("directional fixture expected");
  const model = outcomeSeed(archived);
  const oldState = createDirectionalState(archived),
    state = createDirectionalState(model);
  for (let tick = 0; tick < 8; tick++) {
    const inputs = Float32Array.from(
      { length: model.inputs },
      (_, index) => ((index + tick) % 7) / 7
    );
    inputs[20] = tick % 2;
    expect(directionalLogits(model, inputs, state)).toEqual(
      directionalLogits(archived, inputs, oldState)
    );
    expect(state).toEqual(oldState);
  }
  const changed = outcomeMutation(model, 17, 1, 1);
  expect(validateDirectionalModel(changed)).toBe(changed);
  expect(changed.recurrence.weight).not.toEqual(model.recurrence.weight);
  expect(outcomeMutation(model, 17, 1, 1)).toEqual(changed);
});

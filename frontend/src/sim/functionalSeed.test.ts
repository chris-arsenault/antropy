import { describe, expect, it } from "vitest";
import { ACTION_THRESHOLD, Input, INPUT_COUNT, Output } from "./controller/contract";
import { functionalSeedVector, rnnController } from "./controller/rnn";

function act(stimuli: Partial<Record<number, number>>): Float32Array {
  const genome = rnnController.deserializeGenome(functionalSeedVector());
  const state = rnnController.createState();
  const inputs = new Float32Array(INPUT_COUNT);
  inputs[Input.BIAS] = 1;
  for (const [index, value] of Object.entries(stimuli)) {
    inputs[Number(index)] = value as number;
  }
  const outputs = rnnController.act(genome, inputs, state).outputs;
  return Float32Array.from(outputs);
}

const MARKED = {
  [Input.PHEROMONE_A_LEFT]: 0.5,
  [Input.PHEROMONE_A_RIGHT]: 0.5,
};
const HOT_MARKED = { ...MARKED, [Input.TEMPERATURE]: 0.5 };

describe("functional seed cargo selection (Appendix D step 12)", () => {
  it("picks up contacted eggs and food without depending on a construction mark", () => {
    for (const contact of [Input.CONTACT_EGG, Input.CONTACT_FOOD]) {
      const pickup = act({ ...HOT_MARKED, [contact]: 1 });
      const unmarkedPickup = act({ [Input.TEMPERATURE]: 0.5, [contact]: 1 });
      expect(pickup[Output.DIG], "marked contact fires shared DIG").toBeGreaterThan(
        ACTION_THRESHOLD
      );
      expect(pickup[Output.FORWARD], "pickup arrests forward movement").toBeLessThan(0);
      expect(pickup[Output.EAT], "contacted cargo is handled rather than eaten").toBeLessThan(0);
      expect(pickup[Output.VERTICAL_BIAS], "pickup targets the faced voxel").toBeGreaterThan(-0.33);
      expect(pickup[Output.VERTICAL_BIAS], "pickup stays out of the upward band").toBeLessThan(
        0.33
      );
      expect(
        unmarkedPickup[Output.DIG],
        "contact pickup is independent of the construction route"
      ).toBeGreaterThan(ACTION_THRESHOLD);
    }
  });

  it("drives eggs and food down while spoil retains the inherited upward haul", () => {
    const egg = act({ ...HOT_MARKED, [Input.CARRY_LOAD]: 1 });
    const food = act({
      ...HOT_MARKED,
      [Input.CARRY_LOAD]: 0.5,
      [Input.CARRIED_MATERIAL]: 0.5,
    });
    const topsoil = act({
      ...HOT_MARKED,
      [Input.CARRY_LOAD]: 1,
      [Input.CARRIED_MATERIAL]: 0.125,
    });
    const clay = act({
      ...HOT_MARKED,
      [Input.CARRY_LOAD]: 1,
      [Input.CARRIED_MATERIAL]: 0.25,
    });
    const looseFill = act({
      ...HOT_MARKED,
      [Input.CARRY_LOAD]: 1,
      [Input.CARRIED_MATERIAL]: 0.625,
    });

    expect(egg[Output.VERTICAL_BIAS], "egg descends").toBeLessThan(-0.33);
    expect(food[Output.VERTICAL_BIAS], "food descends").toBeLessThan(-0.33);
    expect(topsoil[Output.VERTICAL_BIAS], "topsoil ascends").toBeGreaterThan(0.33);
    expect(clay[Output.VERTICAL_BIAS], "clay ascends").toBeGreaterThan(0.33);
    expect(looseFill[Output.VERTICAL_BIAS], "loose fill ascends").toBeGreaterThan(0.33);
    expect(egg[Output.DIG], "egg stays loaded on marked route").toBeLessThanOrEqual(
      ACTION_THRESHOLD
    );
    expect(egg[Output.EAT], "loaded mandibles do not eat another item").toBeLessThan(0);
    expect(food[Output.DIG], "food stays loaded on marked route").toBeLessThanOrEqual(
      ACTION_THRESHOLD
    );
  });
});

describe("functional seed cargo release (Appendix D step 12)", () => {
  it("uses the inherited low-A dump reflex to place food under live climate", () => {
    const food = act({
      [Input.TEMPERATURE]: 0.5,
      [Input.CARRY_LOAD]: 0.5,
      [Input.CARRIED_MATERIAL]: 0.5,
    });

    expect(food[Output.DIG], "food putdown").toBeGreaterThan(ACTION_THRESHOLD);
    expect(food[Output.VERTICAL_BIAS], "food remains down-biased").toBeLessThan(-0.33);
  });

  it("puts payloads down at safe temperature without re-picking grounded cargo", () => {
    const safe = { ...MARKED, [Input.TEMPERATURE]: 0.1 };
    const hot = { ...MARKED, [Input.TEMPERATURE]: 0.5 };
    const safeEgg = act({ ...safe, [Input.CARRY_LOAD]: 1 });
    const hotEgg = act({ ...hot, [Input.CARRY_LOAD]: 1 });
    const groundedEgg = act({ ...safe, [Input.CONTACT_EGG]: 1 });
    const loadedAtEgg = act({
      ...HOT_MARKED,
      [Input.CONTACT_EGG]: 1,
      [Input.CARRY_LOAD]: 1,
    });

    expect(safeEgg[Output.DIG], "safe egg is placed").toBeGreaterThan(ACTION_THRESHOLD);
    expect(hotEgg[Output.DIG], "hot egg remains carried").toBeLessThanOrEqual(ACTION_THRESHOLD);
    expect(groundedEgg[Output.DIG], "safe grounded egg is left in place").toBeLessThanOrEqual(
      ACTION_THRESHOLD
    );
    expect(loadedAtEgg[Output.DIG], "loaded carrier ignores another egg").toBeLessThanOrEqual(
      ACTION_THRESHOLD
    );
  });
});

import { describe, expect, it } from "vitest";
import { Input, Output } from "../controller/contract";
import { createInputBuffer } from "../senses";
import { colonyLoopOracle, colonyLoopReturnThreshold } from "./colonyLoop";

function act(inputs: Float32Array): Float32Array {
  return colonyLoopOracle.act(inputs);
}

describe("colony-loop worker priorities", () => {
  it("returns carried food instead of eating contacted food", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.ENERGY] = 0.1;
    inputs[Input.CONTACT_FOOD] = 1;
    inputs[Input.NEST_SCENT_RIGHT] = 0.8;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeLessThan(0);
    expect(outputs[Output.EAT]).toBe(0);
    expect(outputs[Output.DIG]).toBe(0);
  });

  it("deposits carried food after reaching marked underground nest", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.DEPTH] = 0.5;

    const outputs = act(inputs);

    expect(outputs[Output.DIG]).toBe(1);
    expect(outputs[Output.FORWARD]).toBe(0);
  });

  it("eats contacted food when hungry", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 0.2;
    inputs[Input.CONTACT_FOOD] = 1;

    const outputs = act(inputs);

    expect(outputs[Output.EAT]).toBe(1);
    expect(outputs[Output.DIG]).toBe(0);
  });

  it("picks up contacted wild food when fed", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.CONTACT_FOOD] = 1;

    const outputs = act(inputs);

    expect(outputs[Output.EAT]).toBe(0);
    expect(outputs[Output.DIG]).toBe(1);
  });

  it("leaves contacted stored food alone when fed", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.CONTACT_FOOD] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.DEPTH] = 0.1;
    inputs[Input.FOOD_SCENT_RIGHT] = 0.5;

    const outputs = act(inputs);

    expect(outputs[Output.EAT]).toBe(0);
    expect(outputs[Output.DIG]).toBe(0);
  });
});

describe("colony-loop food identity", () => {
  function foodChoice(): Float32Array {
    const inputs = createInputBuffer();
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.DEPTH] = 0.1;
    inputs[Input.FOOD_SCENT_LEFT] = 0.5;
    inputs[Input.COLONY_SCENT_LEFT] = 0.8;
    inputs[Input.FOOD_SCENT_RIGHT] = 0.6;
    inputs[Input.COLONY_SCENT_RIGHT] = 0.1;
    return inputs;
  }

  it("hungry workers inside follow food carrying colony odor", () => {
    const inputs = foodChoice();
    inputs[Input.ENERGY] = 0.2;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeGreaterThan(0);
  });

  it("fed workers inside follow the authored entrance trail", () => {
    const inputs = foodChoice();
    inputs[Input.ENERGY] = 1;
    inputs[Input.PHEROMONE_A_LEFT] = 0.2;
    inputs[Input.PHEROMONE_A_RIGHT] = 0.8;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeLessThan(0);
  });

  it("sends a hungry worker outward when the nest has no stored food", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 0.1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.DEPTH] = 0.1;
    inputs[Input.NEST_SCENT_CENTER] = 0.2;
    inputs[Input.NEST_SCENT_LEFT] = 0.8;
    inputs[Input.NEST_SCENT_RIGHT] = 0.8;
    inputs[Input.PHEROMONE_A_LEFT] = 0.8;
    inputs[Input.PHEROMONE_A_RIGHT] = 0.2;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBeGreaterThan(0);
  });

  it("switches to wild-food search after crossing the local surface", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.PHEROMONE_A_LEFT] = 0.8;
    inputs[Input.FOOD_SCENT_RIGHT] = 0.8;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeLessThan(0);
    expect(outputs[Output.FORWARD]).toBeGreaterThan(0);
  });
});

describe("colony-loop scentless search", () => {
  it("explores straight under per-ant jitter when no target signal exists", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = colonyLoopReturnThreshold() + 0.01;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(1);
  });

  it("derives an equal-cost return threshold at half a tank", () => {
    expect(colonyLoopReturnThreshold()).toBe(0.5);
  });

  it("homes on existing nest odor when scentless search reaches its return reserve", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = colonyLoopReturnThreshold();
    inputs[Input.NEST_SCENT_LEFT] = 0.2;
    inputs[Input.NEST_SCENT_RIGHT] = 0.8;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeLessThan(0);
    expect(outputs[Output.FORWARD]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBeLessThan(1);
  });
});

describe("colony-loop local navigation", () => {
  it.each([
    ["down", Input.NEST_SCENT_DOWN, -1],
    ["level", Input.NEST_SCENT_LEFT, 0],
    ["up", Input.NEST_SCENT_UP, 1],
  ])("selects the strongest %s band in one sensor frame", (_, channel, expected) => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[channel] = 0.4;

    expect(act(inputs)[Output.VERTICAL_BIAS]).toBe(expected);
  });

  it("samples the vertical band while following the entrance trail", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.DEPTH] = 0.1;
    inputs[Input.PHEROMONE_A_UP] = 0.4;

    const outputs = act(inputs);

    expect(outputs[Output.FORWARD]).toBe(1);
    expect(outputs[Output.VERTICAL_BIAS]).toBe(1);
  });

  it("leaves obstacle deflection to the shared locomotion resolver", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.FACING_SLOPE] = 1;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(1);
  });

  it("does not add a controller-side wall mode", () => {
    const blocked = createInputBuffer();
    blocked[Input.ENERGY] = 1;
    blocked[Input.FACING_SLOPE] = 1;

    const first = Float32Array.from(act(blocked));
    const clear = createInputBuffer();
    clear[Input.ENERGY] = 1;
    const second = act(clear);

    expect(first[Output.TURN]).toBe(0);
    expect(first[Output.FORWARD]).toBe(1);
    expect(second[Output.TURN]).toBe(0);
    expect(second[Output.FORWARD]).toBe(1);
  });
});

describe("colony-loop target approach", () => {
  it("crosses an open local nest-scent maximum without descending its weaker band", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.6;
    inputs[Input.NEST_SCENT_DOWN] = 0.4;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(1);
    expect(outputs[Output.VERTICAL_BIAS]).toBe(0);
  });

  it("makes a tight turn when a center-dominant nest reading recedes", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.6;
    inputs[Input.NEST_SCENT_CENTER_CHANGE] = -0.1;
    inputs[Input.NEST_SCENT_LEFT] = 0.4;
    inputs[Input.NEST_SCENT_RIGHT] = 0.4;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBeCloseTo(0.2);
  });

  it("keeps probing forward while a center-dominant nest reading rises", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.6;
    inputs[Input.NEST_SCENT_CENTER_CHANGE] = 0.1;
    inputs[Input.NEST_SCENT_LEFT] = 0.4;
    inputs[Input.NEST_SCENT_RIGHT] = 0.4;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(1);
  });
});

describe("colony-loop steering", () => {
  it("estimates a full local bearing from center and flank samples", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.4;
    inputs[Input.NEST_SCENT_LEFT] = 0.5;
    inputs[Input.NEST_SCENT_RIGHT] = 0.7;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeLessThan(0);
    expect(outputs[Output.TURN]).toBeGreaterThan(-1);
    expect(outputs[Output.FORWARD]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBeLessThan(1);
  });

  it("makes a tight turn when a centered homing signal recedes", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.6;
    inputs[Input.NEST_SCENT_LEFT] = 0.4;
    inputs[Input.NEST_SCENT_RIGHT] = 0.4;
    inputs[Input.NEST_SCENT_CENTER_CHANGE] = -0.1;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBeCloseTo(0.2);
  });

  it("turns toward a directional sample even when the former heading is blocked", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.FACING_SLOPE] = 1;
    inputs[Input.NEST_SCENT_LEFT] = 0.2;
    inputs[Input.NEST_SCENT_RIGHT] = 0.8;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeLessThan(0);
    expect(outputs[Output.FORWARD]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBeLessThan(1);
  });

  it("maps a directional sample to bounded proportional steering", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.NEST_SCENT_LEFT] = 0.1;
    inputs[Input.NEST_SCENT_RIGHT] = 0.8;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeLessThan(0);
    expect(outputs[Output.TURN]).toBeGreaterThan(-1);
    expect(outputs[Output.FORWARD]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBeLessThan(1);
  });

  it("returns the same action for the same frame regardless of prior calls", () => {
    const prior = createInputBuffer();
    prior[Input.CARRY_LOAD] = 1;
    prior[Input.NEST_SCENT_LEFT] = 0.8;
    colonyLoopOracle.act(prior);
    const current = createInputBuffer();
    current[Input.CARRY_LOAD] = 1;
    current[Input.NEST_SCENT_LEFT] = 0.2;
    current[Input.NEST_SCENT_RIGHT] = 0.8;

    const afterPrior = Float32Array.from(colonyLoopOracle.act(current));
    const repeated = colonyLoopOracle.act(current);

    expect(afterPrior).toEqual(repeated);
  });

  it("selects directly sampled vertical food without translating", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 0.2;
    inputs[Input.DEPTH] = 0.1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.COLONY_SCENT_UP] = 1;
    inputs[Input.FOOD_SCENT_CENTER] = 0.9;
    inputs[Input.FOOD_SCENT_UP] = 1;

    const outputs = act(inputs);

    expect(outputs[Output.FORWARD]).toBe(0);
    expect(outputs[Output.VERTICAL_BIAS]).toBe(1);
  });
});

describe("colony-loop casting", () => {
  it("turns locally when food is strongest at the body receptor", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.FOOD_SCENT_LEFT] = 0.4;
    inputs[Input.FOOD_SCENT_CENTER] = 0.6;
    inputs[Input.FOOD_SCENT_RIGHT] = 0.4;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBe(0);
  });

  it("casts once when a spatially centered target signal recedes", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.FOOD_SCENT_LEFT] = 0.5;
    inputs[Input.FOOD_SCENT_RIGHT] = 0.5;
    inputs[Input.FOOD_SCENT_CENTER] = 0.5;
    inputs[Input.FOOD_SCENT_CENTER_CHANGE] = -0.1;

    const outputs = act(inputs);

    expect(outputs[Output.TURN]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBe(0);
  });

  it("searches forward when a target signal disappears", () => {
    const lost = createInputBuffer();
    lost[Input.ENERGY] = 1;
    lost[Input.FOOD_SCENT_LEFT_CHANGE] = -0.5;
    const outputs = act(lost);

    expect(outputs[Output.TURN]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(1);
  });

  it("searches instead of casting when no phasic loss is present", () => {
    const lost = createInputBuffer();
    lost[Input.ENERGY] = 1;
    const outputs = act(lost);

    expect(outputs[Output.TURN]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(1);
  });

  it("uses no private policy state", () => {
    expect("createState" in colonyLoopOracle).toBe(false);
  });

  it("uses a broad moving turn for surface food instead of tracing a tight circle", () => {
    const lateral = createInputBuffer();
    lateral[Input.ENERGY] = 1;
    lateral[Input.FOOD_SCENT_LEFT] = 0.5;
    const turn = Float32Array.from(colonyLoopOracle.act(lateral));
    const forward = createInputBuffer();
    forward[Input.ENERGY] = 1;
    const step = colonyLoopOracle.act(forward);

    expect(turn[Output.TURN]).toBeGreaterThan(0);
    expect(turn[Output.TURN]).toBeLessThanOrEqual(0.25);
    expect(turn[Output.FORWARD]).toBeGreaterThan(0.5);
    expect(step[Output.TURN]).toBe(0);
    expect(step[Output.FORWARD]).toBe(1);
  });
});

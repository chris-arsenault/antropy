import { describe, expect, it } from "vitest";
import { Input, Output } from "../controller/contract";
import { createInputBuffer } from "../senses";
import { colonyLoopOracle } from "./colonyLoop";

describe("colony-loop oracle vertical taxis", () => {
  it.each([
    ["down", Input.NEST_SCENT_DOWN, -1],
    ["level", Input.NEST_SCENT_LEFT, 0],
    ["up", Input.NEST_SCENT_UP, 1],
  ])("selects the strongest %s band in one sensor frame", (_, channel, expected) => {
    const inputs = createInputBuffer();
    inputs[channel] = 0.4;
    inputs[Input.CARRY_LOAD] = 1;

    const outputs = colonyLoopOracle.act(inputs, colonyLoopOracle.createState());

    expect(outputs[Output.VERTICAL_BIAS]).toBe(expected);
  });

  it("defaults upward while establishing a blank-channel breadcrumb", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.NEST_SCENT_UP] = 0.5;
    inputs[Input.FACING_SLOPE] = -1;

    const outputs = colonyLoopOracle.act(inputs, colonyLoopOracle.createState());

    expect(outputs[Output.TURN]).toBeGreaterThan(0);
    expect(outputs[Output.FORWARD]).toBe(1);
    expect(outputs[Output.VERTICAL_BIAS]).toBe(1);
  });

  it("uses the lowest navigable nest-carrier band to move outward", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.5;
    inputs[Input.NEST_SCENT_DOWN] = 0.4;
    inputs[Input.PHEROMONE_B_CENTER] = 0.8;
    inputs[Input.PHEROMONE_B_DOWN] = 0.2;

    const outputs = colonyLoopOracle.act(inputs, colonyLoopOracle.createState());

    expect(outputs[Output.VERTICAL_BIAS]).toBe(-1);
  });

  it("takes a less-traveled open band before repeating its breadcrumb", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.4;
    inputs[Input.NEST_SCENT_DOWN] = 0.4005;
    inputs[Input.PHEROMONE_B_CENTER] = 0.8;
    inputs[Input.PHEROMONE_B_DOWN] = 0.2;

    const outputs = colonyLoopOracle.act(inputs, colonyLoopOracle.createState());

    expect(outputs[Output.VERTICAL_BIAS]).toBe(-1);
  });

  it("does not turn toward a zero-breadcrumb solid wall", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.5;
    inputs[Input.NEST_SCENT_LEFT] = 0.5;
    inputs[Input.PHEROMONE_B_LEFT] = 0.9;

    const outputs = colonyLoopOracle.act(inputs, colonyLoopOracle.createState());

    expect(outputs[Output.TURN]).toBeGreaterThan(0);
  });

  it("targets sensed air below when a loaded ant faces a wall at cache depth", () => {
    const inputs = createInputBuffer();
    inputs[Input.CARRY_LOAD] = 1;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.DEPTH] = 0.5;
    inputs[Input.FACING_SLOPE] = 1;
    inputs[Input.NEST_SCENT_DOWN] = 0.4;

    const outputs = colonyLoopOracle.act(inputs, colonyLoopOracle.createState());

    expect(outputs[Output.DIG]).toBe(1);
    expect(outputs[Output.VERTICAL_BIAS]).toBe(-1);
  });

  it("selects a directly sampled vertical food band without translating", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 0.2;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.FOOD_SCENT_UP] = 1;

    const outputs = colonyLoopOracle.act(inputs, colonyLoopOracle.createState());

    expect(outputs[Output.FORWARD]).toBe(0);
    expect(outputs[Output.VERTICAL_BIAS]).toBe(1);
  });

  it("marks and searches the least-visited open band when no cache plume is present", () => {
    const inputs = createInputBuffer();
    inputs[Input.ENERGY] = 0.2;
    inputs[Input.COLONY_SCENT_CENTER] = 1;
    inputs[Input.NEST_SCENT_CENTER] = 0.5;
    inputs[Input.NEST_SCENT_DOWN] = 0.5;
    inputs[Input.PHEROMONE_B_CENTER] = 0.8;
    inputs[Input.PHEROMONE_B_DOWN] = 0.1;

    const outputs = colonyLoopOracle.act(inputs, colonyLoopOracle.createState());

    expect(outputs[Output.VERTICAL_BIAS]).toBe(-1);
    expect(outputs[Output.PHEROMONE_B]).toBeGreaterThan(0);
  });
});

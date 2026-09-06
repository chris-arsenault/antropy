import { describe, expect, it } from "vitest";
import { Input, INPUT_COUNT, Output } from "../controller/contract";
import { sensorLimitedForager } from "./sensorLimitedForager";

function inputs(): Float32Array {
  return new Float32Array(INPUT_COUNT);
}

describe("stateless sensor-limited single forager", () => {
  it("returns the same action after unrelated calls", () => {
    const target = inputs();
    target[Input.FOOD_SCENT_CENTER] = 0.3;
    target[Input.FOOD_SCENT_LEFT] = 0.5;
    target[Input.FOOD_SCENT_RIGHT] = 0.2;
    const first = sensorLimitedForager.act(target);

    const unrelated = inputs();
    unrelated[Input.CARRY_LOAD] = 1;
    unrelated[Input.NEST_SCENT_RIGHT] = 0.8;
    sensorLimitedForager.act(unrelated);
    const second = sensorLimitedForager.act(target);

    expect(second).not.toBe(first);
    expect([...second]).toEqual([...first]);
  });

  it("keeps its heading on a balanced forward gradient", () => {
    const frame = inputs();
    frame[Input.FOOD_SCENT_CENTER] = 0.3;
    frame[Input.FOOD_SCENT_AHEAD] = 0.45;
    frame[Input.FOOD_SCENT_LEFT] = 0.45;
    frame[Input.FOOD_SCENT_RIGHT] = 0.45;

    const outputs = sensorLimitedForager.act(frame);

    expect(outputs[Output.TURN]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(1);
  });

  it("follows a one-voxel entrance trail directly ahead", () => {
    const frame = inputs();
    frame[Input.DEPTH] = 0.5;
    frame[Input.COLONY_SCENT_CENTER] = 0.8;
    frame[Input.PHEROMONE_A_CENTER] = 0.3;
    frame[Input.PHEROMONE_A_AHEAD] = 0.5;
    frame[Input.NEST_SCENT_CENTER] = 0.6;
    frame[Input.NEST_SCENT_AHEAD] = 0.5;

    const outputs = sensorLimitedForager.act(frame);

    expect(outputs[Output.TURN]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(1);
  });

  it("mirrors its turn when the antenna values are swapped", () => {
    const left = inputs();
    left[Input.FOOD_SCENT_CENTER] = 0.3;
    left[Input.FOOD_SCENT_LEFT] = 0.5;
    left[Input.FOOD_SCENT_RIGHT] = 0.2;
    const right = inputs();
    right[Input.FOOD_SCENT_CENTER] = 0.3;
    right[Input.FOOD_SCENT_LEFT] = 0.2;
    right[Input.FOOD_SCENT_RIGHT] = 0.5;

    const leftTurn = sensorLimitedForager.act(left)[Output.TURN];
    const rightTurn = sensorLimitedForager.act(right)[Output.TURN];

    expect(leftTurn).toBeGreaterThan(0);
    expect(rightTurn).toBe(-leftTurn);
  });
});

describe("sensor-limited nest behavior", () => {
  it("uses the nest entrance trail instead of stored food while underground", () => {
    const frame = inputs();
    frame[Input.DEPTH] = 0.5;
    frame[Input.COLONY_SCENT_CENTER] = 0.8;
    frame[Input.CONTACT_FOOD] = 1;
    frame[Input.PHEROMONE_A_CENTER] = 0.2;
    frame[Input.PHEROMONE_A_LEFT] = 0.4;
    frame[Input.NEST_SCENT_CENTER] = 0.6;
    frame[Input.NEST_SCENT_LEFT] = 0.5;

    const outputs = sensorLimitedForager.act(frame);

    expect(outputs[Output.DIG]).toBe(0);
    expect(outputs[Output.FORWARD]).toBe(0);
    expect(outputs[Output.TURN]).toBeGreaterThan(0);
  });

  it("does not step off a strong trail into its weak diffusion halo", () => {
    const frame = inputs();
    frame[Input.DEPTH] = 0.5;
    frame[Input.COLONY_SCENT_CENTER] = 0.8;
    frame[Input.PHEROMONE_A_CENTER] = 0.8;
    frame[Input.PHEROMONE_A_AHEAD] = 0.1;
    frame[Input.NEST_SCENT_CENTER] = 0.6;
    frame[Input.NEST_SCENT_AHEAD] = 0.5;

    const outputs = sensorLimitedForager.act(frame);

    expect(outputs[Output.FORWARD]).toBe(0);
    expect(outputs[Output.TURN]).toBeGreaterThan(0);
  });

  it("deposits a carried load at the physical nest-scent peak", () => {
    const frame = inputs();
    frame[Input.CARRY_LOAD] = 1;
    frame[Input.DEPTH] = 0.5;
    frame[Input.COLONY_SCENT_CENTER] = 0.8;
    frame[Input.NEST_SCENT_CENTER] = 0.99;
    frame[Input.NEST_SCENT_LEFT] = 0.97;
    frame[Input.NEST_SCENT_RIGHT] = 0.97;

    const outputs = sensorLimitedForager.act(frame);

    expect(outputs[Output.DIG]).toBe(1);
    expect(outputs[Output.FORWARD]).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { colonySeedVector, rnnController } from "./rnn";
import { Input, INPUT_COUNT, Output } from "./contract";

function act(entries: readonly (readonly [number, number])[]): Float32Array {
  const inputs = new Float32Array(INPUT_COUNT);
  inputs[Input.BIAS] = 1;
  for (const [index, value] of entries) inputs[index] = value;
  const genome = rnnController.deserializeGenome(colonySeedVector());
  return Float32Array.from(rnnController.act(genome, inputs, rnnController.createState()).outputs);
}

describe("Appendix E constructive seed", () => {
  it("turns toward the stronger food sample while unloaded", () => {
    const left = act([
      [Input.FOOD_SCENT_LEFT, 0.8],
      [Input.FOOD_SCENT_RIGHT, 0.2],
    ]);
    const right = act([
      [Input.FOOD_SCENT_LEFT, 0.2],
      [Input.FOOD_SCENT_RIGHT, 0.8],
    ]);
    expect(left[Output.TURN]).toBeGreaterThan(0.5);
    expect(right[Output.TURN]).toBeLessThan(-0.5);
  });

  it("gives loaded homing precedence over an opposing food gradient", () => {
    const outputs = act([
      [Input.CARRY_LOAD, 0.5],
      [Input.CARRIED_MATERIAL, 0.5],
      [Input.FOOD_SCENT_LEFT, 0.2],
      [Input.FOOD_SCENT_RIGHT, 0.8],
      [Input.NEST_SCENT_LEFT, 0.8],
      [Input.NEST_SCENT_RIGHT, 0.2],
    ]);
    expect(outputs[Output.TURN]).toBeGreaterThan(0.5);
  });

  it("steers an unloaded departing ant down the nest-scent gradient", () => {
    const outputs = act([
      [Input.NEST_SCENT_LEFT, 0.8],
      [Input.NEST_SCENT_RIGHT, 0.2],
    ]);
    expect(outputs[Output.TURN]).toBeLessThan(-0.5);
  });
});

describe("Appendix E cargo reflexes", () => {
  it("eats hungry contact and picks up sated contact", () => {
    const hungry = act([
      [Input.CONTACT_FOOD, 1],
      [Input.ENERGY, 0.2],
    ]);
    const sated = act([
      [Input.CONTACT_FOOD, 1],
      [Input.ENERGY, 0.9],
    ]);
    expect(hungry[Output.EAT]).toBeGreaterThan(0.5);
    expect(hungry[Output.DIG]).toBeLessThan(0.5);
    expect(sated[Output.EAT]).toBeLessThan(0.5);
    expect(sated[Output.DIG]).toBeGreaterThan(0.5);
  });

  it("maps slope sign into the shared vertical attention band", () => {
    expect(act([[Input.FACING_SLOPE, 1]])[Output.VERTICAL_BIAS]).toBeGreaterThan(0.33);
    expect(act([[Input.FACING_SLOPE, -1]])[Output.VERTICAL_BIAS]).toBeLessThan(-0.33);
  });

  it("resumes forward motion after loading beside food", () => {
    const outputs = act([
      [Input.CONTACT_FOOD, 1],
      [Input.CARRY_LOAD, 0.5],
      [Input.CARRIED_MATERIAL, 0.5],
    ]);
    expect(outputs[Output.FORWARD]).toBeGreaterThan(0.5);
  });

  it("deposits a food load only after reacquiring strong nest scent", () => {
    const away = act([
      [Input.CARRIED_MATERIAL, 0.5],
      [Input.CARRY_LOAD, 0.5],
      [Input.NEST_SCENT_LEFT, 0.1],
      [Input.NEST_SCENT_RIGHT, 0.1],
      [Input.LOCAL_SOLIDITY, 0.1],
    ]);
    const home = act([
      [Input.CARRIED_MATERIAL, 0.5],
      [Input.CARRY_LOAD, 0.5],
      [Input.NEST_SCENT_LEFT, 0.8],
      [Input.NEST_SCENT_RIGHT, 0.8],
      [Input.LOCAL_SOLIDITY, 0.7],
    ]);
    expect(away[Output.DIG]).toBeLessThan(0.5);
    expect(home[Output.DIG]).toBeGreaterThan(0.5);
  });
});

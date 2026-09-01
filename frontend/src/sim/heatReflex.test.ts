import { describe, expect, it } from "vitest";
import { ACTION_THRESHOLD, Input, INPUT_COUNT } from "./controller/contract";
import { rnnController } from "./controller/rnn";
import { createRng } from "./rng";
import { Output } from "./controller/contract";

/**
 * Rung-3 assay for the heat-escape reflex (§B.9.1): a seeded controller
 * fed synthetic inputs digs downward under high TEMPERATURE and stays
 * quiet on the terrain channel in the cool. Deterministic: fixed seed,
 * direct act() calls, no world.
 */
function actWith(temperature: number) {
  const rng = createRng(3104);
  const genome = rnnController.seed(rng);
  const state = rnnController.createState();
  const inputs = new Float32Array(INPUT_COUNT);
  inputs[Input.BIAS] = 1;
  inputs[Input.ENERGY] = 0.7;
  inputs[Input.TEMPERATURE] = temperature;
  // Settle the recurrent state on constant input.
  let outputs = rnnController.act(genome, inputs, state).outputs;
  for (let i = 0; i < 5; i++) {
    outputs = rnnController.act(genome, inputs, state).outputs;
  }
  return outputs;
}

describe("heat-escape reflex assay (rung 3)", () => {
  it("digs downward under lethal-shoulder heat", () => {
    const hot = actWith(0.8);
    expect(hot[Output.DIG]).toBeGreaterThan(ACTION_THRESHOLD);
    expect(hot[Output.VERTICAL_BIAS]).toBeLessThan(-0.33);
  });

  it("keeps the terrain channel quiet in the cool", () => {
    const cool = actWith(0.05);
    expect(cool[Output.DIG]).toBeLessThan(ACTION_THRESHOLD);
    expect(cool[Output.VERTICAL_BIAS]).toBeGreaterThan(-0.33);
  });
});

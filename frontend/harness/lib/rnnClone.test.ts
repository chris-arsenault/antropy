import { describe, expect, it } from "vitest";
import { INPUT_COUNT, Output, OUTPUT_COUNT } from "../../src/sim/controller/contract";
import { GENOME_LENGTH, HIDDEN_COUNT, WEIGHT_COUNT } from "../../src/sim/controller/rnn";
import { createRng } from "../../src/sim/rng";
import { actionClassBalance, trainBehaviorClone, withInactiveOutputs } from "./rnnClone";

function sequence(): {
  inputs: Float32Array;
  outputs: Float32Array;
  phase: "abundance";
}[] {
  return Array.from({ length: 48 }, (_, tick) => {
    const inputs = new Float32Array(INPUT_COUNT);
    inputs[0] = tick % 8 < 4 ? 1 : -1;
    const outputs = new Float32Array(OUTPUT_COUNT);
    outputs[Output.TURN] = inputs[0] * 0.8;
    outputs[Output.FORWARD] = 0.7;
    return { inputs, outputs, phase: "abundance" };
  });
}

describe("full recurrent behavior cloning", () => {
  it("reduces sequence loss with behavioral parameter noise without modifying physical genes", () => {
    const trained = trainBehaviorClone(
      [sequence()],
      [sequence()],
      createRng(1),
      20,
      0.005,
      24,
      null,
      { earlyStopping: true, parameterNoise: 0.005 }
    );
    expect(trained.losses.at(-1)).toBeLessThan(trained.losses[0]);
    expect(trained.validationLoss).toBeLessThan(trained.validationLosses[0] * 0.25);
    expect(trained.validationLoss).toBe(Math.min(...trained.validationLosses));
    expect(trained.bestEpoch).toBeGreaterThanOrEqual(0);
    expect(trained.vector).toHaveLength(GENOME_LENGTH);
    expect(Array.from(trained.vector.slice(WEIGHT_COUNT))).toEqual(
      Array.from(new Float32Array(GENOME_LENGTH - WEIGHT_COUNT))
    );
  });

  it("gives an inactive continuous output a no-op margin without touching physical genes", () => {
    const initial = new Float32Array(GENOME_LENGTH).fill(1);
    const quiet = withInactiveOutputs(initial, [Output.PHEROMONE_A], 0.4);
    const outputRow =
      INPUT_COUNT * HIDDEN_COUNT +
      HIDDEN_COUNT * HIDDEN_COUNT +
      HIDDEN_COUNT +
      Output.PHEROMONE_A * HIDDEN_COUNT;
    const outputBias =
      outputRow + (OUTPUT_COUNT - Output.PHEROMONE_A) * HIDDEN_COUNT + Output.PHEROMONE_A;

    expect(Array.from(quiet.slice(outputRow, outputRow + HIDDEN_COUNT))).toEqual(
      new Array(HIDDEN_COUNT).fill(0)
    );
    expect(quiet[outputBias]).toBeCloseTo(-0.4);
    expect(Array.from(quiet.slice(WEIGHT_COUNT))).toEqual(Array.from(initial.slice(WEIGHT_COUNT)));
    expect(initial[outputBias]).toBe(1);
  });

  it("balances rare positive actuator labels against inactive frames", () => {
    const frames = sequence().slice(0, 4);
    frames[0].outputs[Output.DIG] = 1;

    const balance = actionClassBalance([frames]);

    expect(balance.actionPositiveCounts[Output.DIG]).toBe(1);
    expect(balance.actionPositiveWeights[Output.DIG]).toBe(3);
    expect(balance.actionPositiveCounts[Output.EAT]).toBe(0);
    expect(balance.actionPositiveWeights[Output.EAT]).toBe(1);
  });
});

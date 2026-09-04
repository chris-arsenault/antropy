import { describe, expect, it } from "vitest";
import { INPUT_COUNT, Output, OUTPUT_COUNT } from "../../src/sim/controller/contract";
import { GENOME_LENGTH, HIDDEN_COUNT, WEIGHT_COUNT } from "../../src/sim/controller/rnn";
import { createRng } from "../../src/sim/rng";
import { type SensorFrame } from "../experiments/colonyLoop";
import { balancedFramesForEpoch, frameClass, trainFrameDistillation } from "./rnnFrameClone";

function frame(input: number, vertical = 0, dig = 0): SensorFrame {
  const inputs = new Float32Array(INPUT_COUNT);
  inputs[0] = input;
  const outputs = new Float32Array(OUTPUT_COUNT);
  outputs[Output.TURN] = input * 0.8;
  outputs[Output.FORWARD] = 0.7;
  outputs[Output.VERTICAL_BIAS] = vertical;
  outputs[Output.DIG] = dig;
  return { inputs, outputs, phase: "abundance" };
}

function mappingFrames(): SensorFrame[] {
  return Array.from({ length: 48 }, (_, index) => frame(index % 2 === 0 ? -1 : 1));
}

describe("stateless frame distillation", () => {
  it("samples output regimes equally instead of weighting them by trajectory length", () => {
    const common = frame(1);
    const rare = frame(-1, 1, 1);
    const source = [[...new Array<SensorFrame>(9).fill(common), rare]];
    const balanced = balancedFramesForEpoch(source, createRng(4));
    const sampledCounts = new Map<string, number>();
    for (const sampled of balanced.frames) {
      const key = frameClass(sampled);
      sampledCounts.set(key, (sampledCounts.get(key) ?? 0) + 1);
    }

    expect(Object.values(balanced.classCounts).sort((a, b) => a - b)).toEqual([1, 9]);
    expect([...sampledCounts.values()]).toEqual([5, 5]);
  });

  it("learns reproducibly while leaving recurrence and physical genes untouched", () => {
    const settings = { epochs: 40, rate: 0.01, batchSize: 8 };
    const training = [mappingFrames()];
    const first = trainFrameDistillation(training, training, createRng(7), settings);
    const second = trainFrameDistillation(training, training, createRng(7), settings);
    const recurrentStart = INPUT_COUNT * HIDDEN_COUNT;
    const recurrentEnd = recurrentStart + HIDDEN_COUNT * HIDDEN_COUNT;

    expect(first.losses.at(-1)).toBeLessThan(first.losses[0]);
    expect(first.validationLoss).toBeLessThan(0.02);
    expect(first.vector).toEqual(second.vector);
    expect(Array.from(first.vector.slice(recurrentStart, recurrentEnd))).toEqual(
      new Array(HIDDEN_COUNT * HIDDEN_COUNT).fill(0)
    );
    expect(first.recurrentWeightNorm).toBe(0);
    expect(first.vector).toHaveLength(GENOME_LENGTH);
    expect(Array.from(first.vector.slice(WEIGHT_COUNT))).toEqual(
      new Array(GENOME_LENGTH - WEIGHT_COUNT).fill(0)
    );
  });
});

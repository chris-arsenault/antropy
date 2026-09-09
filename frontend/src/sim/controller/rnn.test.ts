import { describe, expect, it } from "vitest";
import { decodeRnnOutputs, RNN_OUTPUT_COUNT, RnnOutput } from "./rnn";
import { IDLE_ACTION } from "./contract";

describe("RNN motor decoding", () => {
  it("selects exactly one strongest motor while preserving chemical outputs", () => {
    const outputs = new Float32Array(RNN_OUTPUT_COUNT).fill(-0.8);
    outputs[RnnOutput.TURN_LEFT] = 0.2;
    outputs[RnnOutput.MOVE] = 0.7;
    outputs[RnnOutput.MANDIBLE] = 0.4;
    outputs[RnnOutput.PHEROMONE_A] = 0.25;
    outputs[RnnOutput.PHEROMONE_B] = -0.1;

    expect(decodeRnnOutputs(outputs)).toEqual({
      ...IDLE_ACTION,
      turn: 0,
      move: true,
      mandible: false,
      pheromoneA: 0.25,
      pheromoneB: 0,
    });
  });

  it("keeps idle as an evolvable motor choice", () => {
    const outputs = new Float32Array(RNN_OUTPUT_COUNT).fill(-0.8);
    outputs[RnnOutput.IDLE] = 0.9;

    expect(decodeRnnOutputs(outputs)).toMatchObject({
      turn: 0,
      move: false,
      mandible: false,
    });
  });
});

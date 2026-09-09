import { describe, expect, it } from "vitest";
import { createWorld } from "../world";
import { PROGRAMMED_LIFECYCLE_CONFIG } from "../config";
import { senseColony } from "../colonySensors";
import {
  COLONY_INPUT_COUNT,
  colonyMotor,
  decodeColonyOutputs,
  encodeColonyFrame,
} from "./colonyEncoding";
import { colonyLogits, type ColonyModel, validateColonyModel } from "./colonyNetwork";

function model(): ColonyModel {
  return {
    version: 1,
    inputs: COLONY_INPUT_COUNT,
    hidden: 2,
    recurrent: true,
    inputWeight: new Array<number>(COLONY_INPUT_COUNT * 2).fill(0),
    hiddenBias: [0.2, -0.1],
    recurrentWeight: [0.5, 0, 0, 0.5],
    decisionWeight: [1, 0, 0, 1],
    decisionBias: [0, 0],
    outputWeight: new Array<number>(20).fill(0.1),
    outputBias: new Array<number>(10).fill(0),
  };
}

describe("colony learned-controller boundary", () => {
  it("encodes only a finite copy of the local sensor frame", () => {
    const left = createWorld(9, "programmed-lifecycle", PROGRAMMED_LIFECYCLE_CONFIG, false);
    const frame = senseColony(left, left.ant);
    const original = structuredClone(frame);
    const encoded = encodeColonyFrame(frame);
    expect(encoded.length).toBe(COLONY_INPUT_COUNT);
    expect([...encoded].every(Number.isFinite)).toBe(true);
    expect(frame).toEqual(original);
  });

  it("arbitrates every physical motor without a teacher fallback", () => {
    for (let motor = 0; motor < 8; motor++) {
      const outputs = new Float32Array(10);
      outputs[motor] = 5;
      expect(colonyMotor(decodeColonyOutputs(outputs))).toBe(motor);
    }
  });

  it("keeps recurrent state individual and allows an exact zero-memory ablation", () => {
    const genome = validateColonyModel(model());
    const inputs = new Float32Array(COLONY_INPUT_COUNT);
    const first = new Float32Array(2),
      second = new Float32Array(2);
    const initial = colonyLogits(genome, inputs, first);
    expect(colonyLogits(genome, inputs, first)).not.toEqual(initial);
    expect(colonyLogits(genome, inputs, second)).toEqual(initial);
    const stateless = { ...genome, recurrent: false };
    expect(colonyLogits(stateless, inputs, first)).toEqual(colonyLogits(stateless, inputs, second));
    expect(() => validateColonyModel({ ...genome, inputWeight: [] })).toThrow(
      "invalid colony weights"
    );
  });
});

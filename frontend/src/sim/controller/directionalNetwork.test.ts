import { describe, expect, it } from "vitest";
import { DIRECTION_GLOBALS, directionSamples, rememberMotor } from "./directionalEncoding";
import { Input } from "./contract";
import { validateDirectionalModel, type DirectionalModel } from "./directionalModel";
import { createDirectionalState, directionalLogits } from "./directionalNetwork";
import { COLONY_OBSERVATION_CONTRACT } from "./colonyObservation";

function model(): DirectionalModel {
  const layer = (rows: number, cols: number) => ({
    weight: new Array<number>(rows * cols).fill(0.1),
    bias: new Array<number>(rows).fill(0),
  });
  return {
    version: 2,
    inputs: 143,
    hidden: 2,
    embedding: 2,
    history: 4,
    recurrent: true,
    encoder: layer(2, 16),
    context: layer(2, 57),
    recurrence: layer(2, 2),
    scorer: layer(2, 4),
    direction: layer(1, 2),
    care: layer(7, 2),
    motorBias: [0, 0, 0],
  };
}

describe("shared directional controller", () => {
  it("routes the carrying bit into the version 4 recurrent context", () => {
    const old = model(),
      width = 8 * old.embedding + 10 + old.history * 8;
    const weight = new Array<number>(old.hidden * width).fill(0);
    weight[8 * old.embedding + DIRECTION_GLOBALS.indexOf(Input.CARRYING)] = 1;
    const genome = validateDirectionalModel({
      ...old,
      version: 4,
      globalInputs: DIRECTION_GLOBALS,
      observationContract: COLONY_OBSERVATION_CONTRACT,
      context: { weight, bias: [0, 0] },
      scorer: { weight: new Array<number>(22).fill(0), bias: [0, 0] },
    });
    const x = new Float32Array(143),
      empty = createDirectionalState(genome),
      loaded = createDirectionalState(genome);
    directionalLogits(genome, x, empty);
    x[Input.CARRYING] = 1;
    directionalLogits(genome, x, loaded);
    expect(empty[0]).toBe(0);
    expect(loaded[0]).toBeCloseTo(Math.tanh(1));
    expect(() =>
      validateDirectionalModel({ ...genome, globalInputs: DIRECTION_GLOBALS.slice(0, 9) })
    ).toThrow("observation contract");
  });
});

describe("directional encoding and legacy inference", () => {
  it("retains sky light and individual signals in the declared global inputs", () => {
    expect(DIRECTION_GLOBALS.slice(4, 7)).toEqual([
      Input.SKY_LIGHT,
      Input.JITTER,
      Input.HANDEDNESS,
    ]);
    expect(DIRECTION_GLOBALS).not.toContain(Input.CONTACT_CACHE);
  });
  it("maps left/right receptors and masks unavailable rear odors", () => {
    const values = Float32Array.from({ length: 111 }, (_, i) => i);
    const samples = directionSamples(values);
    expect([...samples[1]]).toEqual([
      38, 39, 40, 41, 42, 74, 84, 5, 9, 13, 17, 92, 97, 102, 107, 1,
    ]);
    expect([...samples[7]].slice(7, 11)).toEqual([6, 10, 14, 18]);
    expect([...samples[4]].slice(7)).toEqual(new Array<number>(9).fill(0));
  });

  it("retains only four previous commands independently of other workers", () => {
    const a = new Float32Array(32),
      b = new Float32Array(32);
    for (const motor of [3, 1, 2, 5, 6]) rememberMotor(a, motor);
    expect([...a].flatMap((value, index) => (value ? [index] : []))).toEqual([6, 13, 18, 25]);
    expect([...b]).toEqual(new Array<number>(32).fill(0));
    rememberMotor(new Float32Array(0), 3);
  });

  it("shares directional scores and keeps state separate without altering history in logits", () => {
    const genome = validateDirectionalModel(model());
    const inputs = new Float32Array(143).fill(0.1);
    const first = createDirectionalState(genome),
      second = createDirectionalState(genome);
    rememberMotor(first.subarray(2), 1);
    const history = first.slice(2);
    const initial = directionalLogits(genome, inputs, first);
    expect(initial[1]).toBe(initial[2]);
    expect(initial[2]).toBe(initial[3]);
    expect(first.slice(2)).toEqual(history);
    expect(directionalLogits(genome, inputs, second)).toEqual(initial);
    expect(directionalLogits(genome, inputs, first)).not.toEqual(initial);
    expect(() => validateDirectionalModel({ ...genome, inputs: 111 })).toThrow("contract");
  });

  it("lets a lateral opening distinguish turns when all three immediate directions are blocked", () => {
    const old = model();
    const weights = new Array<number>(22).fill(0);
    weights[4] = 1;
    const genome = validateDirectionalModel({
      ...old,
      version: 3,
      scorer: { weight: weights, bias: [0, 0] },
    });
    const inputs = new Float32Array(143);
    inputs[33 + 2 * 5] = 1;
    const scores = directionalLogits(genome, inputs, createDirectionalState(genome));
    expect(scores[1]).toBeGreaterThan(scores[3]);
    expect(scores[1]).toBeGreaterThan(scores[2]);
  });
});

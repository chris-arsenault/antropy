import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { Input, INPUT_COUNT, Output } from "./contract";
import { rnnController, zeroGenome } from "./rnn";

function inputsWith(values: Partial<Record<number, number>>): Float32Array {
  const inputs = new Float32Array(INPUT_COUNT);
  inputs[Input.BIAS] = 1;
  for (const [index, value] of Object.entries(values)) {
    inputs[Number(index)] = value as number;
  }
  return inputs;
}

describe("rnnController", () => {
  it("is deterministic for identical genome, state, and inputs", () => {
    const rng = createRng(5);
    const genome = rnnController.seed(rng);
    const a = rnnController.act(genome, inputsWith({}), rnnController.createState());
    const b = rnnController.act(genome, inputsWith({}), rnnController.createState());
    expect(Array.from(a.outputs)).toEqual(Array.from(b.outputs));
    expect(a.thinkCost).toBeGreaterThan(0);
  });

  it("steers toward the stronger food-scent side from the seeded backbone", () => {
    const genome = rnnController.seed(createRng(11));
    const leftStronger = rnnController.act(
      genome,
      inputsWith({ [Input.FOOD_SCENT_LEFT]: 0.8, [Input.FOOD_SCENT_RIGHT]: 0.1 }),
      rnnController.createState()
    );
    const rightStronger = rnnController.act(
      genome,
      inputsWith({ [Input.FOOD_SCENT_LEFT]: 0.1, [Input.FOOD_SCENT_RIGHT]: 0.8 }),
      rnnController.createState()
    );
    expect(leftStronger.outputs[Output.TURN]).toBeGreaterThan(rightStronger.outputs[Output.TURN]);
  });

  it("drives forward and eats from the seeded biases", () => {
    const genome = rnnController.seed(createRng(12));
    const result = rnnController.act(genome, inputsWith({}), rnnController.createState());
    expect(result.outputs[Output.FORWARD]).toBeGreaterThan(0.3);
    expect(result.outputs[Output.EAT]).toBeGreaterThan(0.5);
  });

  it("carries memory in the recurrent state", () => {
    const genome = rnnController.seed(createRng(13));
    const state = rnnController.createState();
    const first = rnnController.act(genome, inputsWith({ [Input.FOOD_SCENT_LEFT]: 1 }), state);
    const second = rnnController.act(genome, inputsWith({}), state);
    const fresh = rnnController.act(genome, inputsWith({}), rnnController.createState());
    expect(Array.from(second.outputs)).not.toEqual(Array.from(fresh.outputs));
    expect(first.outputs.length).toBe(second.outputs.length);
  });
});

describe("rnn genome operations", () => {
  it("mutates genomes without touching the source", () => {
    const rng = createRng(21);
    const genome = rnnController.seed(rng);
    const before = rnnController.physical(genome);
    const child = rnnController.mutate(genome, 0.8, rng);
    expect(rnnController.physical(genome)).toEqual(before);
    expect(rnnController.physical(child)).not.toEqual(before);
  });

  it("recombines two parents into a child mixing both", () => {
    const rng = createRng(22);
    const a = rnnController.seed(rng);
    const b = rnnController.seed(rng);
    const child = rnnController.recombine(a, b, rng);
    expect(child).not.toBeNull();
    const traits = rnnController.physical(child as NonNullable<typeof child>);
    expect(traits.bodyScale).toBeGreaterThan(0.4);
    expect(traits.bodyScale).toBeLessThan(1.6);
  });

  it("expresses physical traits within their design ranges", () => {
    const rng = createRng(23);
    for (let i = 0; i < 20; i++) {
      const traits = rnnController.physical(rnnController.seed(rng));
      expect(traits.bodyScale).toBeGreaterThanOrEqual(0.5);
      expect(traits.bodyScale).toBeLessThanOrEqual(1.5);
      expect(traits.sensorGain).toBeGreaterThanOrEqual(0.25);
      expect(traits.mutationSigma).toBeGreaterThanOrEqual(0);
      expect(traits.mutationSigma).toBeLessThanOrEqual(1);
      expect(traits.lifespanTicks).toBeGreaterThan(0);
    }
  });

  it("keeps the zero genome inert", () => {
    const result = rnnController.act(zeroGenome(), inputsWith({}), rnnController.createState());
    expect(Array.from(result.outputs)).toEqual(new Array(result.outputs.length).fill(0));
  });
});

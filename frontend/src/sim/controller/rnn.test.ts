import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { Input, INPUT_COUNT, Output } from "./contract";
import { GENOME_LENGTH, HIDDEN_COUNT, rnnController, zeroGenome } from "./rnn";

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
    // act() results are transient (contract): snapshot before the next call.
    const a = Array.from(
      rnnController.act(genome, inputsWith({}), rnnController.createState()).outputs
    );
    const result = rnnController.act(genome, inputsWith({}), rnnController.createState());
    expect(a).toEqual(Array.from(result.outputs));
    expect(result.thinkCost).toBeGreaterThan(0);
  });

  it("steers toward the stronger food-scent side from the seeded backbone", () => {
    const genome = rnnController.seed(createRng(11));
    const leftTurn = rnnController.act(
      genome,
      inputsWith({ [Input.FOOD_SCENT_LEFT]: 0.8, [Input.FOOD_SCENT_RIGHT]: 0.1 }),
      rnnController.createState()
    ).outputs[Output.TURN];
    const rightTurn = rnnController.act(
      genome,
      inputsWith({ [Input.FOOD_SCENT_LEFT]: 0.1, [Input.FOOD_SCENT_RIGHT]: 0.8 }),
      rnnController.createState()
    ).outputs[Output.TURN];
    expect(leftTurn).toBeGreaterThan(rightTurn);
  });

  it("moves toward food scent and eats at contact when hungry", () => {
    const genome = rnnController.seed(createRng(12));
    const state = rnnController.createState();
    let maxForward = -Infinity;
    let outputs = rnnController.act(
      genome,
      inputsWith({ [Input.FOOD_SCENT_LEFT]: 0.6, [Input.FOOD_SCENT_RIGHT]: 0.5 }),
      state
    ).outputs;
    for (let t = 0; t < 5; t++) {
      outputs = rnnController.act(
        genome,
        inputsWith({ [Input.FOOD_SCENT_LEFT]: 0.6, [Input.FOOD_SCENT_RIGHT]: 0.5 }),
        state
      ).outputs;
      maxForward = Math.max(maxForward, outputs[Output.FORWARD]);
    }
    expect(maxForward).toBeGreaterThan(0.2);

    const eatState = rnnController.createState();
    let eat = -Infinity;
    for (let t = 0; t < 5; t++) {
      const acted = rnnController.act(
        genome,
        inputsWith({ [Input.CONTACT_FOOD]: 1, [Input.ENERGY]: 0.3 }),
        eatState
      ).outputs;
      eat = Math.max(eat, acted[Output.EAT]);
    }
    expect(eat).toBeGreaterThan(0.5);
  });

  it("carries memory in the recurrent state", () => {
    const genome = rnnController.seed(createRng(13));
    const state = rnnController.createState();
    rnnController.act(genome, inputsWith({ [Input.FOOD_SCENT_LEFT]: 1 }), state);
    const second = Array.from(rnnController.act(genome, inputsWith({}), state).outputs);
    const fresh = Array.from(
      rnnController.act(genome, inputsWith({}), rnnController.createState()).outputs
    );
    expect(second).not.toEqual(fresh);
  });
});

describe("rnn genome operations", () => {
  it("migrates the prior 105-input genome layout with new receptors disconnected", () => {
    const previousLength = GENOME_LENGTH - HIDDEN_COUNT * 15;
    const serialized = new Float32Array(previousLength * 2);
    serialized[0] = 0.75;
    serialized[previousLength - 1] = -0.5;
    serialized[previousLength] = -0.25;

    const migrated = rnnController.serializeGenome(rnnController.deserializeGenome(serialized));

    expect(migrated).toHaveLength(GENOME_LENGTH * 2);
    expect(migrated[0]).toBe(0.75);
    expect(migrated[105]).toBe(0);
    expect(migrated[GENOME_LENGTH - 1]).toBe(-0.5);
    expect(migrated[GENOME_LENGTH]).toBe(-0.25);
  });

  it("mutates genomes without touching the source", () => {
    const rng = createRng(21);
    const genome = rnnController.seed(rng);
    const before = rnnController.physical(genome);
    const child = rnnController.mutate(genome, 0.8, rng);
    expect(rnnController.physical(genome)).toEqual(before);
    expect(rnnController.physical(child)).not.toEqual(before);
  });

  it("measures expressed genome distance behind the controller boundary", () => {
    const rng = createRng(24);
    const genome = rnnController.seed(rng);
    const serialized = rnnController.serializeGenome(genome);
    const half = serialized.length / 2;
    const swapped = new Float32Array(serialized.length);
    swapped.set(serialized.subarray(half), 0);
    swapped.set(serialized.subarray(0, half), half);

    expect(rnnController.genomeDistance(genome, genome)).toBe(0);
    expect(rnnController.genomeDistance(genome, rnnController.deserializeGenome(swapped))).toBe(0);
    expect(
      rnnController.genomeDistance(genome, rnnController.mutate(genome, 1, rng))
    ).toBeGreaterThan(0);
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

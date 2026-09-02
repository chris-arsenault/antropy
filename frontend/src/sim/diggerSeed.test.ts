import { describe, expect, it } from "vitest";
import { ACTION_THRESHOLD, Input, INPUT_COUNT, Output } from "./controller/contract";
import { diggerSeedVector, rnnController } from "./controller/rnn";

/**
 * Phase 2 step 7: rung-3 assays. Each seeded reflex is driven with
 * synthetic stimuli straight through the controller — no world, no
 * ants — so sign errors surface here in milliseconds instead of being
 * mistaken for behavioral failures later.
 */
function act(stimuli: Partial<Record<number, number>>): Float32Array {
  const genome = rnnController.deserializeGenome(diggerSeedVector());
  const state = rnnController.createState();
  const inputs = new Float32Array(INPUT_COUNT);
  inputs[Input.BIAS] = 1;
  for (const [index, value] of Object.entries(stimuli)) {
    inputs[Number(index)] = value as number;
  }
  // Settle: the relays are memoryless, but run a few ticks so any
  // accidental recurrence would show up.
  let outputs = rnnController.act(genome, inputs, state).outputs;
  for (let i = 0; i < 4; i++) {
    outputs = rnnController.act(genome, inputs, state).outputs;
  }
  return Float32Array.from(outputs);
}

describe("digger seed assays (Phase 2 step 7)", () => {
  it("reflex 1: digs, and digs downward, with no sensory input", () => {
    const out = act({});
    expect(out[Output.DIG], "terrain channel fires").toBeGreaterThan(ACTION_THRESHOLD);
    expect(out[Output.VERTICAL_BIAS], "targets straight down").toBeLessThan(-0.33);
  });

  it("reflex 2: marks channel A while working", () => {
    const out = act({});
    expect(out[Output.PHEROMONE_A], "deposits a mark").toBeGreaterThan(0.5);
  });

  it("reflex 2: turns toward the stronger mark, and is inert when unmarked", () => {
    const left = act({ [Input.PHEROMONE_A_LEFT]: 0.8, [Input.PHEROMONE_A_RIGHT]: 0.1 });
    const right = act({ [Input.PHEROMONE_A_LEFT]: 0.1, [Input.PHEROMONE_A_RIGHT]: 0.8 });
    const even = act({ [Input.PHEROMONE_A_LEFT]: 0.5, [Input.PHEROMONE_A_RIGHT]: 0.5 });

    expect(left[Output.TURN], "left mark turns left").toBeGreaterThan(0.3);
    expect(right[Output.TURN], "right mark turns right").toBeLessThan(-0.3);
    // Symmetric marking must not bias the turn (§B.6 item 1: a constant
    // turn rate is the classic circling bug).
    expect(Math.abs(even[Output.TURN]), "balanced marks do not steer").toBeLessThan(0.05);
    expect(Math.abs(act({})[Output.TURN]), "no marks do not steer").toBeLessThan(0.05);
  });

  it("reflex 3: two neighbours lift the dig out of down and into the faced voxel", () => {
    // CROWDING is (neighbours-1)/8 clamped: one neighbour is 0.125.
    const alone = act({ [Input.CROWDING]: 0 });
    const oneNeighbor = act({ [Input.CROWDING]: 0.125 });
    const twoNeighbors = act({ [Input.CROWDING]: 0.25 });
    const packed = act({ [Input.CROWDING]: 0.5 });

    expect(alone[Output.VERTICAL_BIAS], "alone: dig down").toBeLessThan(-0.33);
    expect(oneNeighbor[Output.VERTICAL_BIAS], "one neighbour: still down").toBeLessThan(-0.33);
    // Neutral band (-0.33..0.33) is what makes the dig target the faced
    // voxel — sideways — instead of the floor.
    expect(twoNeighbors[Output.VERTICAL_BIAS], "two neighbours: sideways").toBeGreaterThan(-0.33);
    expect(twoNeighbors[Output.VERTICAL_BIAS], "two neighbours: not upward").toBeLessThan(0.33);
    expect(packed[Output.VERTICAL_BIAS], "packed: sideways").toBeGreaterThan(-0.33);
    expect(packed[Output.VERTICAL_BIAS], "packed: not upward").toBeLessThan(0.33);
    // Crowding must not switch off digging.
    expect(twoNeighbors[Output.DIG], "still digging").toBeGreaterThan(ACTION_THRESHOLD);
  });
});

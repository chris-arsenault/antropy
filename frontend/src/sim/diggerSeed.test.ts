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
  const marked = {
    [Input.PHEROMONE_A_LEFT]: 0.5,
    [Input.PHEROMONE_A_RIGHT]: 0.5,
  };

  it("reflex 1: digs down at a marked site and stays quiet away from it", () => {
    const atSite = act(marked);
    const quiet = act({});

    expect(atSite[Output.DIG], "marked terrain channel fires").toBeGreaterThan(ACTION_THRESHOLD);
    expect(atSite[Output.VERTICAL_BIAS], "targets straight down").toBeLessThan(-0.33);
    expect(quiet[Output.DIG], "quiet ground is not dug").toBeLessThanOrEqual(ACTION_THRESHOLD);
  });

  it("reflex 2: load flips upward and suppresses digging in a marked shaft", () => {
    const unloaded = act(marked);
    const loaded = act({ ...marked, [Input.CARRY_LOAD]: 0.5 });

    expect(unloaded[Output.VERTICAL_BIAS], "unloaded ant descends").toBeLessThan(-0.33);
    expect(unloaded[Output.DIG], "unloaded ant digs").toBeGreaterThan(ACTION_THRESHOLD);
    expect(loaded[Output.VERTICAL_BIAS], "loaded ant climbs").toBeGreaterThan(0.33);
    expect(loaded[Output.DIG], "loaded ant does not dig the shaft wall").toBeLessThanOrEqual(
      ACTION_THRESHOLD
    );
  });

  it("reflex 2: a loaded ant deposits at low A but not high A", () => {
    const quiet = act({ [Input.CARRY_LOAD]: 0.5 });
    const markedLoaded = act({ ...marked, [Input.CARRY_LOAD]: 0.5 });

    expect(quiet[Output.VERTICAL_BIAS], "loaded ant still aims upward").toBeGreaterThan(0.33);
    expect(quiet[Output.DIG], "low-A air target triggers spoil deposit").toBeGreaterThan(
      ACTION_THRESHOLD
    );
    expect(markedLoaded[Output.DIG], "high-A shaft mouth is not refilled").toBeLessThanOrEqual(
      ACTION_THRESHOLD
    );
  });

  it("reflex 3: reinforces channel A only at the marked work site", () => {
    expect(act(marked)[Output.PHEROMONE_A], "reinforces a founded mark").toBeGreaterThan(0.35);
    expect(act({})[Output.PHEROMONE_A], "does not mark quiet ground").toBe(0);
  });

  it("reflex 3: turns toward the stronger mark without a casting override", () => {
    const left = act({ [Input.PHEROMONE_A_LEFT]: 0.8, [Input.PHEROMONE_A_RIGHT]: 0.1 });
    const right = act({ [Input.PHEROMONE_A_LEFT]: 0.1, [Input.PHEROMONE_A_RIGHT]: 0.8 });
    const strongAhead = act({
      [Input.PHEROMONE_A_LEFT]: 0.8,
      [Input.PHEROMONE_A_RIGHT]: 0.8,
    });

    expect(left[Output.TURN], "left mark turns left").toBeGreaterThan(0.3);
    expect(right[Output.TURN], "right mark turns right").toBeLessThan(-0.3);
    expect(Math.abs(strongAhead[Output.TURN]), "strong balanced A cancels casting").toBeLessThan(
      0.05
    );
  });

  it("reflex 4: two neighbours lift the dig out of down and into the faced voxel", () => {
    // CROWDING is (neighbours-1)/8 clamped: one neighbour is 0.125.
    const alone = act({ ...marked, [Input.CROWDING]: 0 });
    const oneNeighbor = act({ ...marked, [Input.CROWDING]: 0.125 });
    const twoNeighbors = act({ ...marked, [Input.CROWDING]: 0.25 });
    const packed = act({ ...marked, [Input.CROWDING]: 0.5 });

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

  it("reflex 5: uniform low A casts until channel A is reacquired", () => {
    const absent = act({});
    const faint = act({
      [Input.PHEROMONE_A_LEFT]: 0.02,
      [Input.PHEROMONE_A_RIGHT]: 0.02,
    });
    const acquired = act(marked);

    expect(absent[Output.TURN], "no A causes a constant turn").toBeGreaterThan(0.4);
    expect(faint[Output.TURN], "faint total A still casts").toBeGreaterThan(0.35);
    expect(Math.abs(acquired[Output.TURN]), "acquired A releases casting").toBeLessThan(0.05);
  });
});

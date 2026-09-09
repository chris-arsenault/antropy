import { describe, expect, it } from "vitest";
import { INPUT_COUNT } from "../../src/sim/controller/contract";
import { evaluateRnn, HIDDEN_COUNT, RNN_GENOME_LENGTH } from "../../src/sim/controller/rnn";
import {
  foldInputNormalization,
  inputNormalization,
  normalizeInputs,
  unfoldInputNormalization,
} from "./rnnNormalization";

function frame(offset: number): Float32Array {
  return Float32Array.from({ length: INPUT_COUNT }, (_, index) => Math.sin(index * 0.7 + offset));
}

describe("RNN training input conditioning", () => {
  it("folds the comparison basis and normalization into the emitted genome", () => {
    const frames = [frame(0), frame(0.4), frame(0.9)];
    const normalization = inputNormalization(frames);
    const genome = Float32Array.from(
      { length: RNN_GENOME_LENGTH },
      (_, index) => Math.sin(index * 0.13) * 0.05
    );
    const folded = foldInputNormalization(genome, normalization);
    const normalizedState = Float32Array.from(
      { length: HIDDEN_COUNT },
      (_, index) => index * 0.001
    );
    const foldedState = Float32Array.from(normalizedState);

    const normalizedOutput = evaluateRnn(
      genome,
      normalizeInputs(frames[0], normalization),
      normalizedState
    );
    const foldedOutput = evaluateRnn(folded, frames[0], foldedState);

    expect([...foldedOutput]).toEqual(
      [...normalizedOutput].map((value) => expect.closeTo(value, 5))
    );
    expect([...foldedState]).toEqual([...normalizedState].map((value) => expect.closeTo(value, 5)));
    expect([...unfoldInputNormalization(folded, normalization)]).toEqual(
      [...genome].map((value) => expect.closeTo(value, 3))
    );
  });
});

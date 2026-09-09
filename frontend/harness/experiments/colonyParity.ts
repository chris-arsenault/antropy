import { readFileSync } from "node:fs";
import { colonyLogits } from "../lib/learnedColony";
import { flag, type Flags } from "../lib/flags";
import { loadColonyModel } from "../lib/colonyArtifacts";
import { directionSamples } from "../../src/sim/controller/directionalEncoding";

interface Example {
  inputs: number[];
  previous: number[];
  logits: number[];
  state: number[];
  directions?: number[][];
}

export function runColonyParity(flags: Flags): void {
  const path = flag(flags, "model", "");
  const model = loadColonyModel(path);
  const report = JSON.parse(readFileSync(`${path}.report.json`, "utf8")) as { parity: Example[] };
  let maximum = 0;
  for (const example of report.parity) {
    const state = Float32Array.from(example.previous);
    const logits = colonyLogits(model, Float32Array.from(example.inputs), state);
    if (example.directions) {
      const actual = directionSamples(example.inputs).flatMap((values) => [...values]);
      const expected = example.directions.flat();
      maximum = Math.max(maximum, ...actual.map((value, i) => Math.abs(value - expected[i])));
    }
    for (let i = 0; i < logits.length; i++)
      maximum = Math.max(maximum, Math.abs(logits[i] - example.logits[i]));
    for (let i = 0; i < state.length; i++)
      maximum = Math.max(maximum, Math.abs(state[i] - example.state[i]));
  }
  if (maximum > 1e-4) throw new Error(`Python/TypeScript inference mismatch: ${maximum}`);
  console.log(JSON.stringify({ examples: report.parity.length, maximumError: maximum }));
}

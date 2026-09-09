import { type Genome, type BrainState, PARAMETERS, HIDDEN } from "./rnn";

export const CONTROLLER_ID = "bacteria-rnn-15x16x5-v1";
function record(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid controller record");
  return data as Record<string, unknown>;
}
function vector(data: unknown, length: number, limit: number): Float32Array {
  if (
    !Array.isArray(data) ||
    data.length !== length ||
    !data.every((v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= limit)
  )
    throw new Error("Invalid controller numeric array");
  return Float32Array.from(data);
}
export function encodeGenome(genome: Genome): unknown {
  return { controller: CONTROLLER_ID, weights: Array.from(genome.weights) };
}
export function decodeGenome(data: unknown): Genome {
  const value = record(data);
  if (value.controller !== CONTROLLER_ID) throw new Error("Unsupported controller identity");
  return { weights: vector(value.weights, PARAMETERS, 16) };
}
export function encodeState(state: BrainState): unknown {
  return { task: state.task, hidden: Array.from(state.hidden) };
}
export function decodeState(data: unknown): BrainState {
  const value = record(data);
  if (
    typeof value.task !== "number" ||
    !Number.isInteger(value.task) ||
    value.task < 0 ||
    value.task > 255
  )
    throw new Error("Invalid controller task byte");
  return { task: value.task, hidden: vector(value.hidden, HIDDEN, 1) };
}

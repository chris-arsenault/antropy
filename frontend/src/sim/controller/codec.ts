import { type Genome, type BrainState, PARAMETERS, HIDDEN } from "./rnn";
import { PLASTIC_LOCI } from "./plasticity";

export const CONTROLLER_ID = "bacteria-rnn-35x24x8-ecology-v4";
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
  return {
    controller: CONTROLLER_ID,
    weights: Array.from(genome.weights),
    plasticity: Array.from(genome.plasticity),
  };
}
export function decodeGenome(data: unknown): Genome {
  const value = record(data);
  if (value.controller !== CONTROLLER_ID) throw new Error("Unsupported controller identity");
  return {
    weights: vector(value.weights, PARAMETERS, 16),
    plasticity: vector(value.plasticity, PLASTIC_LOCI, 1),
  };
}
export function encodeState(state: BrainState): unknown {
  return {
    task: state.task,
    hidden: Array.from(state.hidden),
    traces: Array.from(state.traces),
    lastReserve: state.lastReserve,
  };
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
  if (
    value.lastReserve !== null &&
    (typeof value.lastReserve !== "number" ||
      !Number.isFinite(value.lastReserve) ||
      value.lastReserve < 0 ||
      value.lastReserve > 1)
  )
    throw new Error("Invalid controller reserve memory");
  return {
    task: value.task,
    hidden: vector(value.hidden, HIDDEN, 1),
    traces: vector(value.traces, HIDDEN * HIDDEN, 1),
    lastReserve: value.lastReserve,
  };
}

export const OPS = [
  "constant",
  "input",
  "copy",
  "add",
  "subtract",
  "multiply",
  "divide",
  "greater",
  "skip",
] as const;
export type Op = (typeof OPS)[number];
export interface Instruction {
  readonly op: Op;
  readonly out: number;
  readonly a: number;
  readonly b: number;
  readonly value: number;
}
export interface LinearGenome {
  readonly version: 1;
  readonly instructions: readonly Instruction[];
}
export const REGISTER_COUNT = 32;
export const MAX_INSTRUCTIONS = 8192;
export const NUMERIC_LIMIT = 1_000_000;

export function finite(value: number): number {
  return Number.isFinite(value)
    ? Math.fround(Math.max(-NUMERIC_LIMIT, Math.min(NUMERIC_LIMIT, value)))
    : 0;
}

export function validateLinearGenome(value: unknown): LinearGenome {
  if (!value || typeof value !== "object") throw new Error("invalid linear genome");
  const genome = value as LinearGenome;
  if (
    genome.version !== 1 ||
    !Array.isArray(genome.instructions) ||
    genome.instructions.length < 1 ||
    genome.instructions.length > MAX_INSTRUCTIONS
  )
    throw new Error("invalid linear program length or version");
  for (const instruction of genome.instructions) validateInstruction(instruction);
  return structuredClone(genome);
}

function validateInstruction(instruction: Instruction): void {
  if (
    !instruction ||
    !OPS.includes(instruction.op) ||
    ![instruction.out, instruction.a, instruction.b].every(
      (r) => Number.isInteger(r) && r >= 0 && r < REGISTER_COUNT
    ) ||
    !Number.isFinite(instruction.value) ||
    Math.abs(instruction.value) > NUMERIC_LIMIT
  )
    throw new Error("invalid linear instruction");
}

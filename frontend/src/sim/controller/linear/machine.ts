import { finite, type Instruction, type LinearGenome, REGISTER_COUNT } from "./genome";
import { specializeLinear } from "./optimize";

function execute(i: Instruction, registers: number[], inputs: readonly number[]): number {
  const a = registers[i.a],
    b = registers[i.b];
  if (i.op === "input") return readInput(inputs, i.value);
  if (i.op === "divide") return divide(a, b);
  switch (i.op) {
    case "constant":
      return i.value;
    case "copy":
      return a;
    case "add":
      return a + b;
    case "subtract":
      return a - b;
    case "multiply":
      return a * b;
    case "greater":
      return Number(a > b);
    case "skip":
      return a;
  }
}

function divide(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}
function readInput(inputs: readonly number[], index: number): number {
  return inputs[Math.abs(Math.trunc(index)) % inputs.length] ?? 0;
}

/** Each instruction executes at most once. Registers 24–31 persist from the winning candidate. */
export function runLinear(
  genome: LinearGenome,
  inputs: readonly number[],
  memory: readonly number[]
): number[] {
  const registers = Array.from({ length: REGISTER_COUNT }, (_, i) =>
    i >= 24 ? finite(memory[i] ?? 0) : 0
  );
  for (let pc = 0; pc < genome.instructions.length; pc++) {
    const instruction = genome.instructions[pc];
    if (instruction.op === "skip" && registers[instruction.a] <= 0) {
      pc++;
      continue;
    }
    registers[instruction.out] = finite(execute(instruction, registers, inputs));
  }
  return registers;
}

export function runSpecialized(
  genome: LinearGenome,
  inputs: readonly number[],
  memory: readonly number[]
): number[] {
  return runLinear(specializeLinear(genome, inputs.length, inputs[0]), inputs, memory);
}

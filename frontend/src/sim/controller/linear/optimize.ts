import { finite, type Instruction, type LinearGenome } from "./genome";

const cache = new WeakMap<LinearGenome, Map<string, LinearGenome>>();

function arithmetic(op: Instruction["op"], a: number, b: number): number {
  switch (op) {
    case "add":
      return finite(a + b);
    case "subtract":
      return finite(a - b);
    case "multiply":
      return finite(a * b);
    case "divide":
      return b === 0 ? 0 : finite(a / b);
    case "greater":
      return Number(a > b);
    default:
      return a;
  }
}

function constantValue(
  i: Instruction,
  constants: Map<number, number>,
  count: number,
  action: number
): number | undefined {
  if (i.op === "constant") return finite(i.value);
  if (i.op === "input") return Math.abs(Math.trunc(i.value)) % count === 0 ? action : undefined;
  const a = constants.get(i.a),
    b = constants.get(i.b);
  if (i.op === "copy") return a;
  if (i.op === "multiply" && (a === 0 || b === 0)) return 0;
  return a === undefined || b === undefined ? undefined : arithmetic(i.op, a, b);
}

function removeDead(instructions: Instruction[]): Instruction[] {
  const live = new Set([0, 1, 24, 25, 26, 27, 28, 29, 30, 31]);
  const retained: Instruction[] = [];
  for (let index = instructions.length - 1; index >= 0; index--) {
    const i = instructions[index];
    if (!live.has(i.out)) continue;
    retained.push(i);
    live.delete(i.out);
    if (i.op === "constant" || i.op === "input") continue;
    live.add(i.a);
    if (i.op !== "copy") live.add(i.b);
  }
  return retained.reverse();
}

/** Specialize only the known request code; never use seed identity or policy-specific rules. */
export function specializeLinear(
  genome: LinearGenome,
  count: number,
  action: number
): LinearGenome {
  if (genome.instructions.some((i) => i.op === "skip")) return genome;
  const byAction = cache.get(genome) ?? new Map<string, LinearGenome>();
  cache.set(genome, byAction);
  const key = `${count}:${action}`,
    cached = byAction.get(key);
  if (cached) return cached;
  const constants = new Map<number, number>(Array.from({ length: 24 }, (_, i) => [i, 0]));
  const instructions = genome.instructions.map((i) => {
    const value = constantValue(i, constants, count, action);
    if (value === undefined) {
      constants.delete(i.out);
      return i;
    }
    constants.set(i.out, value);
    return { ...i, op: "constant" as const, value };
  });
  const result: LinearGenome = { version: 1, instructions: removeDead(instructions) };
  byAction.set(key, result);
  return result;
}

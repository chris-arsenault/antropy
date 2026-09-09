import { nextRandom, randomInt, type RandomState } from "../../random";
import {
  MAX_INSTRUCTIONS,
  OPS,
  validateLinearGenome,
  type Instruction,
  type LinearGenome,
} from "./genome";

function randomInstruction(random: RandomState): Instruction {
  return {
    op: OPS[randomInt(random, 0, OPS.length)],
    out: randomInt(random, 0, 32),
    a: randomInt(random, 0, 32),
    b: randomInt(random, 0, 32),
    value: randomInt(random, -32, 33),
  };
}

export function mutateLinear(genome: LinearGenome, random: RandomState): LinearGenome {
  const instructions = [...genome.instructions];
  const index = randomInt(random, 0, instructions.length);
  const operation = randomInt(random, 0, 4);
  if (operation === 0 && instructions.length < MAX_INSTRUCTIONS)
    instructions.splice(index, 0, randomInstruction(random));
  else if (operation === 1 && instructions.length > 1) instructions.splice(index, 1);
  else if (operation === 2)
    instructions[index] = {
      ...instructions[index],
      value: Math.max(
        -1e6,
        Math.min(1e6, instructions[index].value + (nextRandom(random) - 0.5) * 2)
      ),
    };
  else instructions[index] = randomInstruction(random);
  return validateLinearGenome({ version: 1, instructions });
}

export function recombineLinear(
  left: LinearGenome,
  right: LinearGenome,
  random: RandomState
): LinearGenome {
  const a = randomInt(random, 0, left.instructions.length + 1);
  const b = randomInt(random, 0, right.instructions.length);
  return validateLinearGenome({
    version: 1,
    instructions: [...left.instructions.slice(0, a), ...right.instructions.slice(b)].slice(
      0,
      MAX_INSTRUCTIONS
    ),
  });
}

export function linearDistance(left: LinearGenome, right: LinearGenome): number {
  const size = Math.max(left.instructions.length, right.instructions.length);
  let changed = 0;
  for (let i = 0; i < size; i++) {
    const a = left.instructions[i],
      b = right.instructions[i];
    if (!a || !b) {
      changed++;
      continue;
    }
    const fields = [a.op !== b.op, a.out !== b.out, a.a !== b.a, a.b !== b.b];
    changed += (fields.filter(Boolean).length + Math.min(1, Math.abs(a.value - b.value))) / 5;
  }
  return changed / size;
}

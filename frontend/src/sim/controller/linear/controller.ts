import { type Candidate } from "../../colony/observation";
import { createDecisionState, type Request } from "../../colony/contract";
import { evaluate, specialize } from "./expression";
import { type LinearGenome } from "./genome";
import { runSpecialized } from "./machine";
import { SCORE, TASK, seedLinearGenome } from "./seed";
import { linearDistance, mutateLinear, recombineLinear } from "./variation";
import { REQUESTS } from "../../colony/contract";

const SCORES = REQUESTS.map((_, action) => specialize(SCORE, 0, action));
const TASKS = REQUESTS.map((_, action) => specialize(TASK, 0, action));

export interface Decision {
  readonly request: Request;
  readonly registers: number[];
}

function choose(
  candidates: readonly Candidate[],
  evaluateCandidate: (candidate: Candidate) => number[]
): Decision {
  let best = -Infinity;
  let winner: Decision | null = null;
  for (const candidate of candidates) {
    const registers = evaluateCandidate(candidate);
    if (registers[0] <= best) continue;
    best = registers[0];
    const task = registers[1] < 0 ? null : Math.abs(Math.trunc(registers[1])) % 256;
    winner = { request: { ...candidate.request, task }, registers };
  }
  if (!winner) throw new Error("controller requires finite candidate scores");
  return winner;
}

export function actProgrammed(
  candidates: readonly Candidate[],
  memory: readonly number[]
): Decision {
  return choose(candidates, (candidate) => {
    const registers = [...memory];
    registers[0] = evaluate(SCORES[candidate.inputs[0]], candidate.inputs);
    registers[1] = evaluate(TASKS[candidate.inputs[0]], candidate.inputs);
    return registers;
  });
}

export const linearController = {
  id: "linear-program-v1",
  seed: seedLinearGenome,
  createState: createDecisionState,
  act(genome: LinearGenome, candidates: readonly Candidate[], memory: readonly number[]): Decision {
    return choose(candidates, (candidate) => runSpecialized(genome, candidate.inputs, memory));
  },
  mutate: mutateLinear,
  recombine: recombineLinear,
  genomeDistance: linearDistance,
};

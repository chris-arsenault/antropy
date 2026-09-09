import { type World } from "../../src/sim/types";
import { observeDecisions } from "../../src/sim/colony/diagnostics";
import { F, FEATURE_NAMES, type Candidate } from "../../src/sim/colony/observation";
import { REQUESTS } from "../../src/sim/colony/contract";
import { SCORE } from "../../src/sim/controller/linear/seed";
import { evaluate, specialize } from "../../src/sim/controller/linear/expression";
import { type ConstructionJob } from "../../src/sim/construction/state";

const scores = REQUESTS.map((_, action) => specialize(SCORE, 0, action));
const score = (candidate: Candidate) => evaluate(scores[candidate.inputs[0]], candidate.inputs);
const increment = (counts: Record<string, number>, key: string) => {
  counts[key] = (counts[key] ?? 0) + 1;
};

export function attachPressureTrace(world: World) {
  const actions: Record<string, number> = {};
  const sampled: Record<string, number> = {};
  const jobs = new Map<number, ConstructionJob>();
  const examples: Record<string, unknown>[] = [];
  let decisions = 0;
  const detach = observeDecisions(world, (current, ant, candidates, request, result) => {
    decisions++;
    increment(actions, `${request.kind}:${result}`);
    if (request.proposal) increment(actions, `proposal-${request.proposal.kind}:${result}`);
    for (const job of current.construction.jobs) jobs.set(job.id, { ...job });
    if (current.tick % 64 !== ant.id % 64) return;
    increment(sampled, "decisions");
    const winnerScore = Math.max(...candidates.map(score));
    sampleProposals(candidates, winnerScore, sampled);
    if (current.tick % 256 !== ant.id % 256) return;
    for (const candidate of bestProposals(candidates).values()) {
      examples.push({
        tick: current.tick,
        ant: ant.id,
        kind: candidate.request.proposal!.kind,
        score: score(candidate),
        winnerScore,
        winner: request.kind,
        features: Object.fromEntries(FEATURE_NAMES.map((name, i) => [name, candidate.inputs[i]])),
      });
    }
  });
  return { actions, sampled, jobs, examples, detach, decisions: () => decisions };
}

function bestProposals(candidates: readonly Candidate[]): Map<string, Candidate> {
  const best = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const kind = candidate.request.proposal?.kind;
    if (!kind) continue;
    const previous = best.get(kind);
    if (!previous || score(candidate) > score(previous)) best.set(kind, candidate);
  }
  return best;
}

function sampleProposals(
  candidates: readonly Candidate[],
  winnerScore: number,
  counts: Record<string, number>
): void {
  const present = new Set<string>();
  for (const candidate of candidates) {
    const kind = candidate.request.proposal?.kind;
    if (!kind) continue;
    present.add(`${kind}:enumerated`);
    for (const [name, value] of Object.entries(proposalConditions(candidate, winnerScore)))
      if (value) present.add(`${kind}:${name}`);
  }
  for (const key of present) increment(counts, key);
}

function proposalConditions(candidate: Candidate, winnerScore: number) {
  const x = (name: keyof typeof F) => candidate.inputs[F[name]];
  const value = score(candidate);
  return {
    "free-supported": x("siteFloor") && !x("siteOccupied"),
    "hot-source": x("sourceTemperature") > 28,
    "cooler-site": x("sourceTemperature") - x("siteTemperature") > 2,
    "nursery-pressure": x("nurseryBrood") > 0 && x("nurseryFree") < 2,
    "storage-pressure": x("storageFill") > 0.7,
    "traffic-pressure": x("siteTraffic") > 5,
    "positive-score": value > 0,
    "winning-score": value >= winnerScore,
  };
}

import { compareColonyOutcomes, type ColonyOutcomeVerdict } from "./colonyOutcome";

/** Centered ranks with equal utility for behaviorally indistinguishable samples. */
export function rankUtilities(verdicts: ColonyOutcomeVerdict[]): number[] {
  const order = verdicts
    .map((verdict, index) => ({ index, verdict }))
    .sort((a, b) => compareColonyOutcomes(a.verdict, b.verdict));
  const utilities = new Array<number>(verdicts.length);
  let rank = 0;
  while (rank < order.length) {
    let end = rank + 1;
    while (
      end < order.length &&
      compareColonyOutcomes(order[rank].verdict, order[end].verdict) === 0
    ) {
      end += 1;
    }
    const averageRank = (rank + end - 1) / 2;
    const utility = averageRank / Math.max(1, order.length - 1) - 0.5;
    for (let tied = rank; tied < end; tied++) utilities[order[tied].index] = utility;
    rank = end;
  }
  return utilities;
}

/** Deterministic non-overlapping training worlds for one generation. */
export function generationWorldSeeds(base: number, count: number, generation: number): number[] {
  const start = base + (generation - 1) * count;
  return Array.from({ length: count }, (_, offset) => start + offset);
}

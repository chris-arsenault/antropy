export interface ColonyOutcomeVerdict {
  fitness: number;
  mean: number;
  worst: number;
  completionCount: number;
  cacheCount: number;
  returnCount: number;
  pickupCount: number;
  exitCount: number;
  scores: number[];
  runs: Record<string, unknown>[];
}

function numberOf(summary: Record<string, unknown>, key: string, fallback = 0): number {
  const value = summary[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function progress(value: number, reach: number): number {
  return Math.max(0, Math.min(0.99, 1 - value / reach));
}

/** Furthest completed milestone plus bounded progress only toward the next. */
export function colonyMilestoneScore(summary: Record<string, unknown>): number {
  if (summary.cacheDrained === true) {
    const energy = numberOf(summary, "retrievalEnergyAfter");
    return 5 + Math.max(-0.25, Math.min(0.25, energy * 0.1));
  }
  if (summary.cacheGrew === true) {
    const before = numberOf(summary, "cacheBeforeScarcity");
    const after = numberOf(summary, "cacheAfterScarcity", before);
    return 4 + progress(after, Math.max(1, before));
  }
  if (summary.returned === true) return 3 + (summary.deposited === true ? 0.5 : 0);
  if (summary.pickedUp === true) {
    return 2 + progress(numberOf(summary, "minLoadedEntranceDistance", 20), 12);
  }
  if (summary.exited === true) {
    return 1 + progress(numberOf(summary, "minFoodDistance", 20), 12);
  }
  return 0;
}

function count(runs: Record<string, unknown>[], key: string): number {
  return runs.filter((run) => run[key] === true).length;
}

export function summarizeColonyOutcomes(runs: Record<string, unknown>[]): ColonyOutcomeVerdict {
  const scores = runs.map(colonyMilestoneScore);
  const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const worst = Math.min(...scores);
  return {
    fitness: mean + worst * 0.25,
    mean,
    worst,
    completionCount: count(runs, "cacheDrained"),
    cacheCount: count(runs, "cacheGrew"),
    returnCount: count(runs, "returned"),
    pickupCount: count(runs, "pickedUp"),
    exitCount: count(runs, "exited"),
    scores,
    runs,
  };
}

function compareCoverage(left: ColonyOutcomeVerdict, right: ColonyOutcomeVerdict): number {
  const leftScores = [...left.scores].sort((a, b) => a - b);
  const rightScores = [...right.scores].sort((a, b) => a - b);
  for (let index = 0; index < leftScores.length; index++) {
    if (leftScores[index] !== rightScores[index]) return leftScores[index] - rightScores[index];
  }
  return 0;
}

/** Completed terminal outcomes dominate partial progress in other worlds. */
export function compareColonyOutcomes(
  left: ColonyOutcomeVerdict,
  right: ColonyOutcomeVerdict
): number {
  const leftOrder = [
    left.completionCount,
    left.cacheCount,
    left.returnCount,
    left.pickupCount,
    left.exitCount,
  ];
  const rightOrder = [
    right.completionCount,
    right.cacheCount,
    right.returnCount,
    right.pickupCount,
    right.exitCount,
  ];
  for (let index = 0; index < leftOrder.length; index++) {
    if (leftOrder[index] !== rightOrder[index]) return leftOrder[index] - rightOrder[index];
  }
  const coverage = compareCoverage(left, right);
  return coverage === 0 ? left.mean - right.mean : coverage;
}

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

interface OrderedMilestones {
  exited: boolean;
  pickedUp: boolean;
  returned: boolean;
  deposited: boolean;
  cacheGrew: boolean;
  cacheDrained: boolean;
}

/** Reject impossible milestone combinations from current or historical harness summaries. */
function orderedMilestones(summary: Record<string, unknown>): OrderedMilestones {
  const exited = summary.exited === true;
  const pickedUp = exited && summary.pickedUp === true;
  const returned = pickedUp && summary.returned === true;
  const deposited = returned && summary.deposited === true;
  const cacheGrew = deposited && summary.cacheGrew === true;
  return {
    exited,
    pickedUp,
    returned,
    deposited,
    cacheGrew,
    cacheDrained: cacheGrew && summary.cacheDrained === true,
  };
}

/** Furthest completed milestone plus bounded progress only toward the next. */
export function colonyMilestoneScore(summary: Record<string, unknown>): number {
  const milestone = orderedMilestones(summary);
  if (milestone.cacheDrained) {
    const energy = numberOf(summary, "retrievalEnergyAfter");
    return 5 + Math.max(-0.25, Math.min(0.25, energy * 0.1));
  }
  if (milestone.cacheGrew) {
    const before = numberOf(summary, "cacheBeforeScarcity");
    const after = numberOf(summary, "cacheAfterScarcity", before);
    return 4 + progress(after, Math.max(1, before));
  }
  if (milestone.returned) return 3 + (milestone.deposited ? 0.5 : 0);
  if (milestone.pickedUp) {
    return 2 + progress(numberOf(summary, "minLoadedEntranceDistance", 20), 12);
  }
  if (milestone.exited) {
    return 1 + progress(numberOf(summary, "minFoodDistance", 20), 12);
  }
  return 0;
}

function count(runs: OrderedMilestones[], key: keyof OrderedMilestones): number {
  return runs.filter((run) => run[key]).length;
}

export function summarizeColonyOutcomes(runs: Record<string, unknown>[]): ColonyOutcomeVerdict {
  const scores = runs.map(colonyMilestoneScore);
  const milestones = runs.map(orderedMilestones);
  const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const worst = Math.min(...scores);
  return {
    fitness: mean + worst * 0.25,
    mean,
    worst,
    completionCount: count(milestones, "cacheDrained"),
    cacheCount: count(milestones, "cacheGrew"),
    returnCount: count(milestones, "returned"),
    pickupCount: count(milestones, "pickedUp"),
    exitCount: count(milestones, "exited"),
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

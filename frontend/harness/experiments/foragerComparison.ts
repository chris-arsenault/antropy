import { storedFood } from "../../src/sim/resources";
import { createWorld, stepWorld } from "../../src/sim/world";
import { type ScenarioId } from "../../src/sim/types";
import { flag, integerFlag, seedsFlag, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

export const FORAGER_GATE = Object.freeze({
  returnedLoads: 5,
  maxTicks: 5_000,
  maximumMedianSlowdown: 0.1,
  minimumCompletionRate: 0.75,
  maximumReversalFraction: 0.02,
});

export interface ArmResult {
  readonly completionTick: number | null;
  readonly pickups: number;
  readonly visibleDeposits: number;
  readonly cacheLoads: number;
  readonly distanceMoved: number;
  readonly turns: number;
  readonly immediateTurnReversals: number;
  readonly reversalFraction: number;
  readonly failedMoves: number;
  readonly energySpent: number;
  readonly pickupTicks: readonly number[];
  readonly depositTicks: readonly number[];
  readonly layout: string;
}

export interface ComparisonResult {
  readonly seed: number;
  readonly passedMechanics: boolean;
  readonly slowdown: number | null;
  readonly routeOverhead: number | null;
  readonly oracle: ArmResult;
  readonly programmed: ArmResult;
  readonly rnn: ArmResult;
}

function runArm(seed: number, scenario: ScenarioId, maximumTicks: number): ArmResult {
  const world = createWorld(seed, scenario);
  const layout = [...world.foodSources].sort((left, right) => left - right).join(",");
  while (world.tick < maximumTicks && world.metrics.foodDeposited < FORAGER_GATE.returnedLoads) {
    stepWorld(world);
  }
  const completed = world.metrics.foodDeposited >= FORAGER_GATE.returnedLoads;
  return {
    completionTick: completed ? world.tick : null,
    pickups: world.metrics.foodPickedUp,
    visibleDeposits: world.metrics.foodDeposited,
    cacheLoads: storedFood(world) / world.config.initialFoodQuantity,
    distanceMoved: world.ant.distanceMoved,
    turns: world.ant.turns,
    immediateTurnReversals: world.ant.immediateTurnReversals,
    reversalFraction: world.ant.immediateTurnReversals / Math.max(1, world.tick),
    failedMoves: world.metrics.failedMoves,
    energySpent: world.metrics.energySpent,
    pickupTicks: [...world.metrics.pickupTicks],
    depositTicks: [...world.metrics.depositTicks],
    layout,
  };
}

function exactFiveTrips(result: ArmResult): boolean {
  return (
    result.completionTick !== null &&
    result.pickups === FORAGER_GATE.returnedLoads &&
    result.visibleDeposits === FORAGER_GATE.returnedLoads &&
    result.cacheLoads === FORAGER_GATE.returnedLoads &&
    result.pickupTicks.length === FORAGER_GATE.returnedLoads &&
    result.depositTicks.length === FORAGER_GATE.returnedLoads
  );
}

export function measureForagerComparison(
  seed: number,
  maximumTicks: number = FORAGER_GATE.maxTicks
): ComparisonResult {
  const oracle = runArm(seed, "oracle", maximumTicks);
  const programmed = runArm(seed, "programmed", maximumTicks);
  const rnn = runArm(seed, "rnn", maximumTicks);
  const slowdown =
    oracle.completionTick === null || programmed.completionTick === null
      ? null
      : programmed.completionTick / oracle.completionTick - 1;
  const routeOverhead =
    oracle.distanceMoved === 0 ? null : programmed.distanceMoved / oracle.distanceMoved - 1;
  const passedMechanics =
    oracle.layout === programmed.layout &&
    exactFiveTrips(oracle) &&
    exactFiveTrips(programmed) &&
    programmed.reversalFraction <= FORAGER_GATE.maximumReversalFraction;
  return { seed, passedMechanics, slowdown, routeOverhead, oracle, programmed, rnn };
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function panelSummary(results: readonly ComparisonResult[]): Record<string, unknown> {
  const completed = results.filter((result) => result.passedMechanics);
  const slowdowns = completed.flatMap((result) =>
    result.slowdown === null ? [] : [result.slowdown]
  );
  const route = completed.flatMap((result) =>
    result.routeOverhead === null ? [] : [result.routeOverhead]
  );
  const completionRate = completed.length / results.length;
  const medianSlowdown = median(slowdowns);
  const rnnCompleted = results.filter((result) => exactFiveTrips(result.rnn));
  return {
    passed:
      completionRate >= FORAGER_GATE.minimumCompletionRate &&
      medianSlowdown !== null &&
      medianSlowdown <= FORAGER_GATE.maximumMedianSlowdown,
    seeds: results.map((result) => result.seed),
    completionRate,
    medianSlowdown,
    medianRouteOverhead: median(route),
    rnnCompletionRate: rnnCompleted.length / results.length,
    rnnMedianSlowdown: median(
      rnnCompleted.flatMap((result) => {
        if (result.oracle.completionTick === null || result.rnn.completionTick === null) return [];
        return [result.rnn.completionTick / result.oracle.completionTick - 1];
      })
    ),
    results,
  };
}

export function runForagerComparison(flags: Flags): void {
  const seeds = seedsFlag(flags, "1,2,3,4,5,6,7,8");
  const maximumTicks = integerFlag(flags, "ticks", FORAGER_GATE.maxTicks);
  const started = Date.now();
  const results = seeds.map((seed) => measureForagerComparison(seed, maximumTicks));
  const summary = panelSummary(results);
  const wallMs = Date.now() - started;
  const database = openLedger();
  const runId = recordRun(database, {
    experiment: "2d-immortal-forager",
    label: flag(flags, "label", ""),
    driver: "matched-random-panel",
    seed: seeds[0] ?? 0,
    ticks: maximumTicks,
    params: { gate: FORAGER_GATE, seeds },
    summary,
    wallMs,
  });
  console.log(`[run ${runId}] ${JSON.stringify(summary)}`);
}

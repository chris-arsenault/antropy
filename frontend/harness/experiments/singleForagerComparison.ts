import {
  buildOmniscientForagerWorld,
  buildSensorLimitedForagerWorld,
} from "../../src/sim/omniscientForagerWorld";
import { Output } from "../../src/sim/controller/contract";
import { ENERGY } from "../../src/sim/tunables";
import { stepWorld, type World } from "../../src/sim/world";
import { flag, seedsOf, type Flags } from "../lib/flags";
import { openLedger, recordRun } from "../lib/ledger";

export const SINGLE_FORAGER_GATE = {
  returnedLoads: 5,
  maxTicks: 1_100,
  maxSlowdown: 0.1,
  maxLarderStanceDistance: 1,
  maxImmediateTurnReversalFraction: 0.06,
} as const;

interface ArmResult {
  readonly completionTick: number | null;
  readonly returnedLoads: number;
  readonly externalLoads: number;
  readonly pickups: number;
  readonly cropDeliveries: number;
  readonly cacheDeposits: number;
  readonly returnTicks: readonly number[];
  readonly larderStance: readonly [number, number, number] | null;
  readonly immediateTurnReversals: number;
  readonly movingTurnReversals: number;
  readonly turnReversalFraction: number;
}

interface SteeringTrace {
  previousTurn: number;
  previousForward: number;
  reversals: number;
  movingReversals: number;
}

function trackSteering(world: World, trace: SteeringTrace): void {
  const outputs = world.ants[0].lastOutputs;
  const turn = Math.sign(outputs[Output.TURN]);
  const forward = outputs[Output.FORWARD];
  if (turn !== 0 && trace.previousTurn === -turn) {
    trace.reversals += 1;
    if (forward > 0 && trace.previousForward > 0) trace.movingReversals += 1;
  }
  trace.previousTurn = turn;
  trace.previousForward = forward;
}

function runArm(build: (seed: number) => World, seed: number): ArmResult {
  const world = build(seed);
  const returnTicks: number[] = [];
  const steering: SteeringTrace = {
    previousTurn: 0,
    previousForward: 0,
    reversals: 0,
    movingReversals: 0,
  };
  let previousReturned = 0;
  let larderStance: [number, number, number] | null = null;
  while (
    world.tick < SINGLE_FORAGER_GATE.maxTicks &&
    previousReturned < SINGLE_FORAGER_GATE.returnedLoads
  ) {
    stepWorld(world);
    trackSteering(world, steering);
    const returned = world.metrics.foodDelivered + world.metrics.foodDeposited;
    if (returned > previousReturned) {
      const ant = world.ants[0];
      returnTicks.push(world.tick);
      larderStance = [ant.x, ant.y, ant.z];
      previousReturned = returned;
    }
  }
  return {
    completionTick: previousReturned >= SINGLE_FORAGER_GATE.returnedLoads ? world.tick : null,
    returnedLoads: previousReturned,
    externalLoads: world.metrics.surfaceFoodEnergyGathered / ENERGY.foodEnergy,
    pickups: world.metrics.foodPickedUp,
    cropDeliveries: world.metrics.foodDelivered,
    cacheDeposits: world.metrics.foodDeposited,
    returnTicks,
    larderStance,
    immediateTurnReversals: steering.reversals,
    movingTurnReversals: steering.movingReversals,
    turnReversalFraction: steering.reversals / world.tick,
  };
}

function sameLarderNeighborhood(left: ArmResult, right: ArmResult): boolean {
  const rightStance = right.larderStance;
  if (left.larderStance === null || rightStance === null) return false;
  return left.larderStance.every(
    (coordinate, index) =>
      Math.abs(coordinate - rightStance[index]) <= SINGLE_FORAGER_GATE.maxLarderStanceDistance
  );
}

function completeWithoutRecycling(result: ArmResult): boolean {
  return (
    result.completionTick !== null &&
    result.returnedLoads === SINGLE_FORAGER_GATE.returnedLoads &&
    result.externalLoads === SINGLE_FORAGER_GATE.returnedLoads &&
    result.pickups === SINGLE_FORAGER_GATE.returnedLoads &&
    result.cropDeliveries + result.cacheDeposits === result.returnedLoads
  );
}

export function measureSingleForagerComparison(seed: number): Record<string, unknown> {
  const omniscient = runArm(buildOmniscientForagerWorld, seed);
  const sensorLimited = runArm(buildSensorLimitedForagerWorld, seed);
  const slowdown =
    omniscient.completionTick === null || sensorLimited.completionTick === null
      ? null
      : sensorLimited.completionTick / omniscient.completionTick - 1;
  const passed =
    completeWithoutRecycling(omniscient) &&
    completeWithoutRecycling(sensorLimited) &&
    sameLarderNeighborhood(omniscient, sensorLimited) &&
    sensorLimited.turnReversalFraction <= SINGLE_FORAGER_GATE.maxImmediateTurnReversalFraction &&
    slowdown !== null &&
    slowdown <= SINGLE_FORAGER_GATE.maxSlowdown;
  return { passed, slowdown, omniscient, sensorLimited };
}

/** Record the short matched five-load comparison; this is a harness gate, not a Vitest. */
export function runSingleForagerComparison(flags: Flags): void {
  const db = openLedger();
  const label = flag(flags, "label", "");
  for (const seed of seedsOf(flags, "1")) {
    const started = Date.now();
    const summary = measureSingleForagerComparison(seed);
    const wallMs = Date.now() - started;
    const runId = recordRun(
      db,
      {
        experiment: "single-forager-comparison",
        label,
        driver: "matched-pair",
        seed,
        ticks: SINGLE_FORAGER_GATE.maxTicks,
        cadence: 0,
        params: { gate: SINGLE_FORAGER_GATE },
        patches: [],
        summary,
        wallMs,
      },
      [],
      []
    );
    console.log(`[run ${runId}] seed=${seed} ${JSON.stringify(summary)}`);
  }
}

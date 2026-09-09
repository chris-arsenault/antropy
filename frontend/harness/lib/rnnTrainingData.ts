import { programmedForager } from "../../src/sim/policies/programmed";
import { sense } from "../../src/sim/sensors";
import { type World } from "../../src/sim/types";
import { createWorld, stepWorld, stepWorldWithRnn } from "../../src/sim/world";
import { type SequenceFrame } from "./rnnSequenceTraining";
import { actionCategory, actionsMatch, trainingTargets } from "./rnnTrainingTargets";

export type RnnTrainingSample = SequenceFrame;

function addSample(buckets: Map<string, RnnTrainingSample[]>, inputs: Float32Array): void {
  const action = programmedForager.act(inputs);
  const category = actionCategory(action);
  const bucket = buckets.get(category) ?? [];
  bucket.push({ inputs, targets: trainingTargets(action), category });
  buckets.set(category, bucket);
}

function stepRollout(world: World, rollout: "programmed" | "rnn", genome?: Float32Array): void {
  if (rollout === "programmed") {
    stepWorld(world);
    return;
  }
  if (!genome) throw new Error("RNN rollout requires a candidate genome");
  stepWorldWithRnn(world, genome);
}

function collectWorld(
  world: World,
  maximumTicks: number,
  buckets: Map<string, RnnTrainingSample[]>,
  rollout: "programmed" | "rnn",
  genome?: Float32Array
): void {
  while (world.tick < maximumTicks && world.metrics.foodDeposited < 5) {
    stepRollout(world, rollout, genome);
    const expected = programmedForager.act(world.ant.lastInputs);
    if (rollout === "programmed" || !actionsMatch(world.ant.lastAction, expected)) {
      addSample(buckets, Float32Array.from(world.ant.lastInputs));
    }
  }
}

function evenlySample(samples: readonly RnnTrainingSample[], cap: number): RnnTrainingSample[] {
  if (samples.length <= cap) return [...samples];
  return Array.from(
    { length: cap },
    (_, index) => samples[Math.floor(((index + 0.5) * samples.length) / cap)]
  );
}

function balanceBuckets(
  buckets: ReadonlyMap<string, readonly RnnTrainingSample[]>,
  cap: number
): RnnTrainingSample[] {
  const sampled = [...buckets.values()].map((bucket) => evenlySample(bucket, cap));
  if (sampled.length === 0) return [];
  const size = Math.max(...sampled.map((bucket) => bucket.length));
  return sampled.flatMap((bucket) =>
    Array.from({ length: size }, (_, index) => bucket[index % bucket.length])
  );
}

export function collectBalancedFrames(
  seeds: readonly number[],
  maximumTicks: number,
  cap: number,
  rollout: "programmed" | "rnn",
  genome?: Float32Array
): RnnTrainingSample[] {
  const buckets = new Map<string, RnnTrainingSample[]>();
  for (const seed of seeds) {
    collectWorld(createWorld(seed, rollout), maximumTicks, buckets, rollout, genome);
  }
  return balanceBuckets(buckets, cap);
}

function captureHeadingCoverage(world: World, buckets: Map<string, RnnTrainingSample[]>): void {
  const originalHeading = world.ant.heading;
  const originalCargo = world.ant.cargo;
  for (const carrying of [false, true]) {
    world.ant.cargo = carrying ? world.config.cropCapacity : 0;
    for (let heading = 0; heading < 8; heading++) {
      world.ant.heading = heading;
      addSample(buckets, sense(world, world.ant));
    }
  }
  world.ant.heading = originalHeading;
  world.ant.cargo = originalCargo;
}

export function collectHeadingCoverage(
  seeds: readonly number[],
  maximumTicks: number,
  cadence: number,
  cap: number
): RnnTrainingSample[] {
  const buckets = new Map<string, RnnTrainingSample[]>();
  for (const seed of seeds) {
    const world = createWorld(seed, "programmed");
    while (world.tick < maximumTicks && world.metrics.foodDeposited < 5) {
      stepWorld(world);
      if (world.tick % cadence === 0) captureHeadingCoverage(world, buckets);
    }
  }
  return balanceBuckets(buckets, cap);
}

export function collectSequences(
  seeds: readonly number[],
  maximumTicks: number,
  rollout: "programmed" | "rnn" = "programmed",
  genome?: Float32Array
): RnnTrainingSample[][] {
  return seeds.map((seed) => {
    const world = createWorld(seed, rollout);
    const sequence: RnnTrainingSample[] = [];
    while (world.tick < maximumTicks && world.metrics.foodDeposited < 5) {
      stepRollout(world, rollout, genome);
      const inputs = Float32Array.from(world.ant.lastInputs);
      const action = programmedForager.act(inputs);
      sequence.push({ inputs, targets: trainingTargets(action), category: actionCategory(action) });
    }
    return sequence;
  });
}

export function rebalance(samples: readonly RnnTrainingSample[]): RnnTrainingSample[] {
  const buckets = new Map<string, RnnTrainingSample[]>();
  for (const sample of samples) {
    const bucket = buckets.get(sample.category) ?? [];
    bucket.push(sample);
    buckets.set(sample.category, bucket);
  }
  return balanceBuckets(buckets, Number.POSITIVE_INFINITY);
}

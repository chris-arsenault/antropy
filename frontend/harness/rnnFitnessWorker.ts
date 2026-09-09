import { Input } from "../src/sim/controller/contract";
import { createWorld, stepWorldWithRnn } from "../src/sim/world";

interface Job {
  readonly vectors: readonly number[][];
  readonly seeds: readonly number[];
  readonly ticks: number;
}

export interface RnnFitness {
  readonly score: number;
  readonly worst: number;
  readonly deposits: number;
  readonly pickups: number;
}

function runWorld(genome: Float32Array, seed: number, ticks: number): RnnFitness {
  const world = createWorld(seed, "rnn");
  let maximumHomeSignal = 0;
  let touchedCache = false;
  while (world.tick < ticks && world.metrics.foodDeposited < 2) {
    stepWorldWithRnn(world, genome);
    if (world.ant.cargo > 0) {
      maximumHomeSignal = Math.max(maximumHomeSignal, world.ant.lastInputs[Input.NEST_CENTER]);
      touchedCache ||= world.ant.lastInputs[Input.CONTACT_CACHE] > 0;
    }
  }
  const deposits = world.metrics.foodDeposited;
  const pickups = world.metrics.foodPickedUp;
  const score =
    deposits * 10_000 +
    (pickups - deposits) * 1_000 +
    (touchedCache ? 2_000 : 0) +
    maximumHomeSignal * 300 +
    world.ant.distanceMoved * 0.002 -
    world.metrics.failedMoves * 0.02 -
    world.ant.immediateTurnReversals * 0.01;
  return { score, worst: score, deposits, pickups };
}

function evaluate(vector: readonly number[], seeds: readonly number[], ticks: number): RnnFitness {
  const genome = Float32Array.from(vector);
  const runs = seeds.map((seed) => runWorld(genome, seed, ticks));
  return {
    score: runs.reduce((total, run) => total + run.score, 0) / runs.length,
    worst: Math.min(...runs.map((run) => run.score)),
    deposits: runs.reduce((total, run) => total + run.deposits, 0),
    pickups: runs.reduce((total, run) => total + run.pickups, 0),
  };
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const job = JSON.parse(input) as Job;
  process.stdout.write(
    JSON.stringify(job.vectors.map((vector) => evaluate(vector, job.seeds, job.ticks)))
  );
});

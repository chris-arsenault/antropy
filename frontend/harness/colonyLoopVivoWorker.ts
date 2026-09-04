import { Input, INPUT_COUNT, Output } from "../src/sim/controller/contract";
import { rnnController, setRuntimeSeedBase } from "../src/sim/controller/rnn";
import { seededCacheEpisode } from "./experiments/colonyLoop";

interface Job {
  vector: number[];
  worldSeeds: number[];
  ticks: number;
}

function numberOf(summary: Record<string, unknown>, key: string, fallback = 0): number {
  const value = summary[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function flagOf(summary: Record<string, unknown>, key: string): number {
  return summary[key] === true ? 1 : 0;
}

function outputs(vector: number[], entries: readonly (readonly [number, number])[]): Float32Array {
  const inputs = new Float32Array(INPUT_COUNT);
  inputs[Input.BIAS] = 1;
  for (const [index, value] of entries) inputs[index] = value;
  const genome = rnnController.deserializeGenome(Float32Array.from(vector));
  return Float32Array.from(rnnController.act(genome, inputs, rnnController.createState()).outputs);
}

function assaysPass(vector: number[]): boolean {
  const foodLeft = outputs(vector, [
    [Input.FOOD_SCENT_LEFT, 0.8],
    [Input.FOOD_SCENT_RIGHT, 0.2],
  ]);
  const foodRight = outputs(vector, [
    [Input.FOOD_SCENT_LEFT, 0.2],
    [Input.FOOD_SCENT_RIGHT, 0.8],
  ]);
  const unloadedNest = outputs(vector, [
    [Input.NEST_SCENT_LEFT, 0.8],
    [Input.NEST_SCENT_RIGHT, 0.2],
  ]);
  const slopeUp = outputs(vector, [[Input.FACING_SLOPE, 1]]);
  const slopeDown = outputs(vector, [[Input.FACING_SLOPE, -1]]);
  const loaded = outputs(vector, [
    [Input.CARRY_LOAD, 0.5],
    [Input.CARRIED_MATERIAL, 0.5],
    [Input.CONTACT_FOOD, 1],
    [Input.FOOD_SCENT_RIGHT, 0.8],
    [Input.NEST_SCENT_LEFT, 0.8],
    [Input.NEST_SCENT_RIGHT, 0.2],
  ]);
  const hungry = outputs(vector, [
    [Input.CONTACT_FOOD, 1],
    [Input.ENERGY, 0.2],
  ]);
  const sated = outputs(vector, [
    [Input.CONTACT_FOOD, 1],
    [Input.ENERGY, 0.9],
  ]);
  const away = outputs(vector, [
    [Input.CARRY_LOAD, 0.5],
    [Input.CARRIED_MATERIAL, 0.5],
    [Input.NEST_SCENT_LEFT, 0.1],
    [Input.NEST_SCENT_RIGHT, 0.1],
    [Input.LOCAL_SOLIDITY, 0.1],
  ]);
  const home = outputs(vector, [
    [Input.CARRY_LOAD, 0.5],
    [Input.CARRIED_MATERIAL, 0.5],
    [Input.NEST_SCENT_LEFT, 0.8],
    [Input.NEST_SCENT_RIGHT, 0.8],
    [Input.LOCAL_SOLIDITY, 0.7],
  ]);
  return [
    foodLeft[Output.TURN] > 0.5,
    foodRight[Output.TURN] < -0.5,
    unloadedNest[Output.TURN] < -0.5,
    slopeUp[Output.VERTICAL_BIAS] > 0.33,
    slopeDown[Output.VERTICAL_BIAS] < -0.33,
    loaded[Output.TURN] > 0.5,
    loaded[Output.FORWARD] > 0.5,
    hungry[Output.EAT] > 0.5,
    hungry[Output.DIG] < 0.5,
    sated[Output.EAT] < 0.5,
    sated[Output.DIG] > 0.5,
    away[Output.DIG] < 0.5,
    home[Output.DIG] > 0.5,
  ].every(Boolean);
}

function score(summary: Record<string, unknown>): number {
  const foodDistance = numberOf(summary, "minFoodDistance", 20);
  const homeDistance = numberOf(summary, "minLoadedEntranceDistance", 20);
  const final = summary.final as { energy?: unknown } | undefined;
  const energy = typeof final?.energy === "number" ? Math.max(-2, final.energy) : -2;
  return (
    flagOf(summary, "exited") * 4 +
    Math.max(0, 6 - foodDistance) +
    flagOf(summary, "pickedUp") * 12 +
    Math.max(0, 8 - homeDistance) * flagOf(summary, "pickedUp") +
    flagOf(summary, "returned") * 18 +
    flagOf(summary, "deposited") * 12 +
    flagOf(summary, "cacheGrew") * 24 +
    flagOf(summary, "cacheDrained") * 24 +
    flagOf(summary, "foodMassConserved") * 2 +
    energy
  );
}

function evaluate(job: Job): Record<string, unknown> {
  if (!assaysPass(job.vector)) return { fitness: -1000, runs: [], assaysPassed: false };
  setRuntimeSeedBase(job.vector);
  try {
    const runs = job.worldSeeds.map((seed) => seededCacheEpisode(seed, job.ticks, 0).summary);
    return {
      fitness: runs.reduce((sum, run) => sum + score(run), 0) / runs.length,
      runs,
      assaysPassed: true,
    };
  } finally {
    setRuntimeSeedBase(null);
  }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  process.stdout.write(JSON.stringify(evaluate(JSON.parse(input) as Job)));
});

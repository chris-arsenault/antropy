import { setRuntimeSeedBase } from "../src/sim/controller/rnn";
import { energyEpisode, energySeedEpisode } from "./experiments/colonyLoopEnergy";
import { applyPatches } from "./lib/patch";

interface Job {
  vector?: number[];
  worldSeeds: number[];
  ticks: number;
  patches?: string[];
  policy?: "programmed" | "rnn";
}

export interface ColonyEnergyVerdict {
  balances: number[];
  positiveCount: number;
  medianBalance: number;
  meanBalance: number;
  worstBalance: number;
  meanGathered: number;
  meanBurned: number;
  meanPheromoneEnergyBurned: number;
}

function numberOf(summary: Record<string, unknown>, key: string): number {
  const value = summary[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
}

function evaluate(job: Job): ColonyEnergyVerdict {
  const restore = applyPatches(job.patches ?? []);
  if (job.policy !== "programmed") {
    if (!job.vector) throw new Error("RNN energy job requires a controller vector");
    setRuntimeSeedBase(job.vector);
  }
  try {
    const episode = job.policy === "programmed" ? energyEpisode : energySeedEpisode;
    const summaries = job.worldSeeds.map((seed) => episode(seed, job.ticks, 0).summary);
    const balances = summaries.map((summary) => numberOf(summary, "balance"));
    return {
      balances,
      positiveCount: balances.filter((balance) => balance > 0).length,
      medianBalance: median(balances),
      meanBalance: mean(balances),
      worstBalance: Math.min(...balances),
      meanGathered: mean(summaries.map((summary) => numberOf(summary, "gathered"))),
      meanBurned: mean(summaries.map((summary) => numberOf(summary, "burned"))),
      meanPheromoneEnergyBurned: mean(
        summaries.map((summary) => numberOf(summary, "pheromoneEnergyBurned"))
      ),
    };
  } finally {
    setRuntimeSeedBase(null);
    restore();
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

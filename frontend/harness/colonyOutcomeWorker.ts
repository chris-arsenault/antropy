import { setRuntimeSeedBase } from "../src/sim/controller/rnn";
import { exactCacheEpisode, seededCacheEpisode } from "./experiments/colonyLoop";
import { summarizeColonyOutcomes, type ColonyOutcomeVerdict } from "./lib/colonyOutcome";

interface Job {
  vector: number[];
  worldSeeds: number[];
  ticks: number;
  exact?: boolean;
}

function evaluate(job: Job): ColonyOutcomeVerdict {
  const vector = Float32Array.from(job.vector);
  if (job.exact === true) {
    const runs = job.worldSeeds.map(
      (seed) => exactCacheEpisode(seed, job.ticks, 0, vector).summary
    );
    return summarizeColonyOutcomes(runs);
  }
  setRuntimeSeedBase(job.vector);
  try {
    const runs = job.worldSeeds.map((seed) => seededCacheEpisode(seed, job.ticks, 0).summary);
    return summarizeColonyOutcomes(runs);
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

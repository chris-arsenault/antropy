import { createInterface } from "node:readline";
import { type ColonyModel } from "./lib/learnedColony";
import { runColonyOutcome } from "./lib/colonyOutcomeRun";

interface Job {
  model: ColonyModel | null;
  seeds: number[];
  ticks: number;
  deprivation: number;
  warmup: number;
}

const lines = createInterface({ input: process.stdin });
for await (const line of lines) {
  const job = JSON.parse(line) as Job;
  const results = job.seeds.map((seed) =>
    runColonyOutcome(job.model, seed, job.ticks, job.deprivation, job.warmup)
  );
  process.stdout.write(JSON.stringify(results) + "\n");
}

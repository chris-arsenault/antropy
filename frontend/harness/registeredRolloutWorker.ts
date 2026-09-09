import { createInterface } from "node:readline";
import { loadColonyModel, physicsDigest } from "./lib/colonyArtifacts";
import { RegisteredRollouts } from "./lib/registeredRollout";
import { type ColonyWorldCase } from "./lib/colonyWorlds";

const collector = new RegisteredRollouts();
const physics = physicsDigest();
for await (const line of createInterface({ input: process.stdin })) {
  const request = JSON.parse(line) as {
    model: string;
    output: string;
    worlds: ColonyWorldCase[];
    ticks: number;
    warmup: number;
  };
  const model = loadColonyModel(request.model);
  if (model.version !== 5 || model.temperature <= 0)
    throw new Error("rollouts need a stochastic registered model");
  const result = collector.collect({ ...request, model });
  console.log(JSON.stringify({ ...result, physics }));
}

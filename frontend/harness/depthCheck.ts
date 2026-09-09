import { readFileSync, writeFileSync } from "node:fs";
import { createRegisteredWorld, stepWorld } from "../src/sim/world";
import { terrainConfig } from "../src/sim/config";
import { type World } from "../src/sim/types";
import { type RegisteredModel } from "../src/sim/controller/registeredModel";
import { digest, physicsDigest } from "./lib/colonyArtifacts";

function translatedState(world: World, dy: number): string {
  const shift = dy * world.grid.width;
  const fields = ["foodOdor", "nestOdor", "pheromoneA", "pheromoneB", "freshAir"] as const;
  return digest(
    JSON.stringify({
      tick: world.tick,
      random: world.random.value,
      ants: world.ants.map((ant) => ({
        ...ant,
        y: ant.y - dy,
        lastInputs: [...ant.lastInputs],
        controllerState: [...ant.controllerState],
      })),
      queen: { ...world.queen, y: world.queen.y - dy },
      brood: world.brood.map((brood) => ({ ...brood, y: brood.y - dy })),
      economy: world.economy,
      metrics: world.metrics,
      food: [...world.food].map(([index, amount]) => [index - shift, amount]),
      fields: fields.map((key) => {
        const field = world[key],
          active = [...field.activeList.subarray(0, field.activeCount)];
        return {
          active: active.map((index) => index - shift),
          values: active.map((index) => field.values[index]),
        };
      }),
    })
  );
}

const config = terrainConfig("baseline");
const deeperConfig = { ...config, height: 512, surfaceBase: 320 };
const model = JSON.parse(
  readFileSync("src/sim/controller/review-colony.json", "utf8")
) as RegisteredModel;
const shallow = createRegisteredWorld(101, model, config);
const deep = createRegisteredWorld(101, model, deeperConfig);
const samples = [];
for (let tick = 0; tick <= 2000; tick++) {
  if (tick % 100 === 0)
    samples.push({
      tick,
      exact:
        translatedState(shallow, 0) ===
        translatedState(deep, deeperConfig.surfaceBase - config.surfaceBase),
    });
  if (tick < 2000) {
    stepWorld(shallow);
    stepWorld(deep);
  }
}
const result = { physics: physicsDigest(), config, deeperConfig, samples };
writeFileSync(
  "harness/artifacts/architecture-2026-09-07/depth.json",
  JSON.stringify(result, null, 2)
);
console.log(JSON.stringify(samples));
if (samples.some((sample) => !sample.exact)) process.exitCode = 1;

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createWorld, createRegisteredWorld, stepWorld } from "../src/sim/world";
import { terrainConfig, type TerrainLayout } from "../src/sim/config";
import { createCheckpoint } from "../src/persist/checkpoint";
import { type World } from "../src/sim/types";
import { type RegisteredModel } from "../src/sim/controller/registeredModel";
import { digest, physicsDigest } from "./lib/colonyArtifacts";

const root = "harness/artifacts/architecture-2026-09-07";
const model = JSON.parse(
  readFileSync("src/sim/controller/review-colony.json", "utf8")
) as RegisteredModel;

function currentState(world: World): string {
  const checkpoint = createCheckpoint(world);
  const state = Object.fromEntries(
    Object.entries(checkpoint).filter(
      ([key]) => !["config", "version", "terrain", "mechanisms"].includes(key)
    )
  );
  return digest(JSON.stringify(state));
}

function baselineState(world: World): string {
  const fields = ["foodOdor", "nestOdor", "pheromoneA", "pheromoneB", "freshAir"] as const;
  return digest(
    JSON.stringify({
      tick: world.tick,
      random: world.random.value,
      grid: [...world.grid.cells],
      nest: world.nest,
      cache: world.cache,
      food: [...world.food],
      renewable: world.renewableSources,
      queen: world.queen,
      brood: world.brood,
      economy: world.economy,
      metrics: world.metrics,
      ants: world.ants.map((ant) => ({
        ...ant,
        lastInputs: [...ant.lastInputs],
        controllerState: [...ant.controllerState],
      })),
      fields: fields.map((key) => {
        const field = world[key],
          active = [...field.activeList.subarray(0, field.activeCount)];
        return { active, values: active.map((index) => field.values[index]) };
      }),
    })
  );
}

function currentComparisons() {
  const before = JSON.parse(readFileSync(`${root}/before.json`, "utf8")) as {
    layout: TerrainLayout;
    actor: string;
    hash: string;
  }[];
  return before.map((row) => {
    const config = terrainConfig(row.layout);
    const world =
      row.actor === "rnn"
        ? createRegisteredWorld(101, model, config)
        : createWorld(101, "programmed-lifecycle", config);
    for (let tick = 0; tick < 100; tick++) stepWorld(world);
    const hash = currentState(world);
    const result = { ...row, afterHash: hash, exact: hash === row.hash };
    console.log(JSON.stringify(result));
    return result;
  });
}

async function originalComparison(directory: string) {
  const original = (await import(
    pathToFileURL(resolve(directory, "src/sim/world.ts")).href
  )) as typeof import("../src/sim/world");
  const world = createRegisteredWorld(101, model, terrainConfig("baseline"));
  const old = original.createRegisteredWorld(101, model);
  const points = [];
  for (let tick = 0; tick <= 2000; tick++) {
    if (tick % 100 === 0) points.push({ tick, exact: baselineState(world) === baselineState(old) });
    if (tick < 2000) {
      stepWorld(world);
      original.stepWorld(old);
    }
  }
  console.log(JSON.stringify({ original: points }));
  return points;
}

const comparisons = currentComparisons();
const original = process.argv[2] ? await originalComparison(process.argv[2]) : [];
writeFileSync(
  `${root}/equivalence.json`,
  JSON.stringify({ physics: physicsDigest(), comparisons, original }, null, 2)
);
if ([...comparisons, ...original].some((row) => !row.exact)) process.exitCode = 1;

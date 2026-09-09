import { integerFlag, flag, type Flags } from "../lib/flags";
import { constructionDriver, recordConstruction } from "../lib/constructionRecord";
import { physicsDigest } from "../lib/colonyArtifacts";
import { colonyOutcomePoint } from "../lib/colonyOutcome";
import { createWorld, stepWorld } from "../../src/sim/world";
import { scenarioConfig } from "../../src/sim/scenarios";
import { pressureArena } from "../lib/pressureArena";
import { localClimate } from "../../src/sim/climate/state";

export function runConstructionPressures(flags: Flags): void {
  const driver = constructionDriver(flags),
    seed = integerFlag(flags, "seed", 101);
  const ticks = integerFlag(flags, "ticks", 1000),
    condition = flag(flags, "condition", "mild");
  const layout = flag(flags, "layout", "arena"),
    excavation = flag(flags, "digging", "true") === "true";
  if (
    !["mild", "thermal", "crowded", "confined", "shelter", "storage", "damp-storage"].includes(
      condition
    )
  )
    throw new Error("invalid condition");
  if (!["arena", "compact", "tiered"].includes(layout)) throw new Error("invalid layout");
  const config = pressureConfig(flags, driver, layout, condition, excavation);
  const world =
    layout === "arena"
      ? pressureArena(driver, seed, condition, excavation)
      : createWorld(seed, driver, config);
  const sourceDigest = physicsDigest(),
    start = performance.now(),
    series = [colonyOutcomePoint(world)];
  for (let i = 0; i < ticks; i++) {
    stepWorld(world);
    if (world.tick % 250 === 0) series.push(colonyOutcomePoint(world));
  }
  const water =
    world.climate.water.reduce((a, b) => a + b, 0) +
    [...world.climate.hydration.values()].reduce((a, b) => a + b, 0);
  const summary = {
    condition,
    layout,
    excavation,
    series,
    jobs: world.construction.jobs,
    interventions: world.construction.interventions,
    excavated: world.construction.excavated,
    deposited: world.construction.deposited,
    caches: [...world.caches],
    queen: { ...world.queen, ...localClimate(world, world.queen) },
    brood: world.brood,
    spoiledEnergy: world.climate.spoiledEnergy,
    waterResidual: world.climate.initialWater + world.climate.boundaryWater - water,
    workers: world.ants.map((ant) => ({
      id: ant.id,
      x: ant.x,
      y: ant.y,
      job: ant.job,
      brood: ant.brood,
      spoil: ant.spoil,
      cargo: ant.cargo,
      history: ant.decision.history,
    })),
  };
  recordConstruction(
    world,
    flags,
    "construction-pressures",
    sourceDigest,
    summary,
    Math.round(performance.now() - start)
  );
}

function pressureConfig(
  flags: Flags,
  driver: ReturnType<typeof constructionDriver>,
  layout: string,
  condition: string,
  excavation: boolean
) {
  const base = scenarioConfig(driver, layout === "tiered" ? "tiered" : "compact");
  return {
    ...base,
    environment: {
      ...base.environment,
      microclimate: true,
      climateEffects: true,
      foodSpoilage: true,
      autonomousConstruction: true,
      excavation,
    },
    climate: {
      ...base.climate,
      initialCavityHeat: Number(flag(flags, "cavity-heat", "0")),
      temperatureAmplitude: Number(
        flag(flags, "temperature-amplitude", condition === "thermal" ? "16" : "0")
      ),
    },
  };
}

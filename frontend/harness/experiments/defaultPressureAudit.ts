import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createWorld, stepWorld } from "../../src/sim/world";
import { withReviewPressures } from "../../src/sim/reviewConfig";
import { scenarioConfig } from "../../src/sim/scenarios";
import { localClimate, thermalExcess } from "../../src/sim/climate/state";
import { type World } from "../../src/sim/types";
import { attachPressureTrace } from "../lib/pressureTrace";
import { colonyOutcomePoint } from "../lib/colonyOutcome";
import { physicsDigest } from "../lib/colonyArtifacts";
import { flag, integerFlag, type Flags } from "../lib/flags";
import { recordConstruction } from "../lib/constructionRecord";
import { colonyWorkProgress } from "../lib/colonyWorkProgress";
import { traceConstructionUse } from "../lib/constructionUse";
import { environmentValue, type EnvironmentConfig } from "../../src/sim/environmentConfig";

function snapshot(world: World) {
  const sites = [...world.habitat.sites.values()];
  const near = sites.filter(
    (site) => Math.abs(site.x - world.queen.x) + Math.abs(site.y - world.queen.y) <= 8
  );
  const floors = near.filter((site) => site.material === 0 && site.supported && !site.occupied);
  return {
    ...colonyOutcomePoint(world),
    queen: { x: world.queen.x, y: world.queen.y, ...localClimate(world, world.queen) },
    observedSites: sites.length,
    nearbyFreeFloors: floors.length,
    nearbyCoolestFloor: floors.length ? Math.min(...floors.map((site) => site.temperature)) : null,
    excavated: world.construction.excavated,
    deposited: world.construction.deposited,
    queenMoves: world.construction.queenMoves,
    caches: world.caches.size,
    completed: { ...world.construction.completed },
    spoiledEnergy: world.climate.spoiledEnergy,
    brood: world.brood.length,
  };
}

function auditWorld(flags: Flags): World {
  const seed = integerFlag(flags, "seed", 101);
  const driver = flag(flags, "driver", "colony-programmed");
  if (driver !== "colony-programmed" && driver !== "colony-lgp") throw new Error("invalid driver");
  const base = withReviewPressures(scenarioConfig(driver, "compact"));
  const excavation = flag(flags, "digging", "true") === "true";
  const nestShape = environmentValue(
    "nestShape",
    flag(flags, "nest", base.environment.nestShape)
  ) as EnvironmentConfig["nestShape"];
  return createWorld(seed, driver, {
    ...base,
    cacheCapacity: integerFlag(flags, "capacity", base.cacheCapacity),
    layingInterval: integerFlag(flags, "laying", base.layingInterval),
    climate: {
      ...base.climate,
      initialCavityHeat: integerFlag(flags, "heat", base.climate.initialCavityHeat),
    },
    environment: { ...base.environment, excavation, nestShape },
  });
}

/** Defaults match the browser; explicit experimental overrides are recorded with the run. */
export function runDefaultPressureAudit(flags: Flags): void {
  const world = auditWorld(flags),
    seed = world.seed,
    ticks = integerFlag(flags, "ticks", 18000),
    excavation = world.config.environment.excavation;
  const digest = physicsDigest(),
    trace = attachPressureTrace(world),
    use = traceConstructionUse(world),
    start = performance.now();
  const output = flag(flags, "output", "harness/artifacts/default-pressure-audit");
  mkdirSync(resolve(output), { recursive: true });
  const series = [snapshot(world)],
    tickTimes: number[] = [];
  let queenThermalExposure = 0;
  for (let i = 0; i < ticks; i++) {
    const before = performance.now();
    stepWorld(world);
    use.sample();
    tickTimes.push(performance.now() - before);
    queenThermalExposure += thermalExcess(localClimate(world, world.queen).temperature);
    if (world.tick % 250 === 0) series.push(snapshot(world));
    if (world.tick % 1000 === 0) {
      console.log(
        JSON.stringify({ excavation, elapsedMs: performance.now() - start, ...series.at(-1) })
      );
      writeFileSync(
        resolve(output, "live.json"),
        JSON.stringify({
          ...series.at(-1),
          activity: colonyWorkProgress(world),
          space: use.summary(),
        })
      );
    }
  }
  trace.detach();
  use.detach();
  tickTimes.sort((a, b) => a - b);
  const summary = {
    series,
    actions: trace.actions,
    sampled: trace.sampled,
    jobs: [...trace.jobs.values()],
    decisions: trace.decisions(),
    queenThermalExposure,
    interventions: world.construction.interventions,
    space: use.summary(),
    timing: {
      median: tickTimes[Math.floor(ticks * 0.5)],
      p95: tickTimes[Math.floor(ticks * 0.95)],
    },
  };
  writeFileSync(
    resolve(output, `trace-${seed}-${excavation}.json`),
    JSON.stringify({ ...summary, examples: trace.examples })
  );
  recordConstruction(
    world,
    flags,
    "default-pressure-audit",
    digest,
    summary,
    Math.round(performance.now() - start)
  );
}

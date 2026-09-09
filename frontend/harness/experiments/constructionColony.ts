import { requestConstruction } from "../../src/sim/construction/sites";
import { type JobKind } from "../../src/sim/construction/state";
import { type Point } from "../../src/sim/geometry";
import { createWorld, stepWorld } from "../../src/sim/world";
import { scenarioConfig } from "../../src/sim/scenarios";
import { integerFlag, type Flags } from "../lib/flags";
import { recordConstruction, constructionDriver } from "../lib/constructionRecord";
import { physicsDigest } from "../lib/colonyArtifacts";
import { constructionSites } from "../lib/constructionSites";
import { colonyOutcomePoint } from "../lib/colonyOutcome";

export function runConstructionColony(flags: Flags): void {
  const driver = constructionDriver(flags);
  const seed = integerFlag(flags, "seed", 101),
    ticks = integerFlag(flags, "ticks", 2000);
  const config = scenarioConfig(driver, "compact"),
    sourceDigest = physicsDigest();
  const world = createWorld(seed, driver, config),
    sites = constructionSites(world);
  const sequence: [JobKind, Point][] = [
    ["dig", sites.dig],
    ["queen", sites.queen],
    ["cache", sites.cache],
    ["move-cache", sites.moved],
  ];
  const series = [colonyOutcomePoint(world)],
    start = performance.now();
  for (let i = 0; i < ticks; i++) {
    if (i % 500 === 0 && i / 500 < sequence.length) {
      const [kind, point] = sequence[i / 500];
      requestConstruction(world, kind, point, sites.dump, kind === "move-cache" ? -3 : null);
    }
    stepWorld(world);
    if (world.tick % 500 === 0) series.push(colonyOutcomePoint(world));
  }
  const summary = {
    sites,
    jobs: world.construction.jobs,
    series,
    workers: world.ants.map((ant) => ({
      id: ant.id,
      job: ant.job,
      x: ant.x,
      y: ant.y,
      spoil: ant.spoil,
      cargo: ant.cargo,
      history: ant.decision.history,
    })),
    caches: [...world.caches],
    excavated: world.construction.excavated,
    deposited: world.construction.deposited,
  };
  recordConstruction(
    world,
    flags,
    "construction-colony",
    sourceDigest,
    summary,
    Math.round(performance.now() - start)
  );
}

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createWorld, stepWorld } from "../../src/sim/world";
import { scenarioConfig } from "../../src/sim/scenarios";
import { withReviewPressures } from "../../src/sim/reviewConfig";
import { traceBehavior } from "../lib/behaviorTrace";
import { traceConstructionUse } from "../lib/constructionUse";
import { colonyOutcomePoint } from "../lib/colonyOutcome";
import { recordConstruction, constructionDriver } from "../lib/constructionRecord";
import { physicsDigest } from "../lib/colonyArtifacts";
import { flag, integerFlag, type Flags } from "../lib/flags";
import { collectiveArena } from "../lib/collectiveArena";
import { growthSnapshot } from "../../src/sim/reproduction";
import { nestArea } from "../../src/sim/construction/nestArea";
import { writeNestSection } from "../lib/nestSection";
import { encodeCheckpoint } from "../../src/persist/checkpoint";

export function runCollectiveWork(flags: Flags): void {
  const driver = constructionDriver(flags),
    config = withReviewPressures(scenarioConfig(driver, "compact"));
  const arena = flag(flags, "arena", "false") === "true";
  const enabled = flag(flags, "collective", String(config.environment.collectiveWork)) === "true";
  const world = arena
    ? collectiveArena(driver, enabled)
    : createWorld(integerFlag(flags, "seed", 101), driver, {
        ...config,
        layingInterval: integerFlag(flags, "laying", config.layingInterval),
        environment: {
          ...config.environment,
          collectiveWork: enabled,
          excavation: flag(flags, "digging", "true") === "true",
        },
      });
  const output = flag(flags, "output", "harness/artifacts/collective-work");
  mkdirSync(resolve(output), { recursive: true });
  const trace = traceBehavior(world),
    use = traceConstructionUse(world);
  const digest = physicsDigest(),
    start = performance.now(),
    series = [{ ...colonyOutcomePoint(world), ...growthSnapshot(world) }];
  const ticks = integerFlag(flags, "ticks", 2000);
  trace.sample();
  for (let i = 0; i < ticks; i++) {
    stepWorld(world);
    use.sample();
    if (world.tick % 20 === 0) trace.sample();
    if (world.tick % 250 === 0)
      series.push({ ...colonyOutcomePoint(world), ...growthSnapshot(world) });
    if (world.tick % 1000 === 0) {
      writeFileSync(resolve(output, "latest.json"), encodeCheckpoint(world));
      console.log(
        JSON.stringify({
          ...series.at(-1),
          area: nestArea(world),
          excavated: world.construction.excavated,
          counts: trace.counts,
        })
      );
    }
  }
  trace.detach();
  use.detach();
  if (world.tick % 20 !== 0) trace.sample();
  if (series.at(-1)!.tick !== world.tick)
    series.push({ ...colonyOutcomePoint(world), ...growthSnapshot(world) });
  const summary = {
    arena,
    series,
    counts: trace.counts,
    behavior: world.behavior.counts,
    space: use.summary(),
  };
  writeFileSync(
    resolve(output, "behavior.json"),
    JSON.stringify({
      ...summary,
      initialGrid: trace.initialGrid,
      events: trace.events,
      frames: trace.frames,
    })
  );
  recordConstruction(
    world,
    flags,
    "collective-work",
    digest,
    summary,
    Math.round(performance.now() - start)
  );
  writeNestSection(world, trace.initialGrid, output);
}

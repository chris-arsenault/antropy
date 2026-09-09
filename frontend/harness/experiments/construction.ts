import { constructionFixture } from "../../src/sim/construction/fixture";
import { requestConstruction } from "../../src/sim/construction/sites";
import { type JobKind } from "../../src/sim/construction/state";
import { stepWorld } from "../../src/sim/world";
import { Material } from "../../src/sim/materials";
import { setCell } from "../../src/sim/grid";
import { energyResidual } from "../../src/sim/resources";
import { integerFlag, type Flags } from "../lib/flags";
import { recordConstruction, constructionDriver } from "../lib/constructionRecord";
import { physicsDigest } from "../lib/colonyArtifacts";

export function runConstruction(flags: Flags): void {
  const driver = constructionDriver(flags);
  const seed = integerFlag(flags, "seed", 1),
    limit = integerFlag(flags, "ticks", 1000);
  const { world, source } = constructionFixture(driver, seed);
  const sourceDigest = physicsDigest();
  setCell(world.grid, 30, 21, [Material.SOIL, Material.CLAY, Material.WOOD][seed % 3]);
  const counts: Record<string, number> = {},
    stages = [];
  const start = performance.now();
  for (const [kind, x] of [
    ["dig", 30],
    ["queen", 29],
    ["cache", 44],
    ["move-cache", 48],
  ] as [JobKind, number][]) {
    const job = requestConstruction(
      world,
      kind,
      { x, y: 21 },
      { x: 34, y: 21 },
      kind === "move-cache" ? source : null
    );
    const begin = world.tick;
    for (let i = 0; i < limit && job.status !== "done"; i++) {
      stepWorld(world);
      const last = world.ant.decision.history.at(-1)!;
      const key = `${last.request.kind}:${last.result}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    stages.push({
      kind,
      status: job.status,
      ticks: world.tick - begin,
      ant: { x: world.ant.x, y: world.ant.y, cargo: world.ant.cargo, spoil: world.ant.spoil },
      history: structuredClone(world.ant.decision.history),
    });
    if (job.status !== "done") break;
  }
  const summary = {
    valid: stages.length === 4 && stages.every((stage) => stage.status === "done"),
    stages,
    counts,
    residual: energyResidual(world),
    caches: [...world.caches],
    food: [...world.food],
    excavated: world.construction.excavated,
    deposited: world.construction.deposited,
    queen: world.queen,
  };
  recordConstruction(
    world,
    flags,
    "construction",
    sourceDigest,
    summary,
    Math.round(performance.now() - start)
  );
}

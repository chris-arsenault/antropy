import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createWorld } from "../../src/sim/world";
import { controller, type Genome } from "../../src/sim/controller";
import { type Config } from "../../src/sim/config";
import { measure, sourceDigest } from "./bacteriaRun";
import { openLedger, recordRun } from "./ledger";
import { prepareCompetition } from "./competitionIdentity";

function competition(
  ancestor: Genome,
  descendant: Genome,
  config: Config,
  seed: number,
  ticks: number,
  swap: boolean
) {
  const world = createWorld(seed, { ...config, mutationRate: 0 });
  world.genomes.get(1)!.genome = ancestor;
  world.genomes.set(2, { id: 2, parent: null, born: 0, genome: descendant });
  world.nextGenome = 3;
  for (const [i, c] of world.cells.entries()) {
    c.genome = ((i + Number(swap)) % 2) + 1;
    world.ancestry.get(c.id)!.genome = c.genome;
  }
  const result = measure(world, ticks, 100);
  const counts = [1, 2].map((g) => world.cells.filter((c) => c.genome === g).length);
  return {
    seed,
    regime: config.regime,
    swap,
    counts,
    wallMs: result.wallMs,
    final: result.final,
    series: result.series.map((s) => ({
      tick: s.tick,
      population: s.population,
      genomes: s.genomes,
    })),
  };
}
export function compareCheckpoint(
  path: string,
  candidate: number,
  seeds: number[],
  ticks: number,
  output: string
): void {
  const digest = sourceDigest();
  const { saved, ancestor, descendant, identity } = prepareCompetition(
    readFileSync(path, "utf8"),
    candidate
  );
  const results = [];
  for (const regime of ["persistent", "transient"] as const)
    for (const seed of seeds)
      for (const swap of [false, true])
        results.push(
          competition(ancestor, descendant, { ...saved.config, regime }, seed, ticks, swap)
        );
  const params = {
    config: saved.config,
    candidate,
    path,
    seeds,
    identity,
    sourceDigest: digest,
    sourceDigestAfter: sourceDigest(),
  };
  const db = openLedger();
  const id = recordRun(db, {
    experiment: "bacteria-competition",
    label: `ancestor 1 versus observed genotype ${candidate}`,
    driver: controller.id,
    seed: seeds[0],
    ticks,
    params,
    summary: { results },
    wallMs: results.reduce((s, r) => s + r.wallMs, 0),
  });
  db.close();
  mkdirSync(output, { recursive: true });
  writeFileSync(
    join(output, `competition-${id}.json`),
    JSON.stringify({ id, ...params, results }, null, 2)
  );
  console.log(
    JSON.stringify({
      id,
      results: results.map(({ seed, regime, swap, counts }) => ({ seed, regime, swap, counts })),
    })
  );
}

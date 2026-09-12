import { type World } from "../src/sim/types";
import { type Config } from "../src/sim/config";
import { type Genotype } from "../src/sim/genetics/genotype";
import { createRandomState, nextRandom } from "../src/sim/random";
import { createWorld } from "../src/sim/world";

/** Individual-weighted sample with replacement. No genotype or success filtering. */
export function sampleCohort(world: World, seed: number, count = 24) {
  const cells = [...world.cells].sort((a, b) => a.id - b.id),
    rng = createRandomState(seed);
  if (!cells.length) throw new Error("Cannot sample an extinct population");
  return Array.from({ length: count }, () => {
    const cell = cells[Math.floor(nextRandom(rng) * cells.length)];
    return { cell: cell.id, record: cell.genome, genome: world.genomes.get(cell.genome)!.genome };
  });
}
export function cohortWorld(
  pre: readonly Genotype[],
  post: readonly Genotype[],
  config: Config,
  seed: number,
  share: number,
  swap: boolean
) {
  if (pre.length !== post.length || !pre.length)
    throw new Error("Cohorts require equal nonzero sizes");
  const world = createWorld(seed, {
    ...config,
    founders: 2 * pre.length,
    mutationRate: 0,
    physicalMutationRate: 0,
    transmission: "clonal",
    learningRetention: 0,
    foodEpochs: { phaseTicks: 50000, shares: [share] },
    foodZones: undefined,
  });
  world.genomes.clear();
  const postIds = new Set<number>();
  for (const [i, cell] of world.cells.entries()) {
    const isPost = (i + Number(swap)) % 2 === 1;
    const genome = (isPost ? post : pre)[Math.floor(i / 2)],
      id = i + 1;
    world.genomes.set(id, { id, parent: null, born: 0, learned: 0, genome });
    cell.genome = id;
    world.ancestry.get(cell.id)!.genome = id;
    if (isPost) postIds.add(id);
  }
  world.nextGenome = world.cells.length + 1;
  return { world, postIds };
}
export function cohortCounts(world: World, postIds: Set<number>) {
  const post = world.cells.filter((c) => postIds.has(c.genome)).length;
  return {
    pre: world.cells.length - post,
    post,
    postShare: world.cells.length ? (100 * post) / world.cells.length : null,
  };
}

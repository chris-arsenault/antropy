import { type Engine, type EngineWorld } from "../src/engine/client";
import { type EngineConfig, type Genotype } from "../src/engine/types";
import { readFrame } from "./lib/longRun";
import { samplingRandom } from "./lib/samplingRandom";
import { assignPopulation } from "./lib/engineFixtures";

/** Individual-weighted draws with replacement; no genotype or success filtering. */
export function sampleCohort(world: EngineWorld, seed: number, count = 24) {
  const cells = readFrame(world).cells.sort((a, b) => a.id - b.id),
    random = samplingRandom(seed);
  if (!cells.length) throw new Error("Cannot sample an extinct population");
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000)
    throw new Error("Invalid cohort size");
  return Array.from({ length: count }, () => {
    const cell = cells[Math.floor(random() * cells.length)];
    return {
      cell: cell.id,
      record: cell.genome,
      genome: world.command<Genotype>("genotype", { id: cell.genome }),
    };
  });
}
export function cohortWorld(
  engine: Engine,
  pre: readonly Genotype[],
  post: readonly Genotype[],
  config: EngineConfig,
  seed: number,
  share: number,
  swap: boolean
) {
  if (pre.length !== post.length || !pre.length)
    throw new Error("Cohorts require equal nonzero sizes");
  if (config.sourceSpecies.length !== 2 || !Number.isFinite(share) || share < 0 || share > 1)
    throw new Error("Two-species fractional source mixture required");
  const world = engine.create(seed, {
    ...config,
    founders: 2 * pre.length,
    mutationRate: 0,
    physicalMutationRate: 0,
    transmission: "clonal",
    transferRate: 0,
    learningRetention: 0,
    sourceEpochs: { phaseTicks: 50000, mixtures: [[share, 1 - share]] },
    sourceZones: null,
  });
  const postIds = new Set<number>();
  const variants = readFrame(world).cells.map((cell, i) => {
    const isPost = (i + Number(swap)) % 2 === 1;
    if (isPost) postIds.add(cell.lineage);
    return { label: isPost ? "post" : "pre", genotype: (isPost ? post : pre)[Math.floor(i / 2)] };
  });
  try {
    assignPopulation(world, variants, (i) => i);
  } catch (error) {
    world.dispose();
    throw error;
  }
  return { world, postIds };
}
export function cohortCounts(world: EngineWorld, postIds: Set<number>) {
  const cells = readFrame(world).cells,
    post = cells.filter((c) => postIds.has(c.lineage)).length;
  return {
    pre: cells.length - post,
    post,
    postShare: cells.length ? (100 * post) / cells.length : null,
  };
}

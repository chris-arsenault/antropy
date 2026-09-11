import { type World } from "./types";
import { BODY_PARTS, type Body } from "./body";
import { blueprint } from "./phenotype";
import { express } from "./genetics/genotype";
import { distinctSequences } from "./genetics/identity";
import { controller } from "./controller";

export function distribution(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (p: number) => sorted[Math.round((sorted.length - 1) * p)];
  return {
    min: sorted[0],
    p10: percentile(0.1),
    median: percentile(0.5),
    p90: percentile(0.9),
    max: sorted[sorted.length - 1],
    mean: sorted.reduce((s, v) => s + v, 0) / sorted.length,
  };
}
export function lineageCounts(world: World): [number, number][] {
  const counts = new Map<number, number>();
  for (const cell of world.cells) counts.set(cell.lineage, (counts.get(cell.lineage) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
}
export function inheritedStats(world: World) {
  const targets: Body[] = [],
    ratios: Body[] = [],
    distances: number[] = [];
  const records = new Map(world.cells.map((c) => [c.genome, world.genomes.get(c.genome)!.genome]));
  const data = new Map<string, { target: Body; ratio: Body; distance: number }>();
  for (const cell of world.cells) {
    const founderId = world.ancestry.get(cell.lineage)!.genome,
      key = `${cell.genome}/${founderId}`;
    let cached = data.get(key);
    if (!cached) {
      const genome = records.get(cell.genome)!,
        founder = world.genomes.get(founderId)!.genome;
      const target = blueprint(genome, world.config),
        baseline = blueprint(founder, world.config);
      const ratio = Object.fromEntries(
        BODY_PARTS.map((part) => [part, target[part] / baseline[part]])
      ) as Body;
      cached = {
        target,
        ratio,
        distance: controller.genomeDistance(express(genome).behavior, express(founder).behavior),
      };
      data.set(key, cached);
    }
    targets.push(cached.target);
    ratios.push(cached.ratio);
    distances.push(cached.distance);
  }
  const traits = BODY_PARTS.map((part) => ({
    part,
    target: distribution(targets.map((t) => t[part])),
    relative: distribution(ratios.map((t) => t[part])),
  }));
  const lineages = lineageCounts(world),
    population = world.cells.length;
  const concentration = lineages.reduce((s, [, n]) => s + (n / Math.max(1, population)) ** 2, 0);
  return {
    uniqueSequences: distinctSequences(records.values()),
    genomeRecords: records.size,
    traits,
    controllerDistance: distribution(distances),
    livingLineages: lineages.length,
    largestLineage: lineages[0]?.[0] ?? null,
    largestShare: (lineages[0]?.[1] ?? 0) / Math.max(1, population),
    effectiveLineages: concentration > 0 ? 1 / concentration : 0,
    originalFoundersAlive: world.cells.filter((c) => c.parent === null).length,
  };
}

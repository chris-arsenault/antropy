/**
 * Mutual-invasibility assay for actual evolved genotypes. Clusters a checkpoint's living cells
 * by inherited construction traits, takes each cluster's medoid genotype and runs rare-invasion
 * contests between those genotypes in a fresh zoned world. Clustering describes; it never
 * selects parents in the source population, and no genotype is promoted anywhere.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { restoreWorld } from "../../src/persist/checkpoint";
import { strategyClusters } from "../../src/observe/clusters";
import { type World } from "../../src/sim/types";
import { encodeGenotype } from "../../src/sim/genetics/codec";
import { zoneScenario, zoneSettings, runZoneCase, type Variant } from "./zonesContest";
import { type Flags, flag, integerFlag } from "./flags";

/** Each cluster's medoid genotype, with the cluster description for provenance. */
export function clusterCheckpoint(world: World, k: number) {
  if (world.cells.length < k) throw new Error("Fewer living cells than clusters");
  const snapshot = strategyClusters(world, k);
  const summaries = snapshot.clusters.map((c) => ({
    cluster: c.rank,
    size: c.size,
    leftBand: c.leftBand,
    center: c.center,
    medoidGenome: world.cells[c.medoid].genome,
    medoidCell: world.cells[c.medoid].id,
  }));
  const variants: Variant[] = snapshot.clusters.map((c) => ({
    label: `cluster-${c.rank}`,
    genome: world.genomes.get(world.cells[c.medoid].genome)!.genome,
  }));
  return { summaries, variants };
}

export function runInvasion(flags: Flags): void {
  const path = flag(flags, "checkpoint", "");
  if (!path) throw new Error("--checkpoint <file> is required");
  const text = readFileSync(path, "utf8"),
    world = restoreWorld(text);
  const k = integerFlag(flags, "k", 2),
    ticks = integerFlag(flags, "ticks", 12000);
  const { summaries, variants } = clusterCheckpoint(world, k);
  const root = flag(flags, "output", "harness/artifacts/invasion");
  mkdirSync(root, { recursive: true });
  const provenance = {
    sourceCheckpoint: path,
    sourceSha256: createHash("sha256").update(text).digest("hex"),
    sourceTick: world.tick,
    clusters: summaries,
    medoids: variants.map((v) => ({ label: v.label, genome: encodeGenotype(v.genome) })),
  };
  writeFileSync(join(root, "clusters.json"), JSON.stringify(provenance, null, 2));
  console.log(JSON.stringify(summaries));
  // The contest world follows --world (default mixed) and inherits the checkpoint's cycle,
  // membrane crowding and deposit supply, so the medoids compete under the economy they evolved in.
  const layout =
    flag(flags, "world", "mixed") === "zones" ? ("zones" as const) : ("mixed" as const);
  const s = {
    ...zoneSettings(flags),
    world: layout,
    cycle: world.config.cycle ?? null,
    crowding: world.config.machineryCrowding,
    sourceRate: world.config.sourceRate,
  };
  for (const variant of variants)
    runZoneCase(
      zoneScenario(`invade-${variant.label}`, variants, s, variant.label, provenance),
      root,
      integerFlag(flags, "seed", 901),
      ticks,
      false,
      integerFlag(flags, "wall", 600)
    );
}

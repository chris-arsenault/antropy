/**
 * Mutual-invasibility assay for actual evolved genotypes. Clusters a checkpoint's living cells
 * by inherited construction traits, takes each cluster's medoid genotype and runs rare-invasion
 * contests between those genotypes in a fresh zoned world. Clustering describes; it never
 * selects parents in the source population, and no genotype is promoted anywhere.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import { type Genotype, type Definition } from "../../src/engine/types";
import { loadEngine } from "../numerical/engine";
import { checkpointSource } from "./checkpointSource";
import { strategyClusters } from "./strategyClusters";
import { readFrame, requireRegistration } from "./longRun";
import { zoneScenario, zoneSettings, runZoneCase, type Variant } from "./zonesContest";
import { type Flags, flag, integerFlag } from "./flags";

/** Each cluster's medoid genotype, with the cluster description for provenance. */
export function clusterCheckpoint(world: EngineWorld, k: number) {
  const cells = readFrame(world).cells;
  if (cells.length < k) throw new Error("Fewer living cells than clusters");
  const snapshot = strategyClusters(world, k);
  const summaries = snapshot.clusters.map((c) => ({
    cluster: c.rank,
    size: c.size,
    leftBand: c.leftBand,
    center: c.center,
    medoidGenome: cells[c.medoid].genome,
    medoidCell: cells[c.medoid].id,
  }));
  const variants: Variant[] = snapshot.clusters.map((c) => ({
    label: `cluster-${c.rank}`,
    genotype: world.command<Genotype>("genotype", { id: cells[c.medoid].genome }),
  }));
  if (variants.length < 2)
    throw new Error(
      "The requested trait partition has fewer than two occupied clusters; this checkpoint cannot support the proposed invasion comparison"
    );
  return { summaries, variants };
}

export async function runInvasion(flags: Flags): Promise<void> {
  const path = flag(flags, "checkpoint", "");
  if (!path) throw new Error("--checkpoint <file> is required");
  const engine = await loadEngine(),
    source = await checkpointSource(engine, path),
    world = source.world;
  try {
    const k = integerFlag(flags, "k", 2),
      ticks = integerFlag(flags, "ticks", 12000);
    const justification = requireRegistration(flags, ticks);
    const { summaries, variants } = clusterCheckpoint(world, k);
    const root = flag(flags, "output", "harness/artifacts/invasion");
    mkdirSync(root, { recursive: false });
    const provenance = {
      sourceCheckpoint: path,
      source: source.provenance,
      sourceTick: readFrame(world).tick,
      justification,
      clusters: summaries,
      medoids: variants.map((v) => ({ label: v.label, genotype: v.genotype })),
    };
    writeFileSync(join(root, "clusters.json"), JSON.stringify(provenance, null, 2));
    console.log(JSON.stringify(summaries));
    // Carry the complete physical chemistry and physiology into the fresh comparison.
    const s = invasionSettings(world, flags, engine);
    for (const variant of variants)
      await runZoneCase(
        zoneScenario(`invade-${variant.label}`, variants, s, variant.label, provenance),
        root,
        integerFlag(flags, "seed", 901),
        ticks,
        false,
        integerFlag(flags, "wall", 600)
      );
  } finally {
    world.dispose();
  }
}
export function invasionSettings(world: EngineWorld, flags: Flags, engine: Engine) {
  const settings = zoneSettings(flags, engine),
    config = world.command<Definition>("definition").config;
  const size = flags.values.has("size") ? settings.size : config.width;
  return {
    ...settings,
    world: flag(flags, "world", "mixed") as "zones" | "mixed",
    size,
    founders: integerFlag(flags, "founders", config.founders),
    sources: integerFlag(flags, "sources", config.sourceCount),
    config: {
      ...config,
      width: size,
      height: flags.values.has("size") ? size : config.height,
    },
  };
}

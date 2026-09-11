import { createHash } from "node:crypto";
import { restoreWorld } from "../../src/persist/checkpoint";
import { controller } from "../../src/sim/controller";
import { encodeGenotype } from "../../src/sim/genetics/codec";
import { lineageCounts } from "../../src/sim/inheritedStats";
import { type World } from "../../src/sim/types";

const digest = (text: string): string => createHash("sha256").update(text).digest("hex");
/** Embed controller-owned encodings so moving/deleting the source file cannot erase the comparison. */
export function prepareCompetition(text: string, candidate: number | "representative") {
  const saved = restoreWorld(text);
  const selection = selectCandidate(saved, candidate);
  const descendant = saved.genomes.get(selection.genome);
  let ancestor = descendant;
  while (ancestor?.parent !== null && ancestor?.parent !== undefined)
    ancestor = saved.genomes.get(ancestor.parent);
  if (!ancestor || !descendant) throw new Error("Unknown ancestor or candidate genotype");
  const entries = [ancestor, descendant].map((record) => {
    const genome = encodeGenotype(record.genome);
    return { id: record.id, genome, hash: digest(JSON.stringify(genome)) };
  });
  return {
    saved,
    ancestor: ancestor.genome,
    descendant: descendant.genome,
    identity: {
      checkpointHash: digest(text),
      sourceTick: saved.tick,
      sourceSeed: saved.seed,
      sourceInterventions: saved.interventions,
      controller: controller.id,
      selection,
      ancestor: entries[0],
      descendant: entries[1],
    },
  };
}
function selectCandidate(world: World, candidate: number | "representative") {
  if (typeof candidate === "number") return { rule: "explicit genotype ID", genome: candidate };
  const leader = lineageCounts(world)[0];
  if (!leader) throw new Error("Cannot select from an extinct population");
  const cells = world.cells
    .filter((c) => c.lineage === leader[0])
    .sort((a, b) => a.born - b.born || a.id - b.id);
  const cell = cells[Math.floor(cells.length / 2)];
  return {
    rule: "median birth tick then organism ID among living members of the largest founder lineage; lowest lineage ID breaks ties",
    genome: cell.genome,
    cell: cell.id,
    lineage: cell.lineage,
    born: cell.born,
    lineagePopulation: cells.length,
  };
}

import { createHash } from "node:crypto";
import { restoreWorld } from "../../src/persist/checkpoint";
import { controller } from "../../src/sim/controller";
import { encodeGenotype } from "../../src/sim/genetics/codec";

const digest = (text: string): string => createHash("sha256").update(text).digest("hex");
/** Embed controller-owned encodings so moving/deleting the source file cannot erase the comparison. */
export function prepareCompetition(text: string, candidate: number) {
  const saved = restoreWorld(text);
  const ancestor = saved.genomes.get(1),
    descendant = saved.genomes.get(candidate);
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
      ancestor: entries[0],
      descendant: entries[1],
    },
  };
}

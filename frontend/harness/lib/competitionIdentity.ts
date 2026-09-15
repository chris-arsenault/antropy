import { createHash } from "node:crypto";
import { type EngineWorld } from "../../src/engine/client";
import { type Genotype, type Definition } from "../../src/engine/types";
import { readFrame } from "./longRun";

export function prepareCompetition(saved: EngineWorld, candidate: number | "representative") {
  const selection = selectCandidate(saved, candidate),
    descendant = saved.command<Genotype>("genotype", { id: selection.genome });
  let ancestor = descendant;
  const visited = new Set<number>();
  while (ancestor.parent !== null) {
    if (visited.has(ancestor.id)) throw new Error("Cyclic genotype ancestry");
    visited.add(ancestor.id);
    ancestor = saved.command<Genotype>("genotype", { id: ancestor.parent });
  }
  const entries = [ancestor, descendant].map((genome) => ({
    id: genome.id,
    genome,
    hash: createHash("sha256").update(JSON.stringify(genome)).digest("hex"),
  }));
  const frame = readFrame(saved),
    definition = saved.command<Definition>("definition");
  return {
    saved,
    ancestor,
    descendant,
    identity: {
      checkpointHash: createHash("sha256").update(saved.snapshot()).digest("hex"),
      sourceTick: frame.tick,
      sourceSeed: definition.seed,
      retainedEvents: frame.events,
      controller: "wasm-local-rnn",
      selection,
      ancestor: entries[0],
      descendant: entries[1],
    },
  };
}
function selectCandidate(world: EngineWorld, candidate: number | "representative") {
  if (typeof candidate === "number") return { rule: "explicit genotype ID", genome: candidate };
  const cells = readFrame(world).cells,
    counts = new Map<number, number>();
  for (const c of cells) counts.set(c.lineage, (counts.get(c.lineage) ?? 0) + 1);
  const leader = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  if (!leader) throw new Error("Cannot select from an extinct population");
  const group = cells
      .filter((c) => c.lineage === leader[0])
      .sort((a, b) => a.born - b.born || a.id - b.id),
    cell = group[Math.floor(group.length / 2)];
  return {
    rule: "median birth tick then organism ID among living members of largest founder lineage; lowest lineage ID breaks ties",
    genome: cell.genome,
    cell: cell.id,
    lineage: cell.lineage,
    born: cell.born,
    lineagePopulation: group.length,
  };
}

import { type Engine } from "../../src/engine/client";
import { type Definition, type Genotype, type Inspection } from "../../src/engine/types";
import { checkpointSource } from "./checkpointSource";
import { type Flags, flag, integerFlag } from "./flags";

export async function capabilitySources(flags: Flags, engine: Engine) {
  const path = flag(flags, "checkpoint", "");
  if (!path)
    throw new Error(
      "Follow-ups require --checkpoint with current chemistry schema and --candidate"
    );
  const { world, provenance } = await checkpointSource(engine, path);
  try {
    const definition = world.command<Definition>("definition"),
      candidate = integerFlag(flags, "candidate", 0);
    const ancestorId = integerFlag(flags, "ancestor", 1);
    const descendant = world.command<Genotype>("genotype", { id: candidate });
    const ancestor = world.command<Genotype>("genotype", { id: ancestorId });
    const frame = world.command<{
      tick: number;
      cells: { id: number; genome: number; born: number }[];
    }>("frame");
    const living = frame.cells.sort((a, b) => a.born - b.born || a.id - b.id);
    if (!living.length)
      throw new Error("Memory and allocation interventions require living source cells");
    const capacities = new Map<number, number>();
    for (const c of living)
      if (!capacities.has(c.genome)) {
        const f = world.command<{ sourceImportCapacity: number[] }>("genotypeFacts", {
          id: c.genome,
        }).sourceImportCapacity;
        capacities.set(c.genome, f[0] / Math.max(1e-30, f[0] + f[1]));
      }
    const median = living[Math.floor(living.length / 2)];
    const specialist = [...living].sort(
      (a, b) => capacities.get(a.genome)! - capacities.get(b.genome)! || a.id - b.id
    )[0];
    const memory = world.command<Inspection>("inspect", { cell: median.id });
    return {
      ancestor,
      descendant,
      processing: world.command<Genotype>("genotype", { id: specialist.genome }),
      memory: memory.genotype!,
      learned: world.command<Genotype>("assimilatedGenotype", { cell: median.id }),
      ancestralBehavior: world.command<{ expressed: Genotype["chromosomes"][number] }>(
        "genotypeFacts",
        { id: ancestorId }
      ).expressed.behavior,
      config: definition.config,
      provenance: {
        ...provenance,
        tick: frame.tick,
        candidate,
        ancestor: ancestorId,
        processingCell: specialist.id,
        processingGenotype: specialist.genome,
        processingFirstSourceFraction: capacities.get(specialist.genome),
        selection:
          "Minimum affinity-weighted first-source import capacity fraction; tie by cell ID",
        memoryCell: median.id,
        memoryGenotype: median.genome,
        memorySelection: "Median living cell ordered by birth tick then ID",
      },
    };
  } finally {
    world.dispose();
  }
}

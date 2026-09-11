import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { restoreWorld } from "../../src/persist/checkpoint";
import { express } from "../../src/sim/genetics/genotype";
import { type World } from "../../src/sim/types";

function load(path: string) {
  const text = readFileSync(path, "utf8");
  return {
    world: restoreWorld(text),
    provenance: { path, sha256: createHash("sha256").update(text).digest("hex") },
  };
}
function ratioA(w: World, genome: number): number {
  const p = express(w.genomes.get(genome)!.genome).physical;
  const a = w.config.transporterRatio * Math.exp(p[2]),
    b = w.config.transportBRatio * Math.exp(p[4]);
  return a / (a + b);
}
export function capabilitySources() {
  const exported = load("../.sulion-paste/bacteria-101-48661.json");
  const epoch = load("harness/artifacts/epochs-2026-09-11/live-101/checkpoint-100000.json");
  const living = [...epoch.world.cells].sort((a, b) => a.born - b.born || a.id - b.id);
  const median = living[Math.floor(living.length / 2)];
  const bSpecialist = [...living].sort(
    (a, b) => ratioA(epoch.world, a.genome) - ratioA(epoch.world, b.genome) || a.id - b.id
  )[0];
  return {
    ancestor: exported.world.genomes.get(1)!.genome,
    descendant: exported.world.genomes.get(895)!.genome,
    processing: epoch.world.genomes.get(bSpecialist.genome)!.genome,
    memory: epoch.world.genomes.get(median.genome)!.genome,
    state: median.brain,
    provenance: {
      exported: { ...exported.provenance, tick: exported.world.tick, genotype: 895 },
      epoch: {
        ...epoch.provenance,
        tick: epoch.world.tick,
        processingCell: bSpecialist.id,
        processingGenotype: bSpecialist.genome,
        processingRatioA: ratioA(epoch.world, bSpecialist.genome),
        memoryCell: median.id,
        memoryGenotype: median.genome,
      },
    },
  };
}

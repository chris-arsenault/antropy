import { controller } from "../controller";
import { type Chromosome, type Genotype } from "./genotype";

export function encodeGenotype(genome: Genotype): unknown {
  return {
    schema: "organism-v2",
    chromosomes: genome.chromosomes.map((c) => ({
      behavior: controller.encodeGenome(c.behavior),
      physical: Array.from(c.physical),
    })),
  };
}
function decodeChromosome(value: unknown): Chromosome {
  if (!value || typeof value !== "object") throw new Error("Invalid chromosome");
  const c = value as Record<string, unknown>;
  if (
    !Array.isArray(c.physical) ||
    c.physical.length !== 4 ||
    !c.physical.every((v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1)
  )
    throw new Error("Invalid physical genes");
  return { behavior: controller.decodeGenome(c.behavior), physical: Float32Array.from(c.physical) };
}
export function decodeGenotype(value: unknown): Genotype {
  if (!value || typeof value !== "object") throw new Error("Invalid genotype");
  const g = value as Record<string, unknown>;
  if (
    g.schema !== "organism-v2" ||
    !Array.isArray(g.chromosomes) ||
    ![1, 2].includes(g.chromosomes.length)
  )
    throw new Error("Invalid genotype schema or ploidy");
  return { chromosomes: g.chromosomes.map(decodeChromosome) };
}

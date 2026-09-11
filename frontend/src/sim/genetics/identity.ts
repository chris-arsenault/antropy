import { encodeGenotype } from "./codec";
import { sameGenotype, type Genotype } from "./genotype";

const hashes = new WeakMap<Genotype, number>();
/** Hash only narrows comparisons; exact equality resolves every collision. */
function sequenceHash(genome: Genotype): number {
  const cached = hashes.get(genome);
  if (cached !== undefined) return cached;
  const encoded = encodeGenotype(genome) as { chromosomes: unknown[] };
  const text = encoded.chromosomes
    .map((c) => JSON.stringify(c))
    .sort()
    .join("|");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  hashes.set(genome, hash);
  return hash;
}
function sameSequence(a: Genotype, b: Genotype): boolean {
  return (
    sameGenotype(a, b) ||
    (a.chromosomes.length === 2 &&
      b.chromosomes.length === 2 &&
      sameGenotype(a, { chromosomes: [b.chromosomes[1], b.chromosomes[0]] }))
  );
}
export function distinctSequences(genomes: Iterable<Genotype>): number {
  const buckets = new Map<number, Genotype[]>();
  let count = 0;
  for (const genome of genomes) {
    const hash = sequenceHash(genome),
      bucket = buckets.get(hash) ?? [];
    if (bucket.some((other) => sameSequence(genome, other))) continue;
    bucket.push(genome);
    buckets.set(hash, bucket);
    count++;
  }
  return count;
}

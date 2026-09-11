import { controller } from "../sim/controller";
import { express, type Genotype } from "../sim/genetics/genotype";

export interface GeneticDistance {
  physical: number;
  controller: number;
}
/** Separate blocks: thousands of neural loci must not drown out physical differences. */
export function geneticDistance(a: Genotype, b: Genotype): GeneticDistance {
  const left = express(a),
    right = express(b);
  const physical = Math.sqrt(
    left.physical.reduce((sum, value, i) => sum + (value - right.physical[i]) ** 2, 0) /
      left.physical.length
  );
  return { physical, controller: controller.genomeDistance(left.behavior, right.behavior) };
}
type Comparison = (genome: Genotype) => GeneticDistance;
const references = new WeakMap<Genotype, Comparison>();
export function comparisonTo(reference: Genotype): Comparison {
  const existing = references.get(reference);
  if (existing) return existing;
  const cache = new WeakMap<Genotype, GeneticDistance>();
  const compare = (genome: Genotype) => {
    let result = cache.get(genome);
    if (!result) {
      result = geneticDistance(reference, genome);
      cache.set(genome, result);
    }
    return result;
  };
  references.set(reference, compare);
  return compare;
}

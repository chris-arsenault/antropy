import { controller, type Genome, type BrainState } from "../controller";
import { type Config } from "../config";
import { type RandomState } from "../random";
import { combineVector, meanVector, mutateVector } from "./operators";
import { BODY_PARTS } from "../body";

export interface Chromosome {
  readonly behavior: Genome;
  readonly physical: Float32Array;
}
export interface Genotype {
  readonly chromosomes: readonly Chromosome[];
}
const expressed = new WeakMap<Genotype, Chromosome>();
export function express(genotype: Genotype): Chromosome {
  const cached = expressed.get(genotype);
  if (cached) return cached;
  const [a, b] = genotype.chromosomes;
  const value = b
    ? {
        behavior: controller.express(a.behavior, b.behavior),
        physical: meanVector(a.physical, b.physical),
      }
    : a;
  expressed.set(genotype, value);
  return value;
}
export function seedGenotype(config: Config): Genotype {
  return {
    chromosomes: Array.from({ length: config.ploidy === "haploid" ? 1 : 2 }, () => ({
      behavior: controller.seed(),
      physical: new Float32Array(BODY_PARTS.length),
    })),
  };
}
function gamete(genotype: Genotype, rng: RandomState, config: Config): Chromosome {
  const [a, b] = genotype.chromosomes;
  return {
    behavior: controller.recombine(a.behavior, b.behavior, rng, config.crossover),
    physical: combineVector(a.physical, b.physical, rng, config.crossover),
  };
}
export const transmissions = {
  clonal: (parent: Genotype) => parent.chromosomes,
  selfing: (parent: Genotype, rng: RandomState, config: Config) => [
    gamete(parent, rng, config),
    gamete(parent, rng, config),
  ],
};
export function inherit(parent: Genotype, rng: RandomState, config: Config, state?: BrainState) {
  const acquired =
    state && config.learning === "plastic"
      ? assimilate(parent, state, config.learningRetention)
      : parent;
  const learned = controller.genomeDistance(express(parent).behavior, express(acquired).behavior);
  const base = { chromosomes: transmissions[config.transmission](acquired, rng, config) };
  const genome = mutateGenotype(base, rng, config);
  return {
    genome,
    mutated: !sameGenotype(base, genome),
    recombined: config.transmission === "selfing",
    learned,
  };
}
function assimilate(parent: Genotype, state: BrainState, retention: number): Genotype {
  const expressed = express(parent).behavior;
  return {
    chromosomes: parent.chromosomes.map((c) => ({
      physical: c.physical.slice(),
      behavior: controller.assimilate(c.behavior, expressed, state, retention),
    })),
  };
}
function mutateGenotype(genotype: Genotype, rng: RandomState, config: Config): Genotype {
  const chromosomes = genotype.chromosomes;
  return {
    chromosomes: chromosomes.map((c) => ({
      behavior: controller.mutate(
        c.behavior,
        rng,
        config.mutationRate,
        config.mutationScale,
        config.mutationKind
      ),
      physical: mutateVector(
        c.physical,
        rng,
        {
          rate: config.physicalMutationRate,
          scale: config.physicalMutationScale,
          kind: config.mutationKind,
        },
        3
      ),
    })),
  };
}
export function sameGenotype(a: Genotype, b: Genotype): boolean {
  return (
    a.chromosomes.length === b.chromosomes.length &&
    a.chromosomes.every(
      (c, i) =>
        controller.genomeDistance(c.behavior, b.chromosomes[i].behavior) === 0 &&
        c.physical.every((v, j) => v === b.chromosomes[i].physical[j])
    )
  );
}

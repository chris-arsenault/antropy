import { type Genome } from "./controller/contract";
import { type World } from "./world";

/** Founder genomes collapse to one exact seed when variation is disabled. */
export function seedFounderGenomes(world: World, count: number): Genome[] {
  if (!world.config.geneticVariation) {
    const founder = world.controller.fixedSeed();
    return Array.from({ length: count }, () => founder);
  }
  const founder = world.controller.seed(world.rng);
  return [founder, ...Array.from({ length: count - 1 }, () => world.controller.seed(world.rng))];
}

/** Sexual inheritance, with recombination and mutation behind the variation gate. */
export function sexualOffspring(world: World, mother: Genome, father: Genome): Genome {
  if (!world.config.geneticVariation) {
    return mother;
  }
  const controller = world.controller;
  const recombined = controller.recombine(mother, father, world.rng);
  if (recombined === null) {
    throw new Error(`controller ${controller.id} cannot recombine — sexual offspring impossible`);
  }
  return controller.mutate(recombined, controller.physical(recombined).mutationSigma, world.rng);
}

/** Haploid inheritance, with mutation behind the variation gate. */
export function haploidOffspring(world: World, mother: Genome): Genome {
  return world.config.geneticVariation
    ? world.controller.haploidOffspring(mother, world.rng)
    : mother;
}

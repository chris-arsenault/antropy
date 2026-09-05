import { SEX_FEMALE, SEX_MALE } from "./ant";
import {
  GENETIC_ROLE_QUEEN,
  GENETIC_ROLE_SIRE,
  registerFounder,
  type GeneticIdentity,
} from "./ancestry";
import { type Genome } from "./controller/contract";
import { haploidOffspring, seedFounderGenomes, sexualOffspring } from "./genetics";
import { COLONY } from "./tunables";
import { type World } from "./world";

export interface Sperm {
  genome: Genome;
  patrilineId: number;
  geneticId: number;
  founderLineId: number;
}

export interface ColonyGenetics {
  readonly queenGenome: Genome;
  readonly queenIdentity: GeneticIdentity;
  readonly sperm: Sperm[];
}

function founderSperm(world: World, genomes: Genome[], retainReferences: boolean): Sperm[] {
  return genomes.map((genome, index) => {
    const identity = registerFounder(world, genome, GENETIC_ROLE_SIRE, SEX_MALE, retainReferences);
    return {
      genome,
      patrilineId: index + 1,
      geneticId: identity.geneticId,
      founderLineId: identity.founderLineId,
    };
  });
}

/** Independent queen and sire draws for the initial colony portfolio. */
export function seedColonyGenetics(world: World): ColonyGenetics {
  const [queenGenome, ...spermGenomes] = seedFounderGenomes(world, COLONY.spermCount + 1);
  const queenIdentity = registerFounder(world, queenGenome, GENETIC_ROLE_QUEEN, SEX_FEMALE, true);
  return {
    queenGenome,
    queenIdentity,
    sperm: founderSperm(world, spermGenomes, true),
  };
}

/** Diagnostic auto-continuation genetics; these are not initialization references. */
export function continuationColonyGenetics(world: World, pool: Genome[]): ColonyGenetics {
  const draw = (): Genome =>
    pool.length > 0
      ? pool[Math.floor(world.rng.next() * pool.length)]
      : world.controller.seed(world.rng);
  const queenGenome = sexualOffspring(world, draw(), draw());
  const queenIdentity = registerFounder(world, queenGenome, GENETIC_ROLE_QUEEN, SEX_FEMALE);
  const spermGenomes = Array.from({ length: COLONY.spermCount }, () =>
    haploidOffspring(world, draw())
  );
  return {
    queenGenome,
    queenIdentity,
    sperm: founderSperm(world, spermGenomes, false),
  };
}

export function makeColonyOffspring(world: World, queenGenome: Genome, father: Sperm): Genome {
  return sexualOffspring(world, queenGenome, father.genome);
}

/** Net-energy-merit pick for the royal egg's father line. */
export function meritSperm(sperm: Sperm[], merit: ReadonlyMap<number, number>): Sperm {
  let best = sperm[0];
  let bestScore = -1;
  for (const candidate of sperm) {
    const score = merit.get(candidate.patrilineId) ?? 0;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

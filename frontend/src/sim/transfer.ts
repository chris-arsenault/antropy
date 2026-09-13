/**
 * Horizontal gene transfer. Two touching cells exchange a physical locus: at `transferRate` per
 * touching pair per second, the recipient's chromosomes take the donor's expressed value at one
 * random physical locus, and the recipient carries a new immutable genotype record descended
 * from its own. Bodies do not change; only the construction target and the tint do. Behavioural
 * loci stay inside the controller and are not transferred. Zero, the default, disables it.
 */
import { type World, type Cell } from "./types";
import { nextRandom } from "./random";
import { SpatialIndex } from "./spatial";
import { touching } from "./interference";
import { express, type Genotype } from "./genetics/genotype";
import { PHYSICAL_LOCI } from "./body";

function receive(world: World, recipient: Cell, donor: Cell): void {
  const rng = world.geneticRng,
    locus = Math.min(PHYSICAL_LOCI - 1, Math.floor(nextRandom(rng) * PHYSICAL_LOCI)),
    value = express(world.genomes.get(donor.genome)!.genome).physical[locus],
    own = world.genomes.get(recipient.genome)!.genome;
  const genome: Genotype = {
    chromosomes: own.chromosomes.map((c) => {
      const physical = c.physical.slice();
      physical[locus] = value;
      return { behavior: c.behavior, physical };
    }),
  };
  const id = world.nextGenome++;
  world.genomes.set(id, { id, parent: recipient.genome, born: world.tick, genome, learned: 0 });
  recipient.genome = id;
  world.ancestry.get(recipient.id)!.genome = id;
  world.ledger.transfers++;
}
/** Touching neighbours of a different genotype, the donors a cell can receive from. */
function donors(world: World, recipient: Cell, index: SpatialIndex): Cell[] {
  return index
    .near(recipient)
    .filter(
      (other) =>
        other !== recipient &&
        other.genome !== recipient.genome &&
        touching(recipient, other, index, world.config)
    );
}
/** One tick of transfer between touching cells of different genotypes. */
export function transferGenes(world: World): void {
  const c = world.config;
  if (c.transferRate <= 0 || world.cells.length < 2) return;
  const index = new SpatialIndex(c, world.cells),
    chance = 1 - Math.exp(-c.transferRate * c.dt);
  for (const recipient of world.cells)
    for (const donor of donors(world, recipient, index))
      if (nextRandom(world.geneticRng) < chance) receive(world, recipient, donor);
}

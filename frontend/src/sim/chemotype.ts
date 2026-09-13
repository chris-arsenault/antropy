/**
 * Family chemistry. With `toxinTypes` 2 the toxin exists in two chemical types held in the
 * `toxin` (A) and `toxinB` fields. A heritable tint locus sets the share of a cell's toxin that
 * is type B, and installed toxin machinery is immune to each type in proportion to the share it
 * produces, as colicin immunity is bundled with the colicin it neutralises. Relatives share a
 * tint and tolerate one another; a lineage that drifts in tint is harmed by its own family. With
 * `toxinTypes` 1 everything is type A and the tint locus is silent.
 */
import { type World, type Cell } from "./types";
import { type Config } from "./config";
import { express, type Genotype } from "./genetics/genotype";
import { TINT_LOCUS } from "./body";

/** Share of a genotype's toxin that is type B, in (0, 1). */
export function tint(genome: Genotype): number {
  return 1 / (1 + Math.exp(-express(genome).physical[TINT_LOCUS]));
}
/** [type A share, type B share] of the toxin a cell produces. */
export function typeShares(world: World, cell: Cell): [number, number] {
  if (world.config.toxinTypes === 1) return [1, 0];
  const b = tint(world.genomes.get(cell.genome)!.genome);
  return [1 - b, b];
}
/** Injury divisor against one toxin type: paid defense plus immunity from producing that type. */
export function protection(cell: Cell, c: Config, share: number): number {
  return (
    1 +
    (c.defenseStrength * cell.body.defense + c.immunityStrength * cell.body.weapon * share) /
      cell.body.core
  );
}
/** The concentration a cell is actually hurt by: each type discounted by its own protection. */
export function susceptibleToxin(
  world: World,
  cell: Cell,
  shares: [number, number],
  a: number,
  b: number
): number {
  const c = world.config;
  return a / protection(cell, c, shares[0]) + b / protection(cell, c, shares[1]);
}

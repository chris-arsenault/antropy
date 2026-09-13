/**
 * Predation: a cell killed by contact injury feeds the toxin-bearing neighbours touching it. A
 * fraction `preyYield` of the corpse's material goes into those neighbours' reserves in
 * proportion to their toxin machinery, capped by their storage; the rest, and every other
 * death, goes to detritus as before. Zero, the default, keeps killing and eating separate.
 */
import { type World, type Cell } from "./types";
import { materialCapacity } from "./body";
import { SpatialIndex } from "./spatial";
import { touching } from "./interference";
import { flow } from "./observation";

/** Moves prey material into the reserves of touching predators; returns the amount consumed. */
export function consumePrey(
  world: World,
  prey: Cell,
  material: number,
  index: SpatialIndex
): number {
  const c = world.config;
  if (c.preyYield <= 0 || prey.damage < 1) return 0;
  // Only a living predator can eat: one dying in the same pass has already left its material
  // behind, and feeding it would lose the corpse's share from the world.
  const predators = index
    .near(prey)
    .filter(
      (other) =>
        other !== prey &&
        other.body.weapon > 0 &&
        other.damage < 1 &&
        other.energy > 1e-12 &&
        touching(prey, other, index, c)
    );
  const machinery = predators.reduce((s, p) => s + p.body.weapon / p.body.core, 0);
  if (machinery <= 0) return 0;
  let consumed = 0;
  for (const predator of predators) {
    const share =
      (c.preyYield * material * (predator.body.weapon / predator.body.core)) / machinery;
    const eaten = Math.min(
      share,
      Math.max(0, materialCapacity(predator.body, c) - predator.reserve)
    );
    predator.reserve += eaten;
    consumed += eaten;
    flow(world, predator, "preyed", eaten);
  }
  world.ledger.preyed += consumed;
  return consumed;
}

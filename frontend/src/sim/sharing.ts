/**
 * Adhesion and sharing. Touching cells exchange stored nutrient: each touching pair moves
 * reserve from the richer to the poorer at `sharingRate` of their difference per second, capped
 * by the receiver's storage. Nothing is created; the ledger records what moved. A cell that
 * gathers feeds its neighbours whether they gather or not, so sharing rewards staying together
 * with kin that reciprocate and is exploitable by neighbours that do not. Zero, the default,
 * disables it.
 */
import { type World, type Cell } from "./types";
import { materialCapacity } from "./body";
import { SpatialIndex } from "./spatial";
import { touching } from "./interference";
import { flow } from "./observation";

function share(world: World, a: Cell, b: Cell): void {
  const c = world.config;
  const [from, to] = a.reserve >= b.reserve ? [a, b] : [b, a];
  const moved = Math.min(
    ((from.reserve - to.reserve) / 2) * (1 - Math.exp(-c.sharingRate * c.dt)),
    Math.max(0, materialCapacity(to.body, c) - to.reserve)
  );
  if (moved <= 0) return;
  from.reserve -= moved;
  to.reserve += moved;
  world.ledger.shared += moved;
  flow(world, from, "shared_out", moved);
  flow(world, to, "shared_in", moved);
}
/** One tick of reserve exchange across every touching pair, each pair once. */
export function shareReserves(world: World): void {
  const c = world.config;
  if (c.sharingRate <= 0 || world.cells.length < 2) return;
  const index = new SpatialIndex(c, world.cells);
  for (const cell of world.cells)
    for (const other of index.near(cell))
      if (other.id > cell.id && touching(cell, other, index, c)) share(world, cell, other);
}

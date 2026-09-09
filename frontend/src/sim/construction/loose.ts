import { pointAt } from "../grid";
import { looseCellOpen } from "../support";
import { type World } from "../types";
import { updateLandmark } from "../colony/knowledge";

/** Dropped loads remain separate, recoverable objects; bottom-first prevents double falls. */
export function settleSpoil(world: World, occupied: ReadonlySet<number>): void {
  for (const [from, pile] of [...world.construction.loose].sort(([a], [b]) => a - b)) {
    const p = pointAt(world.grid, from),
      to = from - world.grid.width;
    if (
      !looseCellOpen(world.grid, p.x, p.y - 1) ||
      occupied.has(to) ||
      world.food.has(to) ||
      world.construction.loose.has(to)
    )
      continue;
    world.construction.loose.delete(from);
    world.construction.loose.set(to, pile);
    for (const job of world.construction.jobs) {
      const location = world.knowledge.locations.get(job.recovery!);
      if (location?.x === p.x && location.y === p.y)
        updateLandmark(world, location.id, { x: p.x, y: p.y - 1 });
    }
  }
}

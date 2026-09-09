import { type World } from "../../src/sim/types";
import { cellIndex, pointAt } from "../../src/sim/grid";
import { stepFrom } from "../../src/sim/geometry";
import { looseCellOpen } from "../../src/sim/support";
import { observeDecisions } from "../../src/sim/colony/diagnostics";
import { adultBodies } from "../../src/sim/adultBody";
import { nestArea } from "../../src/sim/construction/nestArea";

/** Read-only physical use evidence; never supplies a construction destination or policy input. */
export function traceConstructionUse(world: World) {
  const cuts = new Set<number>(),
    traversed = new Set<number>(),
    stored = new Set<number>(),
    occupiedByBrood = new Set<number>();
  const detach = observeDecisions(world, (current, ant, _candidates, request, result) => {
    if (request.kind === "dig" && result === "success") {
      const point = stepFrom(ant, request.heading);
      cuts.add(cellIndex(current.grid, point.x, point.y));
    }
  });
  const distance = (x: number, y: number) =>
    Math.abs(x - world.nest.entrance.x) + Math.abs(y - world.nest.entrance.y);
  return {
    detach,
    sample() {
      const adults = adultBodies(world);
      const loads = new Set(adults.map((ant) => ant.brood));
      for (const ant of adults) {
        const index = cellIndex(world.grid, ant.x, ant.y);
        if (cuts.has(index)) traversed.add(index);
      }
      for (const index of cuts) if ((world.food.get(index) ?? 0) > 0) stored.add(index);
      for (const body of world.brood) {
        const index = cellIndex(world.grid, body.x, body.y);
        if (
          cuts.has(index) &&
          !loads.has(body.id) &&
          !looseCellOpen(world.grid, body.x, body.y - 1)
        )
          occupiedByBrood.add(index);
      }
    },
    summary() {
      const cells = [...cuts].map((index) => {
        const point = pointAt(world.grid, index);
        return {
          ...point,
          traversed: traversed.has(index),
          stored: stored.has(index),
          brood: occupiedByBrood.has(index),
          usableFloor:
            looseCellOpen(world.grid, point.x, point.y) &&
            !looseCellOpen(world.grid, point.x, point.y - 1) &&
            looseCellOpen(world.grid, point.x, point.y + 1),
        };
      });
      return {
        area: nestArea(world),
        queenEntranceDistance: distance(world.queen.x, world.queen.y),
        cuts: cells,
        caches: [...world.caches].map(([id, point]) => ({
          id,
          ...point,
          quantity: world.food.get(cellIndex(world.grid, point.x, point.y)) ?? 0,
          entranceDistance: distance(point.x, point.y),
        })),
      };
    },
  };
}

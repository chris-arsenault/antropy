import { type World, type Ant } from "../types";
import { type KnownLocation, type Request, type ActionResult } from "../colony/contract";
import { cellIndex, getCell, inBounds } from "../grid";
import { stepFrom } from "../geometry";
import { Material } from "../materials";
import { occupied } from "../contact";
import { spend } from "../resources";
import { depositChemical } from "../scent";
import { looseCellOpen } from "../support";

export const COLLECTIVE_REQUESTS = ["remember-site", "forget-site", "drop-spoil", "pheromone-b"];

/** Private remembered position. Other ants cannot query this landmark. */
export function focusLocation(ant: Ant): KnownLocation | null {
  const focus = ant.decision.focus;
  return focus
    ? {
        x: focus.x,
        y: focus.y,
        id: -2_000_000_000 - ant.id,
        kind: "work",
        backed: focus.backed,
        quantity: 0,
        observedAt: focus.since,
      }
    : null;
}

export function canDropSpoil(world: World, ant: Ant, heading: number): boolean {
  const point = stepFrom(ant, heading),
    index = cellIndex(world.grid, point.x, point.y);
  return (
    getCell(world.grid, point.x, point.y) === Material.AIR &&
    !occupied(world, point) &&
    !looseCellOpen(world.grid, point.x, point.y - 1) &&
    !world.food.has(index) &&
    (world.construction.loose.get(index)?.length ?? 0) < 4
  );
}

/** Only local memory writes, local emission and physical release; no work selection. */
export function resolveCollective(world: World, ant: Ant, request: Request): ActionResult {
  if (request.kind === "remember-site") {
    const point = stepFrom(ant, request.heading);
    if (!inBounds(world.grid, point.x, point.y)) return "blocked";
    ant.decision.focus = {
      x: point.x,
      y: point.y,
      since: world.tick,
      backed: world.grid.backing[cellIndex(world.grid, point.x, point.y)] !== Material.AIR,
    };
    return "success";
  }
  if (request.kind === "forget-site") {
    if (ant.decision.route?.destination === focusLocation(ant)?.id) ant.decision.route = null;
    ant.decision.focus = null;
    return "success";
  }
  if (request.kind === "pheromone-b") {
    const amount = world.config.chemistry.pheromoneDeposit;
    if (ant.energy < amount * world.config.pheromoneCost) return "empty";
    depositChemical(world.pheromoneB, cellIndex(world.grid, ant.x, ant.y), amount);
    spend(world, ant, amount * world.config.pheromoneCost);
    world.metrics.pheromoneDeposited += amount;
    return "success";
  }
  return dropSpoil(world, ant, request.heading);
}

function dropSpoil(world: World, ant: Ant, heading: number): ActionResult {
  if (ant.spoil === null) return "empty";
  if (ant.energy < world.config.constructionCost) return "empty";
  if (ant.job !== null) return "blocked";
  if (!canDropSpoil(world, ant, heading)) return "blocked";
  const point = stepFrom(ant, heading),
    index = cellIndex(world.grid, point.x, point.y);
  const pile = world.construction.loose.get(index) ?? [];
  pile.push(ant.spoil);
  world.construction.loose.set(index, pile);
  ant.spoil = null;
  spend(world, ant, world.config.constructionCost);
  return "success";
}

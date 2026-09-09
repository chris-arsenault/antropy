import { type Point, samePoint } from "../geometry";
import { type Ant, type World } from "../types";
import { updateLandmark } from "../colony/knowledge";
import { type ActionResult } from "../colony/contract";
import { supportedSite } from "./sites";
import { cellIndex } from "../grid";
import { followBrood } from "./brood";

export function attachQueen(world: World, ant: Ant, point: Point): ActionResult {
  const queen = world.queen;
  if (ant === queen || [queen.brood, queen.spoil].some((load) => load !== null)) return "blocked";
  if (!queen.alive || !samePoint(queen, point)) return "out-of-reach";
  if (queen.carrier !== null || ant.cargo > 0 || ant.spoil !== null || ant.brood !== null)
    return "full";
  queen.carrier = ant.id;
  if (queen.decision.route) queen.decision.route.offRoute = true;
  followCarrier(world, ant);
  return "success";
}

export function releaseQueen(world: World, ant: Ant, point: Point): ActionResult {
  if (world.queen.carrier !== ant.id) return "empty";
  if (!supportedSite(world, point) || world.food.has(cellIndex(world.grid, point.x, point.y)))
    return "blocked";
  Object.assign(world.queen, point, { carrier: null });
  if (world.queen.decision.route) world.queen.decision.route.offRoute = true;
  updateLandmark(world, -2, world.queen);
  return "success";
}

export function followCarrier(world: World, ant: Ant): void {
  followBrood(world, ant);
  if (world.queen.carrier !== ant.id) return;
  world.queen.x = ant.x;
  world.queen.y = ant.y;
  if (world.queen.decision.route) world.queen.decision.route.offRoute = true;
  updateLandmark(world, -2, world.queen);
  world.construction.queenMoves++;
}

export function releaseWorkerLoads(world: World, ant: Ant): void {
  ant.brood = null;
  const job = world.construction.jobs.find((entry) => entry.owner === ant.id);
  if (world.queen.carrier === ant.id) world.queen.carrier = null;
  if (ant.spoil !== null) {
    const index = cellIndex(world.grid, ant.x, ant.y);
    const pile = world.construction.loose.get(index) ?? [];
    pile.push(ant.spoil);
    world.construction.loose.set(index, pile);
    if (job) {
      job.recovery = world.construction.nextId--;
      world.knowledge.locations.set(job.recovery, {
        id: job.recovery,
        x: ant.x,
        y: ant.y,
        kind: "work",
        backed: true,
        quantity: 0,
        observedAt: null,
      });
    }
    ant.spoil = null;
  }
  if (job) {
    job.owner = null;
    job.status = "pending";
  }
}

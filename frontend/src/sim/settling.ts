import { cellIndex, pointAt, setCell } from "./grid";
import { Material } from "./materials";
import { looseCellOpen } from "./support";
import { isWalkable } from "./terrain";
import { type Cache, type World } from "./types";
import { updateLandmark } from "./colony/knowledge";
import { followCarrier } from "./construction/transport";
import { settleSpoil } from "./construction/loose";
import { adultBodies, canAct, carried } from "./adultBody";

type Body = { readonly x: number; y: number };

function occupiedCells(world: World): Set<number> {
  const bodies: Body[] = [...world.ants, ...world.brood];
  if (world.config.mortalityEnabled && world.queen.alive) bodies.push(world.queen);
  return new Set(bodies.map((body) => cellIndex(world.grid, body.x, body.y)));
}

function settleBody(world: World, body: Body, occupied: Set<number>): boolean {
  const from = cellIndex(world.grid, body.x, body.y);
  const to = from - world.grid.width;
  if (
    !looseCellOpen(world.grid, body.x, body.y) ||
    !looseCellOpen(world.grid, body.x, body.y - 1) ||
    occupied.has(to) ||
    (world.food.get(to) ?? 0) > 0
  )
    return false;
  occupied.delete(from);
  body.y--;
  occupied.add(to);
  return true;
}

function settleCache(world: World, occupied: Set<number>, id: number, cache: Cache): void {
  const from = cellIndex(world.grid, cache.x, cache.y);
  if (occupied.has(from)) return;
  if (
    world.caches.size > 1 &&
    [...world.caches.values()].some(
      (other) => other !== cache && other.x === cache.x && other.y === cache.y - 1
    )
  )
    return;
  if (!settleBody(world, cache, occupied)) return;
  setCell(world.grid, cache.x, cache.y + 1, Material.AIR);
  setCell(world.grid, cache.x, cache.y, Material.CACHE);
  occupied.delete(cellIndex(world.grid, cache.x, cache.y));
  // A marker never moves its contents; loose food is resolved below.
  updateLandmark(world, id, cache);
}

function fallingBodies(world: World): Body[] {
  const loads = new Set(adultBodies(world).map((ant) => ant.brood));
  const bodies: Body[] = world.brood.filter((brood) => !loads.has(brood.id));
  for (const ant of adultBodies(world))
    if (canAct(world, ant) && !carried(world, ant) && !isWalkable(world.grid, ant.x, ant.y))
      bodies.push(ant);
  // Stable sorting preserves serialized body order on ties.
  return bodies.sort((a, b) => a.y - b.y || a.x - b.x);
}

function markDisplaced(world: World, body: Body): void {
  if ("decision" in body) {
    const ant = body as World["ants"][number];
    if (ant.decision.route) ant.decision.route.offRoute = true;
    followCarrier(world, ant);
  }
  if (body === world.queen) updateLandmark(world, -2, world.queen);
}

function settleBodies(world: World, occupied: Set<number>): void {
  for (const body of fallingBodies(world)) {
    if (!settleBody(world, body, occupied)) continue;
    markDisplaced(world, body);
  }
}

function settleFood(world: World, occupied: ReadonlySet<number>): void {
  // Snapshot quantities: food arriving from above cannot fall twice in one tick.
  const piles = [...world.food].sort(([a], [b]) => a - b);
  for (const [from, quantity] of piles) {
    const point = pointAt(world.grid, from);
    const to = from - world.grid.width;
    if (
      !looseCellOpen(world.grid, point.x, point.y) ||
      !looseCellOpen(world.grid, point.x, point.y - 1) ||
      occupied.has(to)
    )
      continue;
    const below = world.food.get(to) ?? 0;
    const amount = Math.min(quantity, Math.max(0, world.config.cacheCapacity - below));
    if (amount <= 0) continue;
    const remaining = (world.food.get(from) ?? 0) - amount;
    if (remaining > 0) world.food.set(from, remaining);
    else {
      world.food.delete(from);
      world.foodSources.delete(from);
    }
    world.food.set(to, below + amount);
    world.foodSources.add(to);
  }
}

export function settleWorld(world: World): void {
  if (!world.config.environment.gravity) return;
  const occupied = occupiedCells(world);
  for (const [id, cache] of world.caches) settleCache(world, occupied, id, cache);
  settleBodies(world, occupied);
  settleSpoil(world, occupied);
  settleFood(world, occupied);
}

export const settlingSystem = {
  id: "physical-settling",
  version: 3,
  phase: "settling" as const,
  run: settleWorld,
};

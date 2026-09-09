import { reachableCells } from "../contact";
import { cellIndex, inBounds } from "../grid";
import { foodAt } from "../resources";
import { isInterior } from "../terrain";
import { type Ant, type World, type Nest, type Cache } from "../types";
import { type ColonyKnowledge, type KnownLocation } from "./contract";
import { type Point } from "../geometry";
import { expireWorkHistory } from "../construction/history";
import { cacheAt } from "../construction/sites";
import { adultBodies } from "../adultBody";

/** Colony-owned landmarks may move; no remote food amount or recipient hunger is supplied. */
export function updateLandmark(world: World, id: number, point: Point): void {
  const old = world.knowledge.locations.get(id);
  if (!old || (old.x === point.x && old.y === point.y)) return;
  world.knowledge.locations.set(id, {
    ...old,
    x: point.x,
    y: point.y,
    quantity: 0,
    observedAt: null,
  });
  for (const ant of adultBodies(world))
    if (ant.decision.route?.destination === id) ant.decision.route.offRoute = true;
}

export function createKnowledge(nest: Nest, cache: Cache): ColonyKnowledge {
  const landmarks: KnownLocation[] = [
    { ...nest.entrance, backed: false, id: -1, kind: "entrance", quantity: 0, observedAt: null },
    { ...nest.home, backed: true, id: -2, kind: "queen", quantity: 0, observedAt: null },
    { x: cache.x, y: cache.y, backed: true, id: -3, kind: "cache", quantity: 0, observedAt: null },
    ...nest.chambers
      .filter((room) => room.role === "brood")
      .map((room, i) => ({
        ...room.center,
        backed: true,
        id: -4 - i,
        kind: "care" as const,
        quantity: 0,
        observedAt: null,
      })),
  ];
  return { colonyId: 1, locations: new Map(landmarks.map((location) => [location.id, location])) };
}

export function expireKnowledge(world: World): void {
  expireWorkHistory(world);
  for (const [id, location] of world.knowledge.locations)
    if (
      location.kind === "food" &&
      world.tick - location.observedAt! > world.config.knowledgeDuration
    )
      world.knowledge.locations.delete(id);
}

/** Observation is the only path from physical resource quantities into shared knowledge. */
export function observeKnowledge(world: World, ant: Ant): void {
  const points = [
    ant,
    ...Array.from({ length: 8 }, (_, h) => reachableCells(world, ant, h)).flat(),
  ];
  for (const point of points) {
    if (!inBounds(world.grid, point.x, point.y)) continue;
    const quantity = observeFood(world, point);
    for (const landmark of world.knowledge.locations.values()) {
      if (landmark.kind !== "cache" || landmark.x !== point.x || landmark.y !== point.y) continue;
      world.knowledge.locations.set(landmark.id, { ...landmark, quantity, observedAt: world.tick });
    }
  }
}

function observeFood(world: World, point: Point): number {
  const id = cellIndex(world.grid, point.x, point.y);
  const quantity = foodAt(world, point.x, point.y);
  if (cacheAt(world, point) !== null) world.knowledge.locations.delete(id);
  else if (quantity > 0 || world.knowledge.locations.has(id))
    world.knowledge.locations.set(id, {
      x: point.x,
      y: point.y,
      id,
      backed: isInterior(world.grid, id),
      kind: "food",
      quantity,
      observedAt: world.tick,
    });
  return quantity;
}

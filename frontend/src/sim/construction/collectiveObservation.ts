import { reachableCells } from "../contact";
import { cellIndex } from "../grid";
import { samePoint, stepFrom, type Point } from "../geometry";
import { type World, type Ant } from "../types";
import { Material } from "../materials";
import { type Request } from "../colony/contract";
import { distance, siteIdentity, type SiteObservation } from "./habitat";
import { canDropSpoil, focusLocation } from "./collective";

export const COLLECTIVE_FEATURE_NAMES = [
  "collective",
  "hasFocus",
  "focusDistance",
  "focusAge",
  "focusTarget",
  "focusRoute",
  "areaBrood",
  "areaFree",
  "areaWorkers",
  "workSignal",
  "signalStep",
  "workPulse",
  "localWork",
  "localSupportingBody",
  "localOutdoor",
  "nearFloor",
  "floorBelow",
  "contactFocusDistance",
  "canDrop",
  "localBacked",
  "localFloor",
  "visibleFrontiers",
  "frontierStep",
  "focusHeightDelta",
  "entranceDistance",
  "outwardStep",
] as const;

function localSites(world: World, ant: Ant) {
  const seen = new Map(
    [ant, ...Array.from({ length: 8 }, (_, h) => reachableCells(world, ant, h)).flat()].map(
      (point) => [siteIdentity(cellIndex(world.grid, point.x, point.y)), point]
    )
  );
  const at = (x: number, y: number) => {
    const id = siteIdentity(cellIndex(world.grid, x, y));
    return seen.has(id) ? world.habitat.sites.get(id) : undefined;
  };
  const records = [...seen.keys()].map((id) => world.habitat.sites.get(id)).filter((s) => !!s);
  return { records, at, seen };
}

function exposedWall(
  site: SiteObservation,
  records: SiteObservation[],
  at: ReturnType<typeof localSites>["at"]
): boolean {
  const above = at(site.x, site.y + 1);
  const body = above?.queen || above?.brood != null;
  const outdoor = records.some(
    (r) => r.material === Material.AIR && !r.backed && distance(r, site) <= 2
  );
  return site.work > 0 && site.work < 10 && site.backed && !site.occupied && !body && !outdoor;
}

function localWorkerCount(world: World, ant: Ant, seen: Map<number, Point>): number {
  return world.ants.filter(
    (other) => other !== ant && [...seen.values()].some((p) => samePoint(p, other))
  ).length;
}

/** Current antennal observations only; private focus is not shared with other workers. */
export function observeCollective(world: World, ant: Ant) {
  const { records, at, seen } = localSites(world, ant);
  const focus = focusLocation(ant);
  const entrance = world.knowledge.locations.get(-1);
  const fromEntrance = (point: { x: number; y: number }) =>
    entrance ? Math.abs(point.x - entrance.x) : 0;
  const entranceDistance = fromEntrance(ant);
  const horizontalExitDistance = (point: { x: number }) =>
    entrance ? Math.abs(point.x - entrance.x) : 0;
  const free = records.filter(
    (s) =>
      s.material === Material.AIR &&
      s.supported &&
      !s.queen &&
      s.brood === null &&
      s.food === 0 &&
      at(s.x, s.y + 1)?.material === Material.AIR
  ).length;
  const brood = records.filter((s) => s.brood !== null).length;
  const workers = localWorkerCount(world, ant, seen);
  const floor = (x: number, y: number) => {
    const s = at(x, y);
    return !!s && s.material === Material.AIR && s.supported;
  };
  const frontiers = records.filter(
    (s) =>
      exposedWall(s, records, at) &&
      (!focus || s.y === focus.y || s.y === focus.y + 1) &&
      ((s.supported && (floor(s.x - 1, s.y) || floor(s.x + 1, s.y))) || floor(s.x, s.y - 1))
  );
  const wallDistance = (p: { x: number; y: number }) =>
    Math.min(1000, ...frontiers.map((s) => distance(p, s)));
  const center = world.pheromoneB.values[cellIndex(world.grid, ant.x, ant.y)];
  const contacts = Array.from({ length: 8 }, (_, heading) => {
    const p = stepFrom(ant, heading),
      site = at(p.x, p.y),
      above = at(p.x, p.y + 1);
    return [
      world.pheromoneB.values[cellIndex(world.grid, p.x, p.y)] - center,
      site?.work ?? 1000,
      Number(!!above && (above.queen || above.brood !== null)),
      Number(records.some((s) => s.material === Material.AIR && !s.backed && distance(s, p) <= 2)),
      Number(floor(p.x - 1, p.y) || floor(p.x + 1, p.y)),
      Number(floor(p.x, p.y - 1)),
      focus ? distance(p, focus) : 0,
      Number(canDropSpoil(world, ant, heading)),
      Number(site?.backed),
      Number(site?.supported),
      frontiers.length,
      wallDistance(ant) - wallDistance(p),
      focus ? p.y - focus.y : 0,
      entranceDistance,
      horizontalExitDistance(p) - horizontalExitDistance(ant),
    ];
  });
  return (request: Request) => {
    const c = contacts[request.heading];
    return [
      Number(world.config.environment.collectiveWork),
      Number(!!focus),
      focus ? distance(ant, focus) : 0,
      focus ? world.tick - focus.observedAt! : 0,
      Number(!!focus && request.destination === focus.id),
      Number(!!focus && ant.decision.route?.destination === focus.id),
      brood,
      free,
      workers,
      center,
      c[0],
      Number(world.tick % 64 === ant.id % 64),
      ...c.slice(1),
    ];
  };
}

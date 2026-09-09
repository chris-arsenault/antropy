import { type World } from "../types";
import { type Point } from "../geometry";
import { cellIndex, inBounds } from "../grid";
import { Material } from "../materials";
import { distance, siteIdentity, type SiteObservation } from "./habitat";

export const SPACE_FEATURE_NAMES = [
  "siteFloorNeighbors",
  "siteHeadroom",
  "siteOutdoorNeighbors",
  "siteCacheDistance",
  "siteFloorBelow",
  "siteUpperWork",
  "siteQueenFloor",
  "siteStorageFloor",
  "storageFree",
] as const;

type Lookup = (x: number, y: number) => SiteObservation | undefined;
const open = (site: SiteObservation | undefined) =>
  !!site && [Material.AIR, Material.CACHE].includes(site.material);
const floor = (site: SiteObservation | undefined) => open(site) && site!.supported;

/** Connected floor segments, not room labels or a search through unseen terrain. */
function floorComponent(starts: Point[], at: Lookup): Set<number> {
  const queue = starts.map((p) => at(p.x, p.y)).filter((site) => floor(site));
  const seen = new Set<number>();
  for (let i = 0; i < queue.length; i++) {
    const site = queue[i]!;
    if (seen.has(site.id)) continue;
    seen.add(site.id);
    for (const dx of [-1, 1]) {
      const neighbor = at(site.x + dx, site.y);
      if (floor(neighbor) && !seen.has(neighbor!.id)) queue.push(neighbor);
    }
  }
  return seen;
}

function touchesFloor(site: SiteObservation, cells: Set<number>, at: Lookup): boolean {
  return [site, at(site.x - 1, site.y), at(site.x + 1, site.y), at(site.x, site.y - 1)].some(
    (point) => !!point && cells.has(point.id)
  );
}

/** Geometry comes only from timestamped observations, including unknown neighboring cells. */
export function observeSpace(world: World, sites: SiteObservation[]) {
  const known = new Map(sites.map((site) => [site.id, site]));
  const caches = [...world.knowledge.locations.values()].filter((site) => site.kind === "cache");
  const at = (x: number, y: number) =>
    inBounds(world.grid, x, y) ? known.get(siteIdentity(cellIndex(world.grid, x, y))) : undefined;
  const neighbors = (site: Point) =>
    Number(floor(at(site.x - 1, site.y))) + Number(floor(at(site.x + 1, site.y)));
  const headroom = (site: Point) => open(at(site.x, site.y + 1));
  const cacheDistance = (site: Point) =>
    caches.length ? Math.min(...caches.map((cache) => distance(site, cache))) : world.grid.width;
  const outdoors = (site: Point) => {
    let count = 0;
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 2; dy++) {
        if (Math.abs(dx) + Math.abs(dy) > 2) continue;
        const adjacent = at(site.x + dx, site.y + dy);
        count += Number(open(adjacent) && !adjacent!.backed);
      }
    return count;
  };
  const usable = (site: SiteObservation) =>
    site.material === Material.AIR &&
    site.supported &&
    site.backed &&
    !site.queen &&
    site.brood === null &&
    site.food === 0 &&
    headroom(site) &&
    neighbors(site) > 0 &&
    outdoors(site) === 0;
  const queen = world.knowledge.locations.get(-2);
  const queenFloor = floorComponent(queen ? [queen] : [], at),
    cacheFloor = floorComponent(caches, at);
  const storageFree = sites.filter(
    (site) => usable(site) && cacheFloor.has(site.id) && !!queen && distance(site, queen) > 3
  ).length;
  const memo = new Map<number, number[]>();
  return {
    usable,
    nursery: (site: SiteObservation) => queenFloor.has(site.id) && usable(site),
    inputs(site: SiteObservation | undefined): number[] {
      if (!site) return [0, 0, 0, world.grid.width, 0, 1000, 0, 0, storageFree];
      if (!memo.has(site.id)) {
        const above = at(site.x, site.y + 1),
          below = at(site.x, site.y - 1);
        memo.set(site.id, [
          neighbors(site),
          Number(headroom(site)),
          outdoors(site),
          cacheDistance(site),
          Number(floor(below) && neighbors(below!) > 0 && !below!.queen && below!.brood === null),
          above?.work ?? 1000,
          Number(touchesFloor(site, queenFloor, at)),
          Number(touchesFloor(site, cacheFloor, at)),
        ]);
      }
      return [...memo.get(site.id)!, storageFree];
    },
  };
}

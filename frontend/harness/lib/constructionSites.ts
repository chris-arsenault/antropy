import { supportedSite } from "../../src/sim/construction/sites";
import { diggable } from "../../src/sim/construction/excavation";
import { getCell } from "../../src/sim/grid";
import { DIRECTIONS, type Point } from "../../src/sim/geometry";
import { type World } from "../../src/sim/types";
import { isWalkable } from "../../src/sim/terrain";

/** Harness-authored requests on actual nest terrain; never called by a controller. */
export function constructionSites(world: World): {
  queen: Point;
  cache: Point;
  moved: Point;
  dig: Point;
  dump: Point;
} {
  const sites = supportedSites(world);
  sites.sort((a, b) => distance(a, world.queen) - distance(b, world.queen));
  const separated: Point[] = [];
  for (const point of sites)
    if (separated.every((p) => distance(p, point) > 2)) separated.push(point);
  const [queen, cache, moved, dump] = separated;
  if (!dump) throw new Error("not enough separate supported construction sites");
  const dig = DIRECTIONS.map((d) => ({ x: dump.x + d.x, y: dump.y + d.y })).find(
    (p) => diggable(getCell(world.grid, p.x, p.y)) && isWalkable(world.grid, p.x, p.y + 1)
  );
  if (!dig) throw new Error("no reachable dig face beside nominated disposal site");
  return { queen, cache, moved, dig, dump };
}

function supportedSites(world: World): Point[] {
  const sites: Point[] = [];
  for (let dy = -12; dy <= 12; dy++)
    for (let dx = -16; dx <= 16; dx++) {
      const p = { x: world.queen.x + dx, y: world.queen.y + dy };
      if (supportedSite(world, p) && Math.abs(dx) + Math.abs(dy) > 2) sites.push(p);
    }
  return sites;
}

function distance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

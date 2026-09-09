import { reachableCells, occupied } from "../contact";
import { cellIndex, getCell, inBounds, pointAt } from "../grid";
import { samePoint, stepFrom, type Point } from "../geometry";
import { type Request } from "../colony/contract";
import { MATERIALS, Material } from "../materials";
import { foodAt } from "../resources";
import { type Ant, type World } from "../types";
import { localClimate } from "../climate/state";
import { looseCellOpen } from "../support";
import { broodLandmark } from "./brood";

export interface SiteObservation extends Point {
  id: number;
  tick: number;
  temperature: number;
  moisture: number;
  material: Material;
  work: number;
  supported: boolean;
  occupied: boolean;
  brood: number | null;
  queen: boolean;
  food: number;
  backed: boolean;
  traffic: number;
}
export interface HabitatState {
  sites: Map<number, SiteObservation>;
  traffic: Map<number, { tick: number; count: number }>;
}
export const siteIdentity = (index: number): number => -1_000_000_000 - index;
export const distance = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function siteObservation(world: World, ant: Ant, point: Point): SiteObservation {
  const index = cellIndex(world.grid, point.x, point.y),
    material = getCell(world.grid, point.x, point.y);
  const body = world.brood.find((brood) => samePoint(brood, point));
  return {
    x: point.x,
    y: point.y,
    id: siteIdentity(index),
    tick: world.tick,
    ...localClimate(world, point),
    material,
    work: Math.min(1000, MATERIALS[material].excavationWork),
    supported: !looseCellOpen(world.grid, point.x, point.y - 1),
    occupied: occupied(world, point, ant),
    brood: body?.id ?? null,
    queen: world.queen.alive && samePoint(world.queen, point),
    food: foodAt(world, point.x, point.y),
    backed: world.grid.backing[index] !== Material.AIR,
    traffic: nearbyTraffic(world, point),
  };
}

function nearbyTraffic(world: World, point: Point): number {
  let result = 0;
  for (let x = point.x - 1; x <= point.x + 1; x++)
    for (let y = point.y - 1; y <= point.y + 1; y++) {
      const traffic = world.habitat.traffic.get(cellIndex(world.grid, x, y));
      if (traffic)
        result = Math.max(
          result,
          traffic.count * Math.max(0, 1 - (world.tick - traffic.tick) / 256)
        );
    }
  return result;
}

export function observeHabitat(world: World, ant: Ant): void {
  const points = [
    ant,
    ...Array.from({ length: 8 }, (_, h) => reachableCells(world, ant, h)).flat(),
  ];
  for (const point of points) {
    if (!inBounds(world.grid, point.x, point.y)) continue;
    const record = siteObservation(world, ant, point);
    world.habitat.sites.set(record.id, record);
    if (record.queen) observeQueen(world);
    if (record.brood !== null) observeBrood(world, record);
  }
  if (world.tick % 64 === 0) expireSites(world);
}

function observeBrood(world: World, record: SiteObservation): void {
  invalidateOldBrood(world, record);
  world.knowledge.locations.set(broodLandmark(record.brood!), {
    x: record.x,
    y: record.y,
    id: broodLandmark(record.brood!),
    kind: "care",
    backed: record.backed,
    quantity: broodNeed(world, record.brood!),
    observedAt: world.tick,
  });
}

function observeQueen(world: World): void {
  const queen = world.knowledge.locations.get(-2);
  if (queen)
    world.knowledge.locations.set(-2, {
      ...queen,
      observedAt: world.tick,
      quantity: Math.max(0, world.config.queenEnergy - world.queen.energy),
    });
}

function invalidateOldBrood(world: World, observed: SiteObservation): void {
  for (const [id, site] of world.habitat.sites)
    if (id !== observed.id && site.brood === observed.brood)
      world.habitat.sites.set(id, { ...site, brood: null });
}

function broodNeed(world: World, id: number): number {
  const body = world.brood.find((brood) => brood.id === id);
  if (!body || body.stage !== "larva") return 0;
  return Math.max(
    0,
    world.config.broodInvestment + world.config.workerEggCost - body.energy - body.investment
  );
}

function expireSites(world: World): void {
  for (const [id, site] of world.habitat.sites)
    if (world.tick - site.tick > world.config.knowledgeDuration) world.habitat.sites.delete(id);
  for (const [id, traffic] of world.habitat.traffic)
    if (world.tick - traffic.tick > 256) world.habitat.traffic.delete(id);
  if (world.habitat.sites.size <= 4096) return;
  const oldest = [...world.habitat.sites.values()].sort((a, b) => a.tick - b.tick);
  for (const site of oldest.slice(0, oldest.length - 4096)) world.habitat.sites.delete(site.id);
}

export function recordTraffic(world: World, ant: Ant, request: Request): void {
  if (!world.config.environment.autonomousConstruction) return;
  if (!occupied(world, attemptedPoint(world, ant, request), ant)) return;
  const index = cellIndex(world.grid, ant.x, ant.y),
    previous = world.habitat.traffic.get(index);
  const count = previous ? previous.count * Math.max(0, 1 - (world.tick - previous.tick) / 256) : 0;
  world.habitat.traffic.set(index, { tick: world.tick, count: Math.min(32, count + 1) });
}

function attemptedPoint(world: World, ant: Ant, request: Request): Point {
  const route = ant.decision.route;
  if (!route || !["forward", "backward"].includes(request.kind))
    return stepFrom(ant, request.heading);
  const cell = route.cells[route.cursor + (request.kind === "forward" ? 1 : -1)];
  return cell === undefined ? ant : pointAt(world.grid, cell);
}

export function availableSites(world: World): SiteObservation[] {
  return [...world.habitat.sites.values()].filter(
    (site) => world.tick - site.tick <= world.config.knowledgeDuration
  );
}

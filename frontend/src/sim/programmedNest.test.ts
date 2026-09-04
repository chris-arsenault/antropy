import { describe, expect, it } from "vitest";
import { PROGRAMMED_COLONY_CONFIG } from "./config";
import { rnnController } from "./controller/rnn";
import { getVoxel, inBounds, voxelIndex } from "./grid";
import { Material } from "./materials";
import { isLegalPosition } from "./movement";
import { authorProgrammedNest, type NestPoint } from "./programmedNest";
import { createWorld, type World } from "./world";

const NEIGHBORS: readonly NestPoint[] = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

function reachableAir(world: World, start: NestPoint): Set<number> {
  const reached = new Set<number>();
  const queue = [start];
  for (let read = 0; read < queue.length; read++) {
    const point = queue[read];
    const key = voxelIndex(world.grid, point.x, point.y, point.z);
    if (reached.has(key)) {
      continue;
    }
    reached.add(key);
    for (const offset of NEIGHBORS) {
      const next = { x: point.x + offset.x, y: point.y + offset.y, z: point.z + offset.z };
      const insideReviewVolume =
        Math.abs(next.x - start.x) <= 20 &&
        Math.abs(next.z - start.z) <= 20 &&
        next.y >= 3 &&
        next.y <= start.y;
      if (
        insideReviewVolume &&
        inBounds(world.grid, next.x, next.y, next.z) &&
        getVoxel(world.grid, next.x, next.y, next.z) === Material.AIR
      ) {
        queue.push(next);
      }
    }
  }
  return reached;
}

function coordinates(world: World, index: number): NestPoint {
  const x = index % world.grid.sizeX;
  const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
  const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
  return { x, y, z };
}

function surfaceBreaches(world: World, entrance: NestPoint): NestPoint[] {
  const breaches: NestPoint[] = [];
  for (const index of world.cavities) {
    const point = coordinates(world, index);
    const inEntranceAperture =
      Math.max(Math.abs(point.x - entrance.x), Math.abs(point.z - entrance.z)) <= 1;
    if (inEntranceAperture) continue;
    const exposed = NEIGHBORS.some(({ x: dx, y: dy, z: dz }) => {
      const x = point.x + dx;
      const y = point.y + dy;
      const z = point.z + dz;
      if (!inBounds(world.grid, x, y, z) || getVoxel(world.grid, x, y, z) !== Material.AIR) {
        return false;
      }
      return y > world.surfaceMap[z * world.grid.sizeX + x];
    });
    if (exposed) breaches.push(point);
  }
  return breaches;
}

describe("programmed colony nest", () => {
  it("uses an organic passage graph without an uninterrupted central shaft", () => {
    const world = createWorld(1, rnnController, PROGRAMMED_COLONY_CONFIG);
    const nest = authorProgrammedNest(world);
    const deepestRoomY = Math.min(...nest.chambers.map((chamber) => chamber.center.y));
    const centralColumn = Array.from({ length: nest.entrance.y - deepestRoomY + 1 }, (_, offset) =>
      getVoxel(world.grid, nest.entrance.x, deepestRoomY + offset, nest.entrance.z)
    );
    const routeDeltas = nest.passages.map((passage) => {
      const from = passage.points[0];
      const to = passage.points[passage.points.length - 1];
      return { dx: to.x - from.x, dy: to.y - from.y, dz: to.z - from.z };
    });
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();
    for (const passage of nest.passages) {
      outgoing.set(passage.from, (outgoing.get(passage.from) ?? 0) + 1);
      incoming.set(passage.to, (incoming.get(passage.to) ?? 0) + 1);
    }

    expect(centralColumn.some((material) => material !== Material.AIR)).toBe(true);
    expect(
      nest.junctions.filter(
        (junction) => junction.point.x === nest.entrance.x && junction.point.z === nest.entrance.z
      ).length
    ).toBeLessThanOrEqual(1);
    expect(routeDeltas.some(({ dx, dy, dz }) => dx === 0 && dy !== 0 && dz === 0)).toBe(true);
    expect(routeDeltas.some(({ dx, dy, dz }) => dy === 0 && (dx !== 0 || dz !== 0))).toBe(true);
    expect(routeDeltas.some(({ dx, dy, dz }) => dy !== 0 && (dx !== 0 || dz !== 0))).toBe(true);
    expect(nest.passages.some((passage) => passage.points.length > 2)).toBe(true);
    expect([...outgoing.values()].some((degree) => degree >= 3)).toBe(true);
    expect([...incoming.values()].some((degree) => degree >= 2)).toBe(true);
    expect(nest.passages.length).toBeGreaterThan(
      1 + nest.junctions.length + nest.chambers.length - 1
    );
  });

  it("authors connected three-dimensional traffic and functional rooms", () => {
    const world = createWorld(1, rnnController, PROGRAMMED_COLONY_CONFIG);
    const nest = authorProgrammedNest(world);
    const roles = nest.chambers.map((chamber) => chamber.role);
    const levels = new Set(nest.chambers.map((chamber) => chamber.center.y));
    const reached = reachableAir(world, nest.entrance);

    expect(nest.chambers).toHaveLength(8);
    expect(roles.filter((role) => role === "brood")).toHaveLength(4);
    expect(roles.filter((role) => role === "pupae")).toHaveLength(1);
    expect(roles.filter((role) => role === "food")).toHaveLength(2);
    expect(roles.filter((role) => role === "queen")).toHaveLength(1);
    expect(levels.size).toBeGreaterThanOrEqual(6);
    expect(world.cavities.size).toBeGreaterThan(1_000);
    expect(
      nest.chambers.every((chamber) =>
        reached.has(voxelIndex(world.grid, chamber.center.x, chamber.center.y, chamber.center.z))
      )
    ).toBe(true);
    expect(
      nest.workerStations.every((station) =>
        isLegalPosition(world.grid, station.x, station.y, station.z)
      )
    ).toBe(true);
  });

  it("keeps the authored network underground except at its designated entrance", () => {
    for (const seed of [1, 20_000, 20_001, 20_002, 20_003, 20_004]) {
      const world = createWorld(seed, rnnController, PROGRAMMED_COLONY_CONFIG);
      const nest = authorProgrammedNest(world);
      expect(surfaceBreaches(world, nest.entrance), `world seed ${seed}`).toEqual([]);
    }
  });
});

import { type Colony } from "./colony";
import { getVoxel, inBounds } from "./grid";
import { Material } from "./materials";
import { isLegalPosition } from "./movement";
import { mutateVoxel, type World } from "./world";

export type ProgrammedChamberRole = "brood" | "pupae" | "food" | "queen";

export interface NestPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ProgrammedChamber {
  readonly id: string;
  readonly role: ProgrammedChamberRole;
  readonly center: NestPoint;
  readonly radius: NestPoint;
}

export interface ProgrammedJunction {
  readonly id: string;
  readonly point: NestPoint;
}

export interface ProgrammedPassage {
  readonly from: string;
  readonly to: string;
  readonly points: readonly NestPoint[];
}

export interface ProgrammedNest {
  readonly entrance: NestPoint;
  readonly queenHome: NestPoint;
  readonly chambers: readonly ProgrammedChamber[];
  readonly junctions: readonly ProgrammedJunction[];
  readonly passages: readonly ProgrammedPassage[];
  readonly workerStations: readonly NestPoint[];
}

interface ChamberSpec {
  readonly id: string;
  readonly role: ProgrammedChamberRole;
  readonly dx: number;
  readonly depth: number;
  readonly dz: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz: number;
}

interface JunctionSpec {
  readonly id: string;
  readonly dx: number;
  readonly depth: number;
  readonly dz: number;
}

interface PassageSpec {
  readonly from: string;
  readonly to: string;
}

const CHAMBER_SPECS: readonly ChamberSpec[] = [
  { id: "upper-east-brood", role: "brood", dx: 9, depth: 6, dz: -7, rx: 5, ry: 2, rz: 4 },
  { id: "upper-west-brood", role: "brood", dx: -10, depth: 8, dz: 5, rx: 4, ry: 2, rz: 5 },
  { id: "middle-east-pupae", role: "pupae", dx: 11, depth: 12, dz: 7, rx: 5, ry: 2, rz: 3 },
  { id: "middle-west-brood", role: "brood", dx: -9, depth: 14, dz: -8, rx: 6, ry: 2, rz: 4 },
  { id: "lower-east-food", role: "food", dx: 10, depth: 18, dz: -9, rx: 6, ry: 3, rz: 4 },
  { id: "lower-west-food", role: "food", dx: -11, depth: 20, dz: 7, rx: 4, ry: 2, rz: 5 },
  { id: "deep-west-brood", role: "brood", dx: -8, depth: 25, dz: -6, rx: 5, ry: 3, rz: 4 },
  { id: "queen-chamber", role: "queen", dx: 9, depth: 27, dz: 4, rx: 7, ry: 3, rz: 5 },
];

const JUNCTION_SPECS: readonly JunctionSpec[] = [
  { id: "entrance-neck", dx: 0, depth: 2, dz: 0 },
  { id: "upper-fork", dx: 2, depth: 6, dz: -1 },
  { id: "east-upper-junction", dx: 5, depth: 8, dz: -3 },
  { id: "west-upper-junction", dx: -4, depth: 9, dz: 2 },
  { id: "west-drop-junction", dx: -4, depth: 14, dz: 2 },
  { id: "middle-crossing", dx: 1, depth: 13, dz: 2 },
  { id: "east-middle-junction", dx: 5, depth: 13, dz: 3 },
  { id: "west-middle-junction", dx: -5, depth: 14, dz: -3 },
  { id: "lower-crossing", dx: -1, depth: 18, dz: -1 },
  { id: "east-lower-junction", dx: 5, depth: 19, dz: 3 },
  { id: "west-lower-junction", dx: -5, depth: 20, dz: -3 },
  { id: "east-drop-junction", dx: 5, depth: 24, dz: 3 },
  { id: "deep-crossing", dx: 1, depth: 25, dz: 1 },
];

const PASSAGE_SPECS: readonly PassageSpec[] = [
  { from: "entrance", to: "entrance-neck" },
  { from: "entrance-neck", to: "upper-fork" },
  { from: "upper-fork", to: "east-upper-junction" },
  { from: "upper-fork", to: "west-upper-junction" },
  { from: "upper-fork", to: "middle-crossing" },
  { from: "east-upper-junction", to: "upper-east-brood" },
  { from: "east-upper-junction", to: "east-middle-junction" },
  { from: "west-upper-junction", to: "upper-west-brood" },
  { from: "west-upper-junction", to: "west-drop-junction" },
  { from: "west-drop-junction", to: "west-middle-junction" },
  { from: "west-drop-junction", to: "middle-crossing" },
  { from: "middle-crossing", to: "east-middle-junction" },
  { from: "middle-crossing", to: "west-middle-junction" },
  { from: "east-middle-junction", to: "middle-east-pupae" },
  { from: "west-middle-junction", to: "middle-west-brood" },
  { from: "east-middle-junction", to: "west-middle-junction" },
  { from: "east-middle-junction", to: "lower-crossing" },
  { from: "west-middle-junction", to: "lower-crossing" },
  { from: "lower-crossing", to: "east-lower-junction" },
  { from: "lower-crossing", to: "west-lower-junction" },
  { from: "east-lower-junction", to: "lower-east-food" },
  { from: "west-lower-junction", to: "lower-west-food" },
  { from: "east-lower-junction", to: "west-lower-junction" },
  { from: "east-lower-junction", to: "east-drop-junction" },
  { from: "east-drop-junction", to: "deep-crossing" },
  { from: "west-lower-junction", to: "deep-crossing" },
  { from: "west-lower-junction", to: "deep-west-brood" },
  { from: "deep-crossing", to: "deep-west-brood" },
  { from: "deep-crossing", to: "queen-chamber" },
  { from: "east-drop-junction", to: "queen-chamber" },
  { from: "deep-west-brood", to: "queen-chamber" },
];

const STATION_OFFSETS: readonly (readonly [number, number])[] = [
  [0, 0],
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
];

function carveAir(world: World, x: number, y: number, z: number): void {
  if (inBounds(world.grid, x, y, z) && getVoxel(world.grid, x, y, z) !== Material.AIR) {
    mutateVoxel(world, x, y, z, Material.AIR);
  }
}

function carveChamber(world: World, chamber: ProgrammedChamber): void {
  const { center, radius } = chamber;
  for (let dy = -radius.y; dy <= radius.y; dy++) {
    for (let dz = -radius.z; dz <= radius.z; dz++) {
      for (let dx = -radius.x; dx <= radius.x; dx++) {
        const distance =
          (dx * dx) / (radius.x * radius.x) +
          (dy * dy) / (radius.y * radius.y) +
          (dz * dz) / (radius.z * radius.z);
        if (distance <= 1) {
          carveAir(world, center.x + dx, center.y + dy, center.z + dz);
        }
      }
    }
  }
}

function carvePassageCell(world: World, x: number, y: number, z: number): void {
  carveAir(world, x, y, z);
  carveAir(world, x, y + 1, z);
}

function carveSegment(world: World, from: NestPoint, to: NestPoint): void {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), Math.abs(to.z - from.z));
  let x = from.x;
  let y = from.y;
  let z = from.z;
  carvePassageCell(world, x, y, z);
  for (let step = 1; step <= steps; step++) {
    const next = {
      x: Math.round(from.x + ((to.x - from.x) * step) / steps),
      y: Math.round(from.y + ((to.y - from.y) * step) / steps),
      z: Math.round(from.z + ((to.z - from.z) * step) / steps),
    };
    while (x !== next.x) {
      x += Math.sign(next.x - x);
      carvePassageCell(world, x, y, z);
    }
    while (z !== next.z) {
      z += Math.sign(next.z - z);
      carvePassageCell(world, x, y, z);
    }
    while (y !== next.y) {
      y += Math.sign(next.y - y);
      carvePassageCell(world, x, y, z);
    }
  }
}

function carvePassage(world: World, passage: ProgrammedPassage): void {
  for (let index = 1; index < passage.points.length; index++) {
    carveSegment(world, passage.points[index - 1], passage.points[index]);
  }
}

function carveJunction(world: World, junction: ProgrammedJunction): void {
  carvePassageCell(world, junction.point.x, junction.point.y, junction.point.z);
  for (const [dx, dz] of STATION_OFFSETS.slice(1)) {
    carvePassageCell(world, junction.point.x + dx / 2, junction.point.y, junction.point.z + dz / 2);
  }
}

function makeChambers(cx: number, surfaceY: number, cz: number): ProgrammedChamber[] {
  return CHAMBER_SPECS.map((spec) => ({
    id: spec.id,
    role: spec.role,
    center: { x: cx + spec.dx, y: Math.max(spec.ry + 3, surfaceY - spec.depth), z: cz + spec.dz },
    radius: { x: spec.rx, y: spec.ry, z: spec.rz },
  }));
}

function makeJunctions(cx: number, surfaceY: number, cz: number): ProgrammedJunction[] {
  return JUNCTION_SPECS.map((spec) => ({
    id: spec.id,
    point: { x: cx + spec.dx, y: Math.max(4, surfaceY - spec.depth), z: cz + spec.dz },
  }));
}

function passagePoints(from: NestPoint, to: NestPoint, index: number): NestPoint[] {
  if (from.x === to.x && from.z === to.z) {
    return [from, to];
  }
  const bend = index % 2 === 0 ? 1 : -1;
  const perpendicularX = to.z === from.z ? 0 : Math.sign(to.z - from.z) * bend;
  const perpendicularZ = to.x === from.x ? 0 : -Math.sign(to.x - from.x) * bend;
  return [
    from,
    {
      x: Math.round((from.x + to.x) / 2) + perpendicularX,
      y: Math.round((from.y + to.y) / 2),
      z: Math.round((from.z + to.z) / 2) + perpendicularZ,
    },
    to,
  ];
}

function makePassages(
  entrance: NestPoint,
  junctions: readonly ProgrammedJunction[],
  chambers: readonly ProgrammedChamber[]
): ProgrammedPassage[] {
  const nodes = new Map<string, NestPoint>([["entrance", entrance]]);
  for (const junction of junctions) {
    nodes.set(junction.id, junction.point);
  }
  for (const chamber of chambers) {
    nodes.set(chamber.id, chamber.center);
  }
  return PASSAGE_SPECS.map((spec, index) => {
    const from = nodes.get(spec.from);
    const to = nodes.get(spec.to);
    if (!from || !to) {
      throw new Error(`programmed passage has unknown endpoint ${spec.from} -> ${spec.to}`);
    }
    return { ...spec, points: passagePoints(from, to, index) };
  });
}

function makeWorkerStations(chambers: readonly ProgrammedChamber[]): NestPoint[] {
  return chambers.flatMap((chamber) =>
    STATION_OFFSETS.map(([dx, dz]) => ({
      x: chamber.center.x + dx,
      y: chamber.center.y - chamber.radius.y + 1,
      z: chamber.center.z + dz,
    }))
  );
}

/**
 * Author the review colony as terrain, not ant behavior. Short horizontal,
 * vertical, and sloped passages weave through shared junctions and cross-links;
 * no uninterrupted central bore dominates the network. Room roles remain layout
 * data for later food, brood, and survival work; they do not steer ants.
 */
export function authorProgrammedNest(world: World): ProgrammedNest {
  const cx = Math.floor(world.grid.sizeX / 2);
  const cz = Math.floor(world.grid.sizeZ / 2);
  const surfaceY = Math.max(
    world.surfaceMap[cz * world.grid.sizeX + cx],
    world.surfaceMap[cz * world.grid.sizeX + cx + 1],
    world.surfaceMap[(cz + 1) * world.grid.sizeX + cx],
    world.surfaceMap[(cz + 1) * world.grid.sizeX + cx + 1]
  );
  const entrance = { x: cx, y: surfaceY + 1, z: cz };
  const chambers = makeChambers(cx, surfaceY, cz);
  const junctions = makeJunctions(cx, surfaceY, cz);
  const passages = makePassages(entrance, junctions, chambers);
  const queen = chambers.find((chamber) => chamber.role === "queen");
  if (!queen) {
    throw new Error("programmed nest requires a queen chamber");
  }
  const queenHome = {
    x: queen.center.x,
    y: queen.center.y - queen.radius.y + 1,
    z: queen.center.z,
  };
  const workerStations = makeWorkerStations(chambers);

  for (const chamber of chambers) {
    carveChamber(world, chamber);
  }
  for (const passage of passages) {
    carvePassage(world, passage);
  }
  for (const junction of junctions) {
    carveJunction(world, junction);
  }
  return { entrance, queenHome, chambers, junctions, passages, workerStations };
}

/** Place the scripted queen and fixed founder workforce inside the authored rooms. */
export function occupyProgrammedNest(world: World, colony: Colony, nest: ProgrammedNest): void {
  if (nest.workerStations.length < world.ants.length) {
    throw new Error("programmed nest has fewer worker stations than founder ants");
  }
  colony.x = nest.queenHome.x;
  colony.y = nest.queenHome.y;
  colony.z = nest.queenHome.z;
  for (const [index, ant] of world.ants.entries()) {
    const station = nest.workerStations[index];
    if (!isLegalPosition(world.grid, station.x, station.y, station.z)) {
      throw new Error(`illegal programmed worker station ${station.x},${station.y},${station.z}`);
    }
    ant.x = station.x;
    ant.y = station.y;
    ant.z = station.z;
    ant.prevX = station.x;
    ant.prevY = station.y;
    ant.prevZ = station.z;
    ant.heading = (index % 8) * (Math.PI / 4);
    ant.moveCharge = 0;
    ant.falling = false;
  }
}

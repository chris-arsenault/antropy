import { type World, type Cell } from "./types";
import { type Config } from "./config";
import { radius, wrap } from "./geometry";
import { sample, sampleAt } from "./fields";
import { energyCapacity, materialCapacity } from "./body";
import { targetBody } from "./phenotype";
import { protection, typeShares } from "./chemotype";

/** Front, rear, left and right perimeter points; the same arithmetic as `moved`. */
function perimeter(cell: Cell, c: Config): Float64Array {
  const r = radius(cell, c),
    points = new Float64Array(8);
  [0, Math.PI, -Math.PI / 2, Math.PI / 2].forEach((angle, i) => {
    const heading = cell.heading + angle;
    points[2 * i] = wrap(cell.x + Math.cos(heading) * r, c.width);
    points[2 * i + 1] = wrap(cell.y + Math.sin(heading) * r, c.height);
  });
  return points;
}
type Reader = (x: number, y: number) => number;
const fieldReader =
  (field: Float64Array, c: Config): Reader =>
  (x, y) =>
    sampleAt(field, x, y, c);
/**
 * Toxin as the cell is hurt by it. With one toxin type this is the raw field; with two, each type
 * is discounted by the cell's protection against it relative to an undefended cell, so a producer
 * barely senses its own family's toxin and senses a foreign type in full.
 */
function toxinReader(world: World, cell: Cell): Reader {
  const c = world.config;
  if (c.toxinTypes === 1) return fieldReader(world.toxin, c);
  const shares = typeShares(world, cell),
    bare = protection(cell, c, 0),
    weightA = bare / protection(cell, c, shares[0]),
    weightB = bare / protection(cell, c, shares[1]);
  return (x, y) =>
    weightA * sampleAt(world.toxin, x, y, c) + weightB * sampleAt(world.toxinB, x, y, c);
}
function chemicalReads(
  cell: Cell,
  read: Reader,
  k: number,
  baseline: number,
  p: Float64Array
): number[] {
  const center = read(cell.x, cell.y);
  const front = read(p[0], p[1]),
    rear = read(p[2], p[3]),
    left = read(p[4], p[5]),
    right = read(p[6], p[7]);
  const tonic = center / (center + k);
  return [
    tonic,
    tonic - baseline,
    (front - rear) / (front + rear + 2 * k),
    (left - right) / (left + right + 2 * k),
  ];
}
export function initializeReceptors(world: World, cell: Cell): void {
  const c = world.config,
    n = sample(world.nutrient, cell, c),
    s = sample(world.chemical, cell, c),
    b = sample(world.nutrientB, cell, c),
    t = toxinReader(world, cell)(cell.x, cell.y);
  cell.receptors = [
    n / (n + c.nutrientK),
    s / (s + c.chemicalK),
    b / (b + c.nutrientK),
    t / (t + c.toxinK),
  ];
}
export function observe(world: World, cell: Cell): Float32Array {
  const c = world.config,
    r = perimeter(cell, c);
  const nutrient = chemicalReads(
    cell,
    fieldReader(world.nutrient, c),
    c.nutrientK,
    cell.receptors[0],
    r
  );
  const chemical = chemicalReads(
    cell,
    fieldReader(world.chemical, c),
    c.chemicalK,
    cell.receptors[1],
    r
  );
  const foodB = chemicalReads(
    cell,
    fieldReader(world.nutrientB, c),
    c.nutrientK,
    cell.receptors[2],
    r
  );
  const toxin = chemicalReads(cell, toxinReader(world, cell), c.toxinK, cell.receptors[3], r);
  const matrix = chemicalReads(cell, fieldReader(world.matrix, c), c.matrixBarrier, 0, r);
  const alpha = 1 - Math.exp(-c.dt / c.receptorTau);
  cell.receptors[0] += alpha * nutrient[1];
  cell.receptors[1] += alpha * chemical[1];
  cell.receptors[2] += alpha * foodB[1];
  cell.receptors[3] += alpha * toxin[1];
  const b = cell.body;
  return Float32Array.from([
    ...nutrient,
    ...chemical,
    Math.min(1, cell.energy / energyCapacity(b, c)),
    Math.max(0, Math.min(1, b.core / targetBody(world, cell).core - 1)),
    ...cell.contacts,
    cell.brain.task / 255,
    b.motor / (b.motor + c.birthMass * c.motorRatio),
    b.transport / (b.transport + c.birthMass * c.transporterRatio),
    b.storage / (b.storage + c.birthMass * c.storageRatio),
    Math.min(1, cell.reserve / materialCapacity(b, c)),
    ...foodB,
    ...toxin,
    matrix[0],
    matrix[2],
    matrix[3],
    cell.damage,
    b.transportB / (b.transportB + c.birthMass * c.transportBRatio),
    b.defense / (b.defense + c.birthMass * c.defenseRatio),
    b.weapon / (b.weapon + c.birthMass * c.weaponRatio),
    b.builder / (b.builder + c.birthMass * c.builderRatio),
  ]);
}

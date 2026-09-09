import { type World, type Cell } from "./types";
import { moved, radius } from "./geometry";
import { sample } from "./fields";

function chemicalReads(
  world: World,
  cell: Cell,
  field: Float64Array,
  k: number,
  baseline: number
): number[] {
  const c = world.config,
    r = radius(cell.mass, c),
    center = sample(field, cell, c);
  const around = [0, Math.PI, -Math.PI / 2, Math.PI / 2].map((angle) =>
    sample(field, moved(cell, cell.heading + angle, r, c), c)
  );
  const tonic = center / (center + k);
  return [
    tonic,
    tonic - baseline,
    (around[0] - around[1]) / (around[0] + around[1] + 2 * k),
    (around[2] - around[3]) / (around[2] + around[3] + 2 * k),
  ];
}
export function initializeReceptors(world: World, cell: Cell): void {
  const c = world.config,
    n = sample(world.nutrient, cell, c),
    s = sample(world.chemical, cell, c);
  cell.receptors = [n / (n + c.nutrientK), s / (s + c.chemicalK)];
}
export function observe(world: World, cell: Cell): Float32Array {
  const c = world.config;
  const nutrient = chemicalReads(world, cell, world.nutrient, c.nutrientK, cell.receptors[0]);
  const chemical = chemicalReads(world, cell, world.chemical, c.chemicalK, cell.receptors[1]);
  const alpha = 1 - Math.exp(-c.dt / c.receptorTau);
  cell.receptors[0] += alpha * nutrient[1];
  cell.receptors[1] += alpha * chemical[1];
  return Float32Array.from([
    ...nutrient,
    ...chemical,
    Math.min(1, cell.energy / (c.reservePerMass * cell.mass)),
    Math.min(1, (cell.mass - c.birthMass) / c.birthMass),
    ...cell.contacts,
    cell.brain.task / 255,
  ]);
}

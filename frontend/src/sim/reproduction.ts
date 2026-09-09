import { type World, type Cell, type Point } from "./types";
import { controller } from "./controller";
import { emptyAction, INPUTS } from "./interface";
import { initializeReceptors } from "./sensors";
import { moved, radius } from "./geometry";
import { nextRandom } from "./random";
import { SpatialIndex } from "./spatial";
import { recordEvent } from "./events";

export function makeCell(
  world: World,
  position: Point,
  parent: Cell | null,
  genome: number,
  energy: number
): Cell {
  const id = world.nextCell++;
  const cell: Cell = {
    ...position,
    id,
    parent: parent?.id ?? null,
    lineage: parent?.lineage ?? id,
    generation: parent ? parent.generation + 1 : 0,
    genome,
    heading: nextRandom(world.rng) * 2 * Math.PI,
    mass: world.config.birthMass,
    energy,
    born: world.tick,
    brain: controller.createState(),
    receptors: [0, 0],
    contacts: [0, 0, 0, 0],
    inputs: new Float32Array(INPUTS),
    action: emptyAction(),
  };
  initializeReceptors(world, cell);
  world.ancestry.set(id, {
    id,
    parent: cell.parent,
    lineage: cell.lineage,
    genome,
    born: world.tick,
    ended: null,
    cause: "alive",
  });
  return cell;
}
function inherited(world: World, parent: Cell): number {
  const record = world.genomes.get(parent.genome)!;
  if (world.config.mutationRate === 0) return parent.genome;
  const genome = controller.mutate(
    record.genome,
    world.geneticRng,
    world.config.mutationRate,
    world.config.mutationScale
  );
  if (controller.genomeDistance(record.genome, genome) === 0) return parent.genome;
  const id = world.nextGenome++;
  world.genomes.set(id, { id, parent: parent.genome, born: world.tick, genome });
  world.ledger.mutations++;
  return id;
}
function placement(world: World, parent: Cell, index: SpatialIndex): Point[] | null {
  const c = world.config,
    offset = radius(c.birthMass, c) * 1.001;
  const phase = nextRandom(world.rng) * 2 * Math.PI;
  for (let attempt = 0; attempt < 8; attempt++) {
    const angle = phase + (attempt * Math.PI) / 4;
    const points = [moved(parent, angle, offset, c), moved(parent, angle, -offset, c)];
    if (points.every((p) => index.free(p, c.birthMass, parent.id))) return points;
  }
  return null;
}
function die(world: World, cell: Cell): void {
  world.ledger.deaths++;
  world.ledger.deathLoss += cell.mass + cell.energy;
  Object.assign(world.ancestry.get(cell.id)!, { ended: world.tick, cause: "starvation" });
  recordEvent(world, "death", cell.id, []);
}
export function reproduce(world: World): void {
  const c = world.config,
    live = removeDead(world);
  const index = new SpatialIndex(c, live),
    result: Cell[] = [];
  let population = live.length;
  for (const cell of live) {
    if (
      cell.mass < 2 * c.birthMass - 1e-10 ||
      cell.energy < 2 * c.daughterReserve + c.divisionCost
    ) {
      result.push(cell);
      continue;
    }
    if (population >= c.maxPopulation) {
      world.stopReason = "Population safety limit reached";
      result.push(cell);
      continue;
    }
    const points = placement(world, cell, index);
    if (!points) {
      world.ledger.blockedDivisions++;
      result.push(cell);
      continue;
    }
    result.push(...divide(world, cell, points, index));
    population++;
  }
  world.cells = result;
  if (!result.length) world.stopReason = "Population extinct";
}
function removeDead(world: World): Cell[] {
  return world.cells.filter((cell) => {
    if (cell.energy > 1e-12) return true;
    die(world, cell);
    return false;
  });
}
function divide(world: World, cell: Cell, points: Point[], index: SpatialIndex): Cell[] {
  index.remove(cell);
  const daughters = points.map((p) =>
    makeCell(world, p, cell, inherited(world, cell), (cell.energy - world.config.divisionCost) / 2)
  );
  for (const daughter of daughters) index.add(daughter);
  world.ledger.births += 2;
  world.ledger.divisions++;
  world.ledger.division += world.config.divisionCost;
  Object.assign(world.ancestry.get(cell.id)!, { ended: world.tick, cause: "division" });
  recordEvent(
    world,
    "division",
    cell.id,
    daughters.map((d) => d.id)
  );
  return daughters;
}

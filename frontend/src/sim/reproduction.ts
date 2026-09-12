import { type World, type Cell, type Point } from "./types";
import { controller } from "./controller";
import { emptyAction, INPUTS } from "./interface";
import { initializeReceptors } from "./sensors";
import { nextRandom } from "./random";
import { SpatialIndex } from "./spatial";
import { recordEvent } from "./events";
import { inherit, sameGenotype } from "./genetics/genotype";
import { reproductivePolicies } from "./reproductivePolicies";
import { type Embodied, scaleBody, structuralMass } from "./body";
import { blueprint, divisionReady } from "./phenotype";
import { deposit } from "./fields";
import { flow, life } from "./observation";

export function makeCell(
  world: World,
  position: Point,
  parent: Cell | null,
  genome: number,
  stocks?: Embodied
): Cell {
  const id = world.nextCell++;
  const cell: Cell = {
    ...position,
    id,
    parent: parent?.id ?? null,
    lineage: parent?.lineage ?? id,
    generation: parent ? parent.generation + 1 : 0,
    genome,
    damage: parent?.damage ?? 0,
    heading: nextRandom(world.rng) * 2 * Math.PI,
    ...(stocks ?? {
      body: { ...blueprint(world.genomes.get(genome)!.genome, world.config) },
      reserve: world.config.founderReserve,
      energy: world.config.founderEnergy,
    }),
    born: world.tick,
    brain: controller.createState(),
    receptors: [0, 0, 0, 0],
    contacts: [0, 0, 0, 0],
    inputs: new Float32Array(INPUTS),
    action: emptyAction(),
  };
  initializeReceptors(world, cell);
  life(world, cell, "birth");
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
  const { genome, mutated, recombined, learned } = inherit(
    record.genome,
    world.geneticRng,
    world.config,
    parent.brain
  );
  if (mutated) world.ledger.mutations++;
  if (recombined) world.ledger.recombinations++;
  if (learned > 0) world.ledger.learnedBirths++;
  if (sameGenotype(record.genome, genome)) return parent.genome;
  const id = world.nextGenome++;
  world.genomes.set(id, { id, parent: parent.genome, born: world.tick, genome, learned });
  return id;
}
function die(world: World, cell: Cell): void {
  world.ledger.deaths++;
  const material = structuralMass(cell.body) + cell.reserve;
  world.ledger.deathMaterial += material;
  world.ledger.deathLoss += cell.energy;
  deposit(world.detritus, cell, material, world.config);
  const cause = cell.damage >= 1 ? "damage" : "starvation";
  if (cause === "damage") world.ledger.damageDeaths++;
  life(world, cell, cause);
  Object.assign(world.ancestry.get(cell.id)!, { ended: world.tick, cause });
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
      !divisionReady(world, cell) ||
      cell.reserve < 2 * c.daughterReserve ||
      cell.energy < 2 * c.daughterEnergy + c.divisionCost
    ) {
      result.push(cell);
      continue;
    }
    if (population >= c.maxPopulation) {
      world.stopReason = "Population safety limit reached";
      result.push(cell);
      continue;
    }
    const points = reproductivePolicies[c.reproduction].place(world, cell, index);
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
  pruneGenomes(world);
}
/**
 * Genotype records are retained while a living cell carries them, plus every founder record.
 * Dead organisms keep their genome id in ancestry as provenance only. Pruning runs when records
 * exceed four times the population plus a margin, so it is deterministic and amortized.
 */
export function pruneGenomes(world: World): void {
  if (world.genomes.size <= 4 * world.cells.length + 256) return;
  const live = new Set<number>();
  for (const cell of world.cells) live.add(cell.genome);
  for (const [id, record] of world.genomes)
    if (record.parent !== null && !live.has(id)) world.genomes.delete(id);
}
function removeDead(world: World): Cell[] {
  return world.cells.filter((cell) => {
    if (cell.energy > 1e-12 && cell.damage < 1) return true;
    die(world, cell);
    return false;
  });
}
function divide(world: World, cell: Cell, points: Point[], index: SpatialIndex): Cell[] {
  index.remove(cell);
  const survives = reproductivePolicies[world.config.reproduction].parentSurvives;
  const energy = (cell.energy - world.config.divisionCost) / 2;
  const daughters = (survives ? points.slice(1) : points).map((p) =>
    makeCell(world, p, cell, inherited(world, cell), {
      body: scaleBody(cell.body, 0.5),
      reserve: cell.reserve / 2,
      energy,
    })
  );
  world.ledger.births += daughters.length;
  if (survives) {
    cell.body = scaleBody(cell.body, 0.5);
    cell.reserve /= 2;
    cell.energy = energy;
    daughters.unshift(cell);
  } else Object.assign(world.ancestry.get(cell.id)!, { ended: world.tick, cause: "division" });
  for (const daughter of daughters) index.add(daughter);
  world.ledger.divisions++;
  world.ledger.division += world.config.divisionCost;
  flow(world, cell, "division", world.config.divisionCost);
  life(world, cell, "division");
  recordEvent(
    world,
    "division",
    cell.id,
    daughters.filter((d) => d.id !== cell.id).map((d) => d.id)
  );
  return daughters;
}

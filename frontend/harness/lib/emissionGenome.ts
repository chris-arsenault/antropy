import { type Engine } from "../../src/engine/client";
import { type Genotype } from "../../src/engine/types";
import { coordinate, type ChemicalContext } from "./chemicalGenotypes";
import { behaviorChange } from "./engineFixtures";

/** Synthesis competes with nutrition for substrate and funded enzyme capacity. */
export function emissionGenome(
  engine: Engine,
  context: ChemicalContext,
  species: number,
  effort: number,
  investment = 1
): Genotype {
  const g = behaviorChange(engine, context.genotype, { transport: [1, 1, effort, 1] });
  const from = coordinate(context.config.sourceSpecies[0]),
    to = coordinate(species);
  for (const c of g.chromosomes) {
    c.physical[9] = investment - 1;
    c.physical[11] = investment - 1;
    c.chemistry.membrane = to;
    c.chemistry.transporters[2] = { ...to, export: true };
    c.chemistry.enzymes[0] = { ...from, dx: to.x - from.x, dy: to.y - from.y };
  }
  return g;
}

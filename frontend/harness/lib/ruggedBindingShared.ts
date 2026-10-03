import { type EngineWorld } from "../../src/engine/client";
import { type Genotype } from "../../src/engine/types";
import { LABELS } from "./ruggedBindingFixture";
import {
  type BindingCase,
  type BindingRun,
  measuredCase,
  reciprocalSquare,
} from "./ruggedBindingReport";

export function sharedGenotypes(world: EngineWorld) {
  const cells = world.command<{ cells: { genome: number }[] }>("frame").cells;
  return [...new Set(cells.map((c) => c.genome))].map((id) => {
    const genotype = world.command<Genotype>("genotype", { id });
    const key = genotype.chromosomes[0].chemistry.keys!.transporters[0];
    const variant = Number(key.weights[0] === 1) + 2 * Number(key.weights[4] === 1);
    return { label: LABELS[variant], genotype };
  });
}

export function sharedReport(
  result: BindingRun,
  frames: BindingCase["frames"],
  genotypes: ReturnType<typeof sharedGenotypes>
) {
  const labels = new Map(genotypes.map((g) => [g.genotype.id, g.label]));
  const totalMass = result.groups.reduce((sum, g) => sum + g.livingBiomass, 0);
  const totalPopulation = result.groups.reduce((sum, g) => sum + g.living, 0);
  const initialMass = result.groups.reduce((sum, g) => sum + g.initialBiomass, 0);
  const initialPopulation = result.groups.reduce((sum, g) => sum + g.initialCells, 0);
  const groups = result.groups.map((g) => {
    const label = labels.get(g.genome);
    if (!label) throw new Error("Shared founder label is missing");
    const measured = measuredCase({
      label,
      lambda: 3,
      empty: false,
      result: { ...result, groups: [g] },
      frames: frames.map((f) => ({ ...f, cells: f.cells.filter((c) => c.group === g.genome) })),
    });
    return {
      ...measured,
      initialBiomassShare: g.initialBiomass / initialMass,
      initialPopulationShare: g.initialCells / initialPopulation,
      biomassShare: totalMass > 0 ? g.livingBiomass / totalMass : null,
      populationShare: totalPopulation > 0 ? g.living / totalPopulation : null,
    };
  });
  return {
    groups,
    square: reciprocalSquare(groups),
    totalMass,
    totalPopulation,
    matchedTimes: [100, 200, 300, 1000].map((tick) => {
      const frame = frames.find((f) => f.tick === tick);
      return {
        tick,
        groups: frame
          ? groups.map((g) => {
              const cells = frame.cells.filter((c) => c.group === g.genome);
              const mass = cells.reduce((sum, c) => sum + c.boundBiomass, 0);
              return {
                label: g.label,
                population: cells.length,
                mass,
                return: (mass - g.initialBiomass) / g.initialBiomass,
              };
            })
          : null,
      };
    }),
  };
}

import { type World } from "./types";
import { balance, materialBalance, total } from "./accounting";
import { structuralMass } from "./body";
import { evolutionStats } from "./evolutionStats";

export function summary(world: World) {
  const lineages = new Map<number, number>(),
    genomes = new Map<number, number>();
  const tasks = new Map<number, number>();
  for (const cell of world.cells) {
    lineages.set(cell.lineage, (lineages.get(cell.lineage) ?? 0) + 1);
    genomes.set(cell.genome, (genomes.get(cell.genome) ?? 0) + 1);
    tasks.set(cell.brain.task, (tasks.get(cell.brain.task) ?? 0) + 1);
  }
  return {
    tick: world.tick,
    time: world.tick * world.config.dt,
    population: world.cells.length,
    interventions: world.interventions.length,
    ...world.ledger,
    nutrient: total(world.nutrient),
    chemical: total(world.chemical),
    reserves: world.cells.reduce((s, c) => s + c.energy, 0),
    storedNutrient: world.cells.reduce((s, c) => s + c.reserve, 0),
    biomass: world.cells.reduce((s, c) => s + structuralMass(c.body), 0),
    maxGeneration: world.cells.reduce((m, c) => Math.max(m, c.generation), 0),
    livingGenomes: genomes.size,
    evolution: evolutionStats(world),
    energyResidual: balance(world),
    materialResidual: materialBalance(world),
    chemicalResidual: world.ledger.emitted - world.ledger.chemicalLoss - total(world.chemical),
    lineages: [...lineages].sort((a, b) => b[1] - a[1]),
    genomes: [...genomes].sort((a, b) => b[1] - a[1]),
    tasks: [...tasks].sort((a, b) => b[1] - a[1]),
    stopReason: world.stopReason,
  };
}

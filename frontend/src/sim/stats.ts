import { type World } from "./types";
import { balance, materialBalance, total } from "./accounting";
import { structuralMass } from "./body";
import { evolutionStats } from "./evolutionStats";
import { inheritedStats, lineageCounts } from "./inheritedStats";
import { ecologyStats } from "./ecologyStats";
import { budgetStats, percent } from "./budgetStats";

export function summary(world: World) {
  const genomes = new Map<number, number>();
  const tasks = new Map<number, number>();
  for (const cell of world.cells) {
    genomes.set(cell.genome, (genomes.get(cell.genome) ?? 0) + 1);
    tasks.set(cell.brain.task, (tasks.get(cell.brain.task) ?? 0) + 1);
  }
  const inherited = inheritedStats(world);
  const energyResidual = balance(world),
    materialResidual = materialBalance(world);
  return {
    tick: world.tick,
    time: world.tick * world.config.dt,
    population: world.cells.length,
    interventions: world.interventions.length,
    ...world.ledger,
    ...ecologyStats(world),
    ...budgetStats(world.ledger),
    nutrient: total(world.nutrient),
    nutrientB: total(world.nutrientB),
    toxin: total(world.toxin),
    matrix: total(world.matrix),
    boundToxin: total(world.boundToxin),
    detritus: total(world.detritus),
    carbon: total(world.carbon),
    oxygen: total(world.oxygen),
    depositMaterial: world.sources.reduce((s, p) => s + p.foodA + p.foodB, 0),
    meanDamage:
      world.cells.reduce((s, cell) => s + cell.damage, 0) / Math.max(1, world.cells.length),
    activeDeposits: world.sources.filter((p) => p.remaining > 0).length,
    chemical: total(world.chemical),
    reserves: world.cells.reduce((s, c) => s + c.energy, 0),
    storedNutrient: world.cells.reduce((s, c) => s + c.reserve, 0),
    biomass: world.cells.reduce((s, c) => s + structuralMass(c.body), 0),
    maxGeneration: world.cells.reduce((m, c) => Math.max(m, c.generation), 0),
    livingGenomes: inherited.uniqueSequences,
    livingGenomeRecords: genomes.size,
    inherited,
    evolution: evolutionStats(world),
    energyResidual,
    materialResidual,
    energyResidualPercent: percent(
      energyResidual,
      world.ledger.initial + world.ledger.supplied * world.config.nutrientEnergy
    ),
    materialResidualPercent: percent(
      materialResidual,
      world.ledger.initialMaterial + world.ledger.supplied
    ),
    chemicalResidual: world.ledger.emitted - world.ledger.chemicalLoss - total(world.chemical),
    lineages: lineageCounts(world),
    genomes: [...genomes].sort((a, b) => b[1] - a[1]),
    tasks: [...tasks].sort((a, b) => b[1] - a[1]),
    stopReason: world.stopReason,
  };
}

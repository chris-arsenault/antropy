import { computeEvolutionStats } from "../../src/sim/evolutionStats";
import { type World } from "../../src/sim/world";
import { type EvolutionSample } from "./ledger";

/** Flatten live genetic instruments into the durable harness schema. */
export function sampleEvolution(world: World, phase = "run"): EvolutionSample {
  const stats = computeEvolutionStats(world);
  return {
    tick: world.tick,
    phase,
    deliveryHeritability: stats.deliveryHeritability.value,
    deliverySamples: stats.deliveryHeritability.samples,
    lifespanHeritability: stats.lifespanHeritability.value,
    lifespanSamples: stats.lifespanHeritability.samples,
    effectivePopulation: stats.effectivePopulation.value,
    effectivePopulationSamples: stats.effectivePopulation.samples,
    census: stats.effectivePopulation.census,
    reproductiveEvents: stats.effectivePopulation.reproductiveEvents,
    genomeDiversity: stats.pairwiseGenomeDistance.value,
    genomePairs: stats.pairwiseGenomeDistance.samples,
    founderDistanceMean: stats.founderGenomeDistance.value,
    founderDistanceMax: stats.founderGenomeDistance.max,
    founderDistanceSamples: stats.founderGenomeDistance.samples,
    founderLinesTotal: stats.founderLines.totalLines,
    founderLinesRepresented: stats.founderLines.representedLines,
    founderLinesContributing: stats.founderLines.contributingLines,
    maxFounderLineShare: stats.founderLines.maxLivingShare,
    founderLinesJson: JSON.stringify(stats.founderLines.lines),
  };
}

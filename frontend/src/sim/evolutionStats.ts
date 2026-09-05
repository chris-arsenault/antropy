import { SEX_MALE } from "./ant";
import { GENETIC_ROLE_EGG, type GeneticRecord } from "./ancestry";
import { type Genome } from "./controller/contract";
import { type World } from "./world";

export interface Estimate {
  value: number | null;
  samples: number;
}

export interface EffectivePopulationEstimate extends Estimate {
  census: number;
  reproductiveEvents: number;
}

export interface FounderLineResult {
  founderLineId: number;
  living: number;
  offspring: number;
}

export interface FounderLineHealth {
  totalLines: number;
  representedLines: number;
  extinctLines: number;
  contributingLines: number;
  maxLivingShare: number | null;
  lines: FounderLineResult[];
}

export interface EvolutionStats {
  deliveryHeritability: Estimate;
  lifespanHeritability: Estimate;
  effectivePopulation: EffectivePopulationEstimate;
  pairwiseGenomeDistance: Estimate;
  founderGenomeDistance: Estimate & { max: number | null };
  founderLines: FounderLineHealth;
}

interface LivingGenome {
  geneticId: number;
  founderLineId: number;
  genome: Genome;
}

type Outcome = "delivery" | "lifespan";

function completedOutcome(record: GeneticRecord | undefined, outcome: Outcome): number | null {
  if (!record?.observedFromBirth || record.deathTick < 0 || record.deathAge <= 0) return null;
  return outcome === "delivery" ? record.netEnergyDelivered / record.deathAge : record.deathAge;
}

function parentOutcome(world: World, child: GeneticRecord, outcome: Outcome): number | null {
  const mother = completedOutcome(world.geneticRecords.get(child.motherId), outcome);
  if (child.sex === SEX_MALE && child.fatherId === 0) return mother;
  const father = completedOutcome(world.geneticRecords.get(child.fatherId), outcome);
  if (mother === null || father === null) return null;
  return (mother + father) / 2;
}

function regression(xs: number[], ys: number[]): Estimate {
  const samples = xs.length;
  if (samples < 3) return { value: null, samples };
  const meanX = xs.reduce((sum, value) => sum + value, 0) / samples;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / samples;
  let covariance = 0;
  let variance = 0;
  for (let index = 0; index < samples; index++) {
    const dx = xs[index] - meanX;
    covariance += dx * (ys[index] - meanY);
    variance += dx * dx;
  }
  return { value: variance === 0 ? null : covariance / variance, samples };
}

function parentOffspringRegression(world: World, outcome: Outcome): Estimate {
  const parents: number[] = [];
  const offspring: number[] = [];
  for (const child of world.geneticRecords.values()) {
    if (child.role === GENETIC_ROLE_EGG) continue;
    const childValue = completedOutcome(child, outcome);
    if (childValue === null) continue;
    const parentValue = parentOutcome(world, child, outcome);
    if (parentValue === null) continue;
    parents.push(parentValue);
    offspring.push(childValue);
  }
  return regression(parents, offspring);
}

function addLiving(target: Map<number, LivingGenome>, carrier: LivingGenome): void {
  if (carrier.geneticId > 0 && !target.has(carrier.geneticId))
    target.set(carrier.geneticId, carrier);
}

function livingGenomes(world: World): LivingGenome[] {
  const living = new Map<number, LivingGenome>();
  for (const ant of world.ants) addLiving(living, ant);
  for (const egg of world.eggs) addLiving(living, egg);
  for (const colony of world.colonies) {
    addLiving(living, {
      geneticId: colony.queenGeneticId,
      founderLineId: world.geneticRecords.get(colony.queenGeneticId)?.founderLineId ?? 0,
      genome: colony.queenGenome,
    });
    for (const sperm of colony.sperm) addLiving(living, sperm);
  }
  return [...living.values()];
}

function offspringVariance(world: World, census: number): EffectivePopulationEstimate {
  const contributors = [...world.geneticRecords.values()].filter(
    (record) =>
      record.role !== GENETIC_ROLE_EGG && (record.deathTick >= 0 || record.offspringCount > 0)
  );
  const reproductiveEvents = contributors.reduce((sum, record) => sum + record.offspringCount, 0);
  const samples = contributors.length;
  if (samples < 3 || reproductiveEvents === 0) {
    return { value: null, samples, census, reproductiveEvents };
  }
  const mean = reproductiveEvents / samples;
  const variance =
    contributors.reduce((sum, record) => {
      const difference = record.offspringCount - mean;
      return sum + difference * difference;
    }, 0) / samples;
  return { value: (4 * samples) / (variance + 2), samples, census, reproductiveEvents };
}

function pairwiseDistance(world: World, living: LivingGenome[]): Estimate {
  let sum = 0;
  let samples = 0;
  for (let left = 0; left < living.length; left++) {
    for (let right = left + 1; right < living.length; right++) {
      sum += world.controller.genomeDistance(living[left].genome, living[right].genome);
      samples += 1;
    }
  }
  return { value: samples === 0 ? null : sum / samples, samples };
}

function founderDistance(world: World, living: LivingGenome[]): Estimate & { max: number | null } {
  if (world.founderGenomes.length === 0 || living.length === 0) {
    return { value: null, max: null, samples: 0 };
  }
  let sum = 0;
  let max = 0;
  for (const carrier of living) {
    let nearest = Number.POSITIVE_INFINITY;
    for (const founder of world.founderGenomes) {
      nearest = Math.min(nearest, world.controller.genomeDistance(carrier.genome, founder));
    }
    sum += nearest;
    max = Math.max(max, nearest);
  }
  return { value: sum / living.length, max, samples: living.length };
}

function founderLineHealth(world: World, living: LivingGenome[]): FounderLineHealth {
  const lines = new Map<number, FounderLineResult>();
  for (const record of world.geneticRecords.values()) {
    if (record.id === record.founderLineId) {
      lines.set(record.id, { founderLineId: record.id, living: 0, offspring: 0 });
    }
    const line = lines.get(record.founderLineId);
    if (line) line.offspring += record.offspringCount;
  }
  for (const carrier of living) {
    const line = lines.get(carrier.founderLineId);
    if (line) line.living += 1;
  }
  const results = [...lines.values()].sort((a, b) => a.founderLineId - b.founderLineId);
  const representedLines = results.filter((line) => line.living > 0).length;
  const totalLiving = results.reduce((sum, line) => sum + line.living, 0);
  const maxLiving = results.reduce((max, line) => Math.max(max, line.living), 0);
  return {
    totalLines: results.length,
    representedLines,
    extinctLines: results.length - representedLines,
    contributingLines: results.filter((line) => line.offspring > 0).length,
    maxLivingShare: totalLiving === 0 ? null : maxLiving / totalLiving,
    lines: results,
  };
}

/** Controller-agnostic genetic outcomes; unavailable estimates stay null. */
export function computeEvolutionStats(world: World): EvolutionStats {
  const living = livingGenomes(world);
  return {
    deliveryHeritability: parentOffspringRegression(world, "delivery"),
    lifespanHeritability: parentOffspringRegression(world, "lifespan"),
    effectivePopulation: offspringVariance(world, living.length),
    pairwiseGenomeDistance: pairwiseDistance(world, living),
    founderGenomeDistance: founderDistance(world, living),
    founderLines: founderLineHealth(world, living),
  };
}

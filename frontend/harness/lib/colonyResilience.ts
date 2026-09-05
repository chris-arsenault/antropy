import { SEX_FEMALE, SEX_MALE, type Ant } from "../../src/sim/ant";
import { type Colony } from "../../src/sim/colony";
import { type SimConfig } from "../../src/sim/config";
import { STAGE_EGG, STAGE_LARVA } from "../../src/sim/eggs";
import { killAnt, reapDead } from "../../src/sim/energy";
import { deserializeWorld, serializeWorld, type Checkpoint } from "../../src/persist/checkpoint";
import { COLONY, LARVA, MALE, QUEEN } from "../../src/sim/tunables";
import { stepWorld, type World } from "../../src/sim/world";
import {
  broodEnergy,
  prepareAuthoredNestEconomy,
  storedFoodEnergy,
  totalColonyEnergy,
} from "./authoredNestEconomy";
import { sampleEvolution } from "./evolution";
import { type DemographySample, type EvolutionSample } from "./ledger";

export type ResilienceShock = "control" | "workers" | "energy";

export interface ResilienceEpisodeJob {
  seed: number;
  warmupTicks: number;
  recoveryTicks: number;
  cadence: number;
  shock: ResilienceShock;
  shockFraction: number;
  config: SimConfig;
}

export interface ResilienceEpisodeResult {
  params: Record<string, unknown>;
  summary: Record<string, unknown>;
  demography: DemographySample[];
  evolution: EvolutionSample[];
}

export interface ResilienceBaseline {
  checkpoint: Checkpoint;
  demography: DemographySample[];
  evolution: EvolutionSample[];
}

interface InstrumentSeries {
  demography: DemographySample[];
  evolution: EvolutionSample[];
}

const RECOVERY_FRACTION = 0.9;

function meanEnergy(ants: readonly Ant[]): number {
  return ants.reduce((sum, ant) => sum + ant.energy, 0) / Math.max(1, ants.length);
}

function workerLifespan(ant: Ant): number {
  return ant.sex === SEX_MALE
    ? Math.round(ant.traits.lifespanTicks * MALE.lifespanFraction)
    : ant.traits.lifespanTicks;
}

function workers(world: World): Ant[] {
  return world.ants.filter((ant) => ant.sex === SEX_FEMALE);
}

function sample(world: World, colony: Colony, phase: DemographySample["phase"]): DemographySample {
  const workerAnts = workers(world);
  const energies = workerAnts.map((ant) => ant.energy);
  return {
    tick: world.tick,
    phase,
    workers: workerAnts.length,
    eggs: world.eggs.filter((egg) => egg.stage === STAGE_EGG).length,
    larvae: world.eggs.filter((egg) => egg.stage === STAGE_LARVA).length,
    workerEnergy: workerAnts.reduce((sum, ant) => sum + ant.energy, 0),
    broodEnergy: broodEnergy(world),
    stockpile: colony.stockpile,
    storedFoodEnergy: storedFoodEnergy(world),
    colonyEnergy: totalColonyEnergy(world, colony),
    meanWorkerEnergy: meanEnergy(workerAnts),
    minWorkerEnergy: energies.length === 0 ? 0 : Math.min(...energies),
    ageExpiredWorkers: workerAnts.filter((ant) => ant.age > workerLifespan(ant)).length,
    energyDepletedWorkers: workerAnts.filter((ant) => ant.energy <= 0).length,
    workerBirths: world.metrics.workerBirths,
    workerDeaths: world.metrics.workerDeaths,
    queenDeaths: world.metrics.queenDeaths,
    gatheredEnergy: world.metrics.surfaceFoodEnergyGathered,
    burnedEnergy: world.metrics.energyBurned,
  };
}

function shockRank(seed: number, antId: number): number {
  let value = (seed ^ Math.imul(antId, 0x9e3779b1)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  return Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
}

function applyWorkerShock(world: World, fraction: number): number {
  const ordered = workers(world).sort(
    (left, right) => shockRank(world.seed, left.id) - shockRank(world.seed, right.id)
  );
  const removeCount = Math.round(ordered.length * fraction);
  for (const ant of ordered.slice(0, removeCount)) killAnt(world, ant);
  reapDead(world);
  return removeCount;
}

function applyShock(world: World, shock: ResilienceShock, fraction: number): number {
  if (shock === "workers") return applyWorkerShock(world, fraction);
  if (shock === "energy") {
    for (const ant of world.ants) ant.energy *= 1 - fraction;
  }
  return 0;
}

function recordAtCadence(
  world: World,
  colony: Colony,
  cadence: number,
  phase: DemographySample["phase"],
  target: InstrumentSeries
): void {
  if (world.tick % cadence === 0) {
    target.demography.push(sample(world, colony, phase));
    target.evolution.push(sampleEvolution(world, phase));
  }
}

function runTicks(
  world: World,
  colony: Colony,
  ticks: number,
  cadence: number,
  phase: "warmup" | "recovery",
  target: InstrumentSeries,
  onTick?: () => void
): void {
  for (let elapsed = 0; elapsed < ticks; elapsed++) {
    stepWorld(world);
    onTick?.();
    recordAtCadence(world, colony, cadence, phase, target);
  }
}

function capitalTerms(world: World, colony: Colony): Record<string, number> {
  const traits = world.ants[0]?.traits ?? world.controller.physical(colony.queenGenome);
  const directWorkerCost = traits.eggEndowment + COLONY.eggLayCost;
  return {
    eggEndowment: traits.eggEndowment,
    directWorkerCost,
    rearedWorkerCost: directWorkerCost + LARVA.rearingCost,
    queenUpkeepPerEggInterval: QUEEN.upkeepPerTick * COLONY.eggIntervalMin,
    workerLifespanTicks: traits.lifespanTicks,
    incubationTicks: COLONY.incubationTicks,
    rearingTicks: Math.ceil(LARVA.rearingCost / LARVA.feedPerTick),
  };
}

interface RecoveryResult {
  workerTarget: number;
  energyTarget: number;
  workerRecoveryTicks: number | null;
  energyRecoveryTicks: number | null;
}

function runRecovery(
  world: World,
  colony: Colony,
  job: ResilienceEpisodeJob,
  target: InstrumentSeries,
  preWorkers: number,
  preMeanEnergy: number
): RecoveryResult {
  const workerTarget = Math.ceil(preWorkers * RECOVERY_FRACTION);
  const energyTarget = preMeanEnergy * RECOVERY_FRACTION;
  let workerRecoveryTicks: number | null = workers(world).length >= workerTarget ? 0 : null;
  let energyRecoveryTicks: number | null = meanEnergy(workers(world)) >= energyTarget ? 0 : null;
  const markRecovery = (): void => {
    const elapsed = world.tick - job.warmupTicks;
    if (workerRecoveryTicks === null && workers(world).length >= workerTarget)
      workerRecoveryTicks = elapsed;
    if (energyRecoveryTicks === null && meanEnergy(workers(world)) >= energyTarget) {
      energyRecoveryTicks = elapsed;
    }
  };
  runTicks(world, colony, job.recoveryTicks, job.cadence, "recovery", target, markRecovery);
  return { workerTarget, energyTarget, workerRecoveryTicks, energyRecoveryTicks };
}

function episodeParams(job: ResilienceEpisodeJob): Record<string, unknown> {
  return {
    shock: job.shock,
    shockFraction: job.shockFraction,
    warmupTicks: job.warmupTicks,
    recoveryTicks: job.recoveryTicks,
    recoveryFraction: RECOVERY_FRACTION,
    config: job.config,
  };
}

function primaryRecovery(shock: ResilienceShock, recovery: RecoveryResult): number | null {
  return shock === "workers" ? recovery.workerRecoveryTicks : recovery.energyRecoveryTicks;
}

function deathTerms(world: World, deathsAfterShock: number): Record<string, number> {
  return {
    naturalWorkerDeaths: world.metrics.workerDeaths - deathsAfterShock,
    workerAgeDeaths: world.metrics.workerAgeDeaths,
    workerEnergyDeaths: world.metrics.workerEnergyDeaths,
    maleAgeDeaths: world.metrics.maleAgeDeaths,
    maleEnergyDeaths: world.metrics.maleEnergyDeaths,
    workerBirths: world.metrics.workerBirths,
    workerDeaths: world.metrics.workerDeaths,
    maleDeaths: world.metrics.maleDeaths,
    queenDeaths: world.metrics.queenDeaths,
    queenAgeDeaths: world.metrics.queenAgeDeaths,
    queenStarvationDeaths: world.metrics.queenStarvationDeaths,
  };
}

function replacementTerms(world: World): Record<string, number> {
  return {
    eggsLaid: world.eggsLaid,
    eggsPerished: world.eggsPerished,
    workerBirths: world.metrics.workerBirths,
    maleBirths: world.metrics.maleBirths,
    eggEnergyInvested: world.metrics.eggEnergyInvested,
    larvalEnergyInvested: world.metrics.larvalEnergyInvested,
    metamorphosisEnergyBurned: world.metrics.metamorphosisEnergyBurned,
  };
}

interface EnergyFlow {
  gathered: number;
  recycled: number;
  burned: number;
  workerRemoved: number;
  maleRemoved: number;
  broodRemoved: number;
}

function energyFlow(world: World): EnergyFlow {
  return {
    gathered: world.metrics.surfaceFoodEnergyGathered,
    recycled: world.metrics.recycledFoodEnergyRecovered,
    burned: world.metrics.energyBurned,
    workerRemoved: world.metrics.workerEnergyRemovedAtDeath,
    maleRemoved: world.metrics.maleEnergyRemovedAtDeath,
    broodRemoved: world.metrics.broodEnergyRemovedAtDeath,
  };
}

function flowSince(world: World, before: EnergyFlow): EnergyFlow {
  const after = energyFlow(world);
  return Object.fromEntries(
    Object.entries(after).map(([key, value]) => [key, value - before[key as keyof EnergyFlow]])
  ) as unknown as EnergyFlow;
}

function netFlow(flow: EnergyFlow): number {
  return (
    flow.gathered +
    flow.recycled -
    flow.burned -
    flow.workerRemoved -
    flow.maleRemoved -
    flow.broodRemoved
  );
}

interface LifecycleTotals {
  workerBirths: number;
  maleBirths: number;
  workerDeaths: number;
  maleDeaths: number;
  eggsLaid: number;
  eggsPerished: number;
}

function lifecycleTotals(world: World): LifecycleTotals {
  return {
    workerBirths: world.metrics.workerBirths,
    maleBirths: world.metrics.maleBirths,
    workerDeaths: world.metrics.workerDeaths,
    maleDeaths: world.metrics.maleDeaths,
    eggsLaid: world.eggsLaid,
    eggsPerished: world.eggsPerished,
  };
}

function postShockLifecycle(world: World, before: LifecycleTotals): Record<string, number> {
  const after = lifecycleTotals(world);
  return {
    postShockWorkerBirths: after.workerBirths - before.workerBirths,
    postShockMaleBirths: after.maleBirths - before.maleBirths,
    postShockWorkerDeaths: after.workerDeaths - before.workerDeaths,
    postShockMaleDeaths: after.maleDeaths - before.maleDeaths,
    postShockEggsLaid: after.eggsLaid - before.eggsLaid,
    postShockEggsPerished: after.eggsPerished - before.eggsPerished,
  };
}

function recoveryPopulationRange(samples: DemographySample[]): Record<string, number> {
  const counts = samples
    .filter((entry) => entry.phase === "recovery")
    .map((entry) => entry.workers);
  return {
    recoveryMinWorkers: counts.length === 0 ? 0 : Math.min(...counts),
    recoveryMaxWorkers: counts.length === 0 ? 0 : Math.max(...counts),
  };
}

/** Prepare one warmed state that every treatment for a world seed shares. */
export function prepareResilienceBaseline(job: ResilienceEpisodeJob): ResilienceBaseline {
  const { world, colony } = prepareAuthoredNestEconomy(job.seed, job.config);
  const target: InstrumentSeries = {
    demography: [sample(world, colony, "warmup")],
    evolution: [sampleEvolution(world, "warmup")],
  };
  runTicks(world, colony, job.warmupTicks, job.cadence, "warmup", target);
  return { checkpoint: serializeWorld(world), ...target };
}

function copySeries(baseline: ResilienceBaseline): InstrumentSeries {
  return {
    demography: baseline.demography.map((entry) => ({ ...entry })),
    evolution: baseline.evolution.map((entry) => ({ ...entry })),
  };
}

/** Apply one deterministic perturbation to a prepared authored-nest baseline. */
export function runResilienceTreatment(
  baseline: ResilienceBaseline,
  job: ResilienceEpisodeJob
): ResilienceEpisodeResult {
  const world = deserializeWorld(baseline.checkpoint);
  const colony = world.colonies[0];
  if (!colony) throw new Error("resilience baseline has no colony");
  const target = copySeries(baseline);

  const preWorkers = workers(world).length;
  const preMeanEnergy = meanEnergy(workers(world));
  const preColonyEnergy = totalColonyEnergy(world, colony);
  const shockDeathsBefore = world.metrics.workerDeaths;
  const removedWorkers = applyShock(world, job.shock, job.shockFraction);
  const shockWorkerDeaths = world.metrics.workerDeaths - shockDeathsBefore;
  const deathsAfterShock = world.metrics.workerDeaths;
  const flowAtShock = energyFlow(world);
  const lifecycleAtShock = lifecycleTotals(world);
  const postColonyEnergy = totalColonyEnergy(world, colony);
  const postMeanEnergy = meanEnergy(workers(world));
  target.demography.push(sample(world, colony, "post-shock"));
  target.evolution.push(sampleEvolution(world, "post-shock"));
  const recovery = runRecovery(world, colony, job, target, preWorkers, preMeanEnergy);

  const finalColonyEnergy = totalColonyEnergy(world, colony);
  const postFlow = flowSince(world, flowAtShock);
  const accountedPostShockBalance = netFlow(postFlow);
  const recoveredAt = primaryRecovery(job.shock, recovery);
  return {
    params: episodeParams(job),
    summary: {
      recovered: recoveredAt !== null,
      recoveryTicks: recoveredAt,
      preWorkers,
      postWorkers: preWorkers - removedWorkers,
      finalWorkers: workers(world).length,
      finalMales: world.ants.length - workers(world).length,
      workerTarget: recovery.workerTarget,
      workerRecoveryTicks: recovery.workerRecoveryTicks,
      preMeanWorkerEnergy: preMeanEnergy,
      postMeanWorkerEnergy: postMeanEnergy,
      finalMeanWorkerEnergy: meanEnergy(workers(world)),
      energyTarget: recovery.energyTarget,
      energyRecoveryTicks: recovery.energyRecoveryTicks,
      preColonyEnergy,
      postColonyEnergy,
      finalColonyEnergy,
      shockEnergyRemoved: preColonyEnergy - postColonyEnergy,
      postShockBalance: finalColonyEnergy - postColonyEnergy,
      postShockGathered: postFlow.gathered,
      postShockRecycled: postFlow.recycled,
      postShockBurned: postFlow.burned,
      postShockWorkerEnergyRemoved: postFlow.workerRemoved,
      postShockMaleEnergyRemoved: postFlow.maleRemoved,
      postShockBroodEnergyRemoved: postFlow.broodRemoved,
      postShockConservationResidual:
        finalColonyEnergy - postColonyEnergy - accountedPostShockBalance,
      shockWorkerDeaths,
      ...deathTerms(world, deathsAfterShock),
      ...replacementTerms(world),
      ...postShockLifecycle(world, lifecycleAtShock),
      ...recoveryPopulationRange(target.demography),
      queenAlive: world.colonies.some((candidate) => candidate.id === colony.id),
      continuations: world.continuations,
      finalEggs: world.eggs.length,
      capital: capitalTerms(world, colony),
    },
    ...target,
  };
}

/** Convenience entry point for an isolated treatment process. */
export function runResilienceEpisode(job: ResilienceEpisodeJob): ResilienceEpisodeResult {
  return runResilienceTreatment(prepareResilienceBaseline(job), job);
}

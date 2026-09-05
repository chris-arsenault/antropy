import { SEX_FEMALE, SEX_MALE, type Ant } from "./ant";
import { type Genome, type PhysicalTraits } from "./controller/contract";
import { type Egg } from "./eggs";
import { type World } from "./world";

export const GENETIC_ROLE_EGG = 0;
export const GENETIC_ROLE_WORKER = 1;
export const GENETIC_ROLE_MALE = 2;
export const GENETIC_ROLE_QUEEN = 3;
export const GENETIC_ROLE_SIRE = 4;

export type GeneticRole =
  | typeof GENETIC_ROLE_EGG
  | typeof GENETIC_ROLE_WORKER
  | typeof GENETIC_ROLE_MALE
  | typeof GENETIC_ROLE_QUEEN
  | typeof GENETIC_ROLE_SIRE;

/** Durable individual outcome used only for observation, never selection resolution. */
export interface GeneticRecord {
  id: number;
  motherId: number;
  fatherId: number;
  founderLineId: number;
  colonyId: number;
  patrilineId: number;
  sex: number;
  role: GeneticRole;
  birthTick: number;
  deathTick: number;
  deathAge: number;
  observedFromBirth: boolean;
  offspringCount: number;
  netEnergyDelivered: number;
  traits: PhysicalTraits;
}

export interface GeneticIdentity {
  geneticId: number;
  founderLineId: number;
}

function nextIdentity(world: World): number {
  const id = world.nextGeneticId;
  world.nextGeneticId += 1;
  return id;
}

function recordParentContribution(world: World, parentId: number): void {
  if (parentId === 0) return;
  const parent = world.geneticRecords.get(parentId);
  if (parent) parent.offspringCount += 1;
}

function addRecord(
  world: World,
  identity: GeneticIdentity,
  genome: Genome,
  values: Omit<GeneticRecord, "id" | "founderLineId" | "traits" | "offspringCount">
): GeneticRecord {
  const record: GeneticRecord = {
    id: identity.geneticId,
    founderLineId: identity.founderLineId,
    traits: world.controller.physical(genome),
    offspringCount: 0,
    ...values,
  };
  world.geneticRecords.set(record.id, record);
  recordParentContribution(world, record.motherId);
  recordParentContribution(world, record.fatherId);
  return record;
}

/** Create a genome-bearing founder with no claimed parentage. */
export function registerFounder(
  world: World,
  genome: Genome,
  role: typeof GENETIC_ROLE_QUEEN | typeof GENETIC_ROLE_SIRE,
  sex: number,
  retainReference = false
): GeneticIdentity {
  if (retainReference) world.founderGenomes.push(genome);
  const geneticId = nextIdentity(world);
  const identity = { geneticId, founderLineId: geneticId };
  addRecord(world, identity, genome, {
    motherId: 0,
    fatherId: 0,
    colonyId: 0,
    patrilineId: 0,
    sex,
    role,
    birthTick: world.tick,
    deathTick: -1,
    deathAge: -1,
    observedFromBirth: false,
    netEnergyDelivered: 0,
  });
  return identity;
}

/** Allocate one child identity; registration occurs when its egg or adult enters the world. */
export function offspringIdentity(world: World, founderLineId: number): GeneticIdentity {
  return { geneticId: nextIdentity(world), founderLineId };
}

/** Register an egg and its contribution to each known parent's offspring count. */
export function registerEgg(world: World, egg: Egg): void {
  if (!Number.isSafeInteger(egg.geneticId) || egg.geneticId <= 0) {
    const identity = offspringIdentity(
      world,
      Number.isSafeInteger(egg.founderLineId) ? egg.founderLineId : 0
    );
    egg.geneticId = identity.geneticId;
    egg.founderLineId = identity.founderLineId || identity.geneticId;
  }
  if (world.geneticRecords.has(egg.geneticId)) return;
  addRecord(world, { geneticId: egg.geneticId, founderLineId: egg.founderLineId }, egg.genome, {
    motherId: egg.motherId,
    fatherId: egg.fatherId,
    colonyId: egg.lineageId,
    patrilineId: egg.patrilineId,
    sex: egg.sex,
    role: GENETIC_ROLE_EGG,
    birthTick: world.tick,
    deathTick: -1,
    deathAge: -1,
    observedFromBirth: true,
    netEnergyDelivered: 0,
  });
}

function adultRole(sex: number): GeneticRole {
  return sex === SEX_MALE ? GENETIC_ROLE_MALE : GENETIC_ROLE_WORKER;
}

/** Attach an identity to an adult, preserving an egg record when this is a hatch. */
export function registerAdult(
  world: World,
  ant: Ant,
  identity: GeneticIdentity | null,
  observedFromBirth: boolean
): void {
  const knownParent =
    world.geneticRecords.get(ant.fatherId) ?? world.geneticRecords.get(ant.motherId);
  const actual = identity ?? offspringIdentity(world, knownParent?.founderLineId ?? 0);
  ant.geneticId = actual.geneticId;
  ant.founderLineId = actual.founderLineId === 0 ? actual.geneticId : actual.founderLineId;
  const existing = world.geneticRecords.get(ant.geneticId);
  if (existing) {
    existing.role = adultRole(ant.sex);
    existing.colonyId = ant.lineageId;
    existing.patrilineId = ant.patrilineId;
    return;
  }
  addRecord(world, { geneticId: ant.geneticId, founderLineId: ant.founderLineId }, ant.genome, {
    motherId: ant.motherId,
    fatherId: ant.fatherId,
    colonyId: ant.lineageId,
    patrilineId: ant.patrilineId,
    sex: ant.sex,
    role: adultRole(ant.sex),
    birthTick: world.tick - ant.age,
    deathTick: -1,
    deathAge: -1,
    observedFromBirth,
    netEnergyDelivered: ant.netEnergyDelivered,
  });
}

export function recordNetEnergyDelivery(world: World, ant: Ant, amount: number): void {
  const record = world.geneticRecords.get(ant.geneticId);
  if (record) record.netEnergyDelivered += amount;
}

export function recordGeneticDeath(world: World, geneticId: number, age: number): void {
  const record = world.geneticRecords.get(geneticId);
  if (!record || record.deathTick >= 0) return;
  record.deathTick = world.tick;
  record.deathAge = age;
}

export function recordAntDeath(world: World, ant: Ant): void {
  recordGeneticDeath(world, ant.geneticId, ant.age);
}

export function recordQueenRole(world: World, geneticId: number, colonyId: number): void {
  const record = world.geneticRecords.get(geneticId);
  if (!record) return;
  record.role = GENETIC_ROLE_QUEEN;
  record.colonyId = colonyId;
  record.sex = SEX_FEMALE;
}

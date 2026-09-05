import { SEX_FEMALE, SEX_MALE, surfaceSpawnY, type Ant } from "./ant";
import {
  offspringIdentity,
  recordGeneticDeath,
  recordQueenRole,
  type GeneticIdentity,
} from "./ancestry";
import { type Genome } from "./controller/contract";
import {
  continuationColonyGenetics,
  makeColonyOffspring,
  meritSperm,
  seedColonyGenetics,
  type Sperm,
} from "./colonyGenetics";
import { addEgg, findEggSpot, STAGE_EGG, type Egg } from "./eggs";
import { killAnt } from "./energy";
import { carveFoundingNest } from "./foundingNest";
import { sexualOffspring } from "./genetics";
import { restockFromLarder } from "./larder";
import { COLONY, QUEEN } from "./tunables";
import { spawnAnt, type World } from "./world";

export { type Sperm } from "./colonyGenetics";

/**
 * A colony is deliberately lightweight (design spec §7.2): a scripted queen
 * (egg factory), home position, stored sperm, and bookkeeping. The queen is
 * not a walking ant. The stockpile is the queen's larder: deliveries fill
 * it, upkeep and eggs drain it, and exhaustion starves her.
 */
export interface Colony {
  id: number;
  x: number;
  y: number;
  z: number;
  /** Surface opening that carries the colony's exterior homing scent. */
  entranceX: number;
  entranceY: number;
  entranceZ: number;
  queenGenome: Genome;
  queenGeneticId: number;
  queenAge: number;
  queenLifespanTicks: number;
  sperm: Sperm[];
  stockpile: number;
  /** Conservation-accounted net-new food energy per patriline. */
  patrilineMerit: Map<number, number>;
  nextPatrilineId: number;
  lastEggTick: number;
  lastQueenEggTick: number;
  /** Tick the stockpile hit empty, or -1 while provisioned (queen reserves). */
  starvingSince: number;
}

export interface ColonyPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Colony ids double as scent owner tags (Uint8), so they cycle in 1..250. */
function nextColonyId(world: World): number {
  const id = ((world.nextColonyId - 1) % 250) + 1;
  world.nextColonyId += 1;
  return id;
}

function createColonyAt(
  world: World,
  x: number,
  z: number,
  queenGenome: Genome,
  queenIdentity: GeneticIdentity,
  sperm: Sperm[]
): Colony | null {
  const surfaceY = surfaceSpawnY(world.grid, x, z);
  if (surfaceY === null) {
    return null;
  }
  const y = Math.max(3, surfaceY - COLONY.chamberDepth);
  carveFoundingNest(world, x, y, z, surfaceY);
  return createColonyRecord(world, { x, y, z }, queenGenome, queenIdentity, sperm, {
    x,
    y: surfaceY + 1,
    z,
  });
}

function createColonyRecord(
  world: World,
  position: ColonyPosition,
  queenGenome: Genome,
  queenIdentity: GeneticIdentity,
  sperm: Sperm[],
  entrance: ColonyPosition = position
): Colony {
  const colony: Colony = {
    id: nextColonyId(world),
    ...position,
    entranceX: entrance.x,
    entranceY: entrance.y,
    entranceZ: entrance.z,
    queenGenome,
    queenGeneticId: queenIdentity.geneticId,
    queenAge: 0,
    queenLifespanTicks: COLONY.queenLifespanTicks,
    sperm,
    stockpile: COLONY.foundingStockpile,
    patrilineMerit: new Map(),
    nextPatrilineId: sperm.length + 1,
    lastEggTick: 0,
    lastQueenEggTick: 0,
    starvingSince: -1,
  };
  world.colonies.push(colony);
  recordQueenRole(world, queenIdentity.geneticId, colony.id);
  return colony;
}

/**
 * The t=0 bootstrap colony (spec §10 curriculum): independent wide-prior
 * draws for queen and sperm, and a fast-forwarded adult first brood. All
 * later colonies are founded raw through foundFromQueenEgg, or force-
 * founded by auto-continue through foundColonyFromPool.
 */
export function foundColony(world: World): Colony {
  const x = Math.floor(world.grid.sizeX / 2);
  const z = Math.floor(world.grid.sizeZ / 2);
  const genetics = seedColonyGenetics(world);
  const colony = createColonyAt(
    world,
    x,
    z,
    genetics.queenGenome,
    genetics.queenIdentity,
    genetics.sperm
  );
  if (!colony) {
    throw new Error("no surface for colony founding");
  }
  spawnFirstBrood(world, colony, genetics.sperm);
  return colony;
}

function spawnFounderWorker(
  world: World,
  colony: Colony,
  sperm: Sperm[],
  spermIndex: number,
  founderIndex: number,
  position: ColonyPosition,
  heading: number
): void {
  const genome = makeColonyOffspring(world, colony.queenGenome, sperm[spermIndex]);
  const father = sperm[spermIndex];
  const identity = offspringIdentity(world, father.founderLineId);
  const ant = spawnAnt(
    world,
    {
      ...position,
      heading,
      energy: 1,
      lineageId: colony.id,
      patrilineId: father.patrilineId,
      motherId: colony.queenGeneticId,
      fatherId: father.geneticId,
      genome,
      controllerState: world.controller.createState(),
      traits: world.controller.physical(genome),
    },
    identity,
    false
  );
  if (world.config.mortality) {
    ant.age = Math.floor((founderIndex * ant.traits.lifespanTicks) / COLONY.initialWorkers);
    const record = world.geneticRecords.get(ant.geneticId);
    if (record) record.birthTick = world.tick - ant.age;
  }
}

/** Fast-forwarded adult first brood on the open surface around the
 * entrance, never down the shaft column (whose surface scan reaches the
 * chamber floor). */
function spawnFirstBrood(world: World, colony: Colony, sperm: Sperm[]): void {
  for (let i = 0; i < COLONY.initialWorkers; i++) {
    const spermIndex = Math.floor(world.rng.next() * sperm.length);
    const dx = 2 + Math.floor(world.rng.next() * 4);
    const dz = 2 + Math.floor(world.rng.next() * 4);
    const sx = colony.x + (world.rng.next() < 0.5 ? dx : -dx);
    const sz = colony.z + (world.rng.next() < 0.5 ? dz : -dz);
    const spawnY = surfaceSpawnY(world.grid, sx, sz);
    if (spawnY === null) {
      continue;
    }
    spawnFounderWorker(
      world,
      colony,
      sperm,
      spermIndex,
      i,
      { x: sx, y: spawnY, z: sz },
      world.rng.next() * Math.PI * 2
    );
  }
}

/**
 * Place the bootstrap colony into world-authored terrain without carving or
 * otherwise mutating that terrain. This is the Appendix E control-arm path.
 */
export function placeBootstrapColony(
  world: World,
  queenHome: ColonyPosition,
  workerStations: readonly ColonyPosition[],
  entrance: ColonyPosition = queenHome
): Colony {
  if (workerStations.length < COLONY.initialWorkers) {
    throw new Error(`bootstrap colony needs ${COLONY.initialWorkers} legal worker stations`);
  }
  const genetics = seedColonyGenetics(world);
  const colony = createColonyRecord(
    world,
    queenHome,
    genetics.queenGenome,
    genetics.queenIdentity,
    genetics.sperm,
    entrance
  );
  for (let index = 0; index < COLONY.initialWorkers; index++) {
    const spermIndex = Math.floor(world.rng.next() * genetics.sperm.length);
    spawnFounderWorker(
      world,
      colony,
      genetics.sperm,
      spermIndex,
      index,
      workerStations[index],
      (index % 8) * (Math.PI / 4)
    );
  }
  return colony;
}

/**
 * Force-founding from a survivor genome pool (auto-continue, R3): the new
 * queen and sperm are recombined and mutated draws from the pre-collapse
 * population, so the continuation carries its genetics forward; an empty
 * pool falls back to fresh wide-prior draws.
 */
export function foundColonyFromPool(world: World, pool: Genome[]): Colony | null {
  const genetics = continuationColonyGenetics(world, pool);
  const cx = Math.floor(world.grid.sizeX / 2) + Math.floor(world.rng.next() * 41) - 20;
  const cz = Math.floor(world.grid.sizeZ / 2) + Math.floor(world.rng.next() * 41) - 20;
  const colony = createColonyAt(
    world,
    cx,
    cz,
    genetics.queenGenome,
    genetics.queenIdentity,
    genetics.sperm
  );
  if (!colony) {
    return null;
  }
  spawnFirstBrood(world, colony, genetics.sperm);
  return colony;
}

function layColonyEgg(
  world: World,
  colony: Colony,
  genome: Genome,
  endowment: number,
  queenDestined: number,
  father: Sperm
): boolean {
  const spot = findEggSpot(world, colony.x, colony.y, colony.z, queenDestined === 1 ? 2 : 1);
  if (spot === null) {
    return false;
  }
  colony.stockpile -= endowment + COLONY.eggLayCost;
  world.metrics.eggEnergyInvested += endowment;
  world.metrics.energyBurned += COLONY.eggLayCost;
  const identity = offspringIdentity(world, father.founderLineId);
  addEgg(world, {
    id: world.nextEggId++,
    x: spot.x,
    y: spot.y,
    z: spot.z,
    carrierId: null,
    genome,
    energy: endowment,
    incubationRemaining: COLONY.incubationTicks,
    stage: STAGE_EGG,
    fedProgress: 0,
    hungerTicks: 0,
    sex: SEX_FEMALE,
    geneticId: identity.geneticId,
    founderLineId: identity.founderLineId,
    queenDestined,
    lineageId: colony.id,
    patrilineId: father.patrilineId,
    motherId: colony.queenGeneticId,
    fatherId: father.geneticId,
  });
  return true;
}

function layWorkerEgg(world: World, colony: Colony): void {
  const spermIndex = Math.floor(world.rng.next() * colony.sperm.length);
  const genome = makeColonyOffspring(world, colony.queenGenome, colony.sperm[spermIndex]);
  const endowment = world.controller.physical(colony.queenGenome).eggEndowment;
  if (layColonyEgg(world, colony, genome, endowment, 0, colony.sperm[spermIndex])) {
    colony.lastEggTick = world.tick;
  }
}

/**
 * A queen-destined egg: merit weighting applies at egg creation (spec §7.1
 * channel 3) — the father line is the top-delivering patriline.
 */
function layQueenEgg(world: World, colony: Colony): void {
  const father = meritSperm(colony.sperm, colony.patrilineMerit);
  const genome = sexualOffspring(world, colony.queenGenome, father.genome);
  if (layColonyEgg(world, colony, genome, QUEEN.eggEndowment, 1, father)) {
    colony.lastQueenEggTick = world.tick;
  }
}

/** Living males available for nuptial mating (ADR-0007). */
function livingMales(world: World): Ant[] {
  return world.ants.filter((ant) => ant.alive && ant.sex === SEX_MALE);
}

/**
 * A hatched winged queen (ADR-0007): fly to a random distant site, mate with
 * up to spermCount living males (each dies), and found claustrally. With no
 * males the founding fails.
 */
export function foundFromQueenEgg(world: World, egg: Egg): void {
  if (!world.config.colonyFounding) {
    return;
  }
  const males = livingMales(world);
  if (males.length === 0) {
    world.foundingFailures += 1;
    recordGeneticDeath(world, egg.geneticId, world.tick - geneticBirthTick(world, egg.geneticId));
    return;
  }
  const sperm: Sperm[] = [];
  const pool = males.slice();
  const matings = Math.min(COLONY.spermCount, pool.length);
  for (let i = 0; i < matings; i++) {
    const pick = Math.floor(world.rng.next() * pool.length);
    const male = pool.splice(pick, 1)[0];
    sperm.push({
      genome: male.genome,
      patrilineId: i + 1,
      geneticId: male.geneticId,
      founderLineId: male.founderLineId,
    });
    killAnt(world, male);
  }
  const x =
    QUEEN.flightMargin + Math.floor(world.rng.next() * (world.grid.sizeX - 2 * QUEEN.flightMargin));
  const z =
    QUEEN.flightMargin + Math.floor(world.rng.next() * (world.grid.sizeZ - 2 * QUEEN.flightMargin));
  const queenIdentity = { geneticId: egg.geneticId, founderLineId: egg.founderLineId };
  const colony = createColonyAt(world, x, z, egg.genome, queenIdentity, sperm);
  if (colony) {
    world.foundings += 1;
  } else {
    world.foundingFailures += 1;
    recordGeneticDeath(world, egg.geneticId, world.tick - geneticBirthTick(world, egg.geneticId));
  }
}

function geneticBirthTick(world: World, geneticId: number): number {
  return world.geneticRecords.get(geneticId)?.birthTick ?? world.tick;
}

function collapseColony(world: World, colony: Colony): void {
  recordGeneticDeath(world, colony.queenGeneticId, colony.queenAge);
  world.colonies = world.colonies.filter((c) => c.id !== colony.id);
  world.collapses += 1;
  world.metrics.queenDeaths += 1;
}

/** Upkeep and the starvation clock; attributes the death it reports. */
function queenDies(world: World, colony: Colony): boolean {
  colony.queenAge += 1;
  colony.stockpile -= QUEEN.upkeepPerTick;
  world.metrics.energyBurned += QUEEN.upkeepPerTick;
  if (colony.stockpile <= 0) {
    colony.stockpile = 0;
    if (colony.starvingSince < 0) {
      colony.starvingSince = world.tick;
    }
  } else {
    colony.starvingSince = -1;
  }
  const starved =
    colony.starvingSince >= 0 && world.tick - colony.starvingSince > QUEEN.starvationGraceTicks;
  if (colony.queenAge >= colony.queenLifespanTicks) {
    world.metrics.queenAgeDeaths += 1;
    return true;
  }
  if (starved) world.metrics.queenStarvationDeaths += 1;
  return starved;
}

function layEggs(world: World, colony: Colony): void {
  const queenEggReady =
    world.config.colonyFounding &&
    colony.stockpile >= QUEEN.eggThreshold &&
    world.tick - colony.lastQueenEggTick >= QUEEN.eggIntervalMin;
  if (queenEggReady) {
    layQueenEgg(world, colony);
    return;
  }
  const endowment = world.controller.physical(colony.queenGenome).eggEndowment;
  const canAfford = colony.stockpile >= endowment + COLONY.eggLayCost + 1.0;
  if (
    world.config.workerReproduction &&
    canAfford &&
    world.tick - colony.lastEggTick >= COLONY.eggIntervalMin
  ) {
    layWorkerEgg(world, colony);
  }
}

export function stepColonies(world: World): void {
  for (const colony of world.colonies.slice()) {
    if (world.config.mortality && queenDies(world, colony)) {
      collapseColony(world, colony);
      continue;
    }
    restockFromLarder(world, colony);
    if (world.config.workerReproduction || world.config.colonyFounding) {
      layEggs(world, colony);
    }
  }
}

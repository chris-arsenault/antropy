import { SEX_FEMALE, SEX_MALE, surfaceSpawnY, type Ant } from "./ant";
import { type Genome } from "./controller/contract";
import { addEgg, findEggSpot, STAGE_EGG, type Egg } from "./eggs";
import { killAnt } from "./energy";
import { carveFoundingNest } from "./foundingNest";
import { haploidOffspring, seedFounderGenomes, sexualOffspring } from "./genetics";
import { Material } from "./materials";
import { COLONY, ENERGY, QUEEN } from "./tunables";
import { mutateVoxel, spawnAnt, type World } from "./world";

export interface Sperm {
  genome: Genome;
  patrilineId: number;
}

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
  queenAge: number;
  queenLifespanTicks: number;
  sperm: Sperm[];
  stockpile: number;
  /** Food-delivery credit per patriline — the merit signal (spec §7.1). */
  patrilineDeliveries: Map<number, number>;
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

function makeOffspring(world: World, colony: Colony, spermIndex: number): Genome {
  const father = colony.sperm[spermIndex];
  return sexualOffspring(world, colony.queenGenome, father.genome);
}

/** Delivery-weighted sperm pick — the merit signal selecting the father line. */
function meritSperm(colony: Colony): Sperm {
  let best = colony.sperm[0];
  let bestScore = -1;
  for (const sperm of colony.sperm) {
    const score = colony.patrilineDeliveries.get(sperm.patrilineId) ?? 0;
    if (score > bestScore) {
      best = sperm;
      bestScore = score;
    }
  }
  return best;
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
  sperm: Sperm[]
): Colony | null {
  const surfaceY = surfaceSpawnY(world.grid, x, z);
  if (surfaceY === null) {
    return null;
  }
  const y = Math.max(3, surfaceY - COLONY.chamberDepth);
  carveFoundingNest(world, x, y, z, surfaceY);
  return createColonyRecord(world, { x, y, z }, queenGenome, sperm, {
    x,
    y: surfaceY + 1,
    z,
  });
}

function createColonyRecord(
  world: World,
  position: ColonyPosition,
  queenGenome: Genome,
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
    queenAge: 0,
    queenLifespanTicks: COLONY.queenLifespanTicks,
    sperm,
    stockpile: COLONY.foundingStockpile,
    patrilineDeliveries: new Map(),
    nextPatrilineId: sperm.length + 1,
    lastEggTick: 0,
    lastQueenEggTick: 0,
    starvingSince: -1,
  };
  world.colonies.push(colony);
  return colony;
}

interface FounderGenetics {
  readonly queenGenome: Genome;
  readonly sperm: Sperm[];
}

function founderGenetics(world: World): FounderGenetics {
  const [queenGenome, ...spermGenomes] = seedFounderGenomes(world, COLONY.spermCount + 1);
  const sperm = spermGenomes.map((genome, index) => ({
    genome,
    patrilineId: index + 1,
  }));
  return { queenGenome, sperm };
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
  const genetics = founderGenetics(world);
  const colony = createColonyAt(world, x, z, genetics.queenGenome, genetics.sperm);
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
  position: ColonyPosition,
  heading: number
): void {
  const genome = makeOffspring(world, colony, spermIndex);
  spawnAnt(world, {
    ...position,
    heading,
    energy: 1,
    lineageId: colony.id,
    patrilineId: sperm[spermIndex].patrilineId,
    motherId: 0,
    fatherId: sperm[spermIndex].patrilineId,
    genome,
    controllerState: world.controller.createState(),
    traits: world.controller.physical(genome),
  });
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
  const genetics = founderGenetics(world);
  const colony = createColonyRecord(
    world,
    queenHome,
    genetics.queenGenome,
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
  const draw = (): Genome =>
    pool.length > 0
      ? pool[Math.floor(world.rng.next() * pool.length)]
      : world.controller.seed(world.rng);
  const mix = (): Genome => {
    return sexualOffspring(world, draw(), draw());
  };
  const sperm: Sperm[] = [];
  for (let i = 0; i < COLONY.spermCount; i++) {
    const genome = draw();
    sperm.push({
      genome: haploidOffspring(world, genome),
      patrilineId: i + 1,
    });
  }
  const cx = Math.floor(world.grid.sizeX / 2) + Math.floor(world.rng.next() * 41) - 20;
  const cz = Math.floor(world.grid.sizeZ / 2) + Math.floor(world.rng.next() * 41) - 20;
  const colony = createColonyAt(world, cx, cz, mix(), sperm);
  if (!colony) {
    return null;
  }
  spawnFirstBrood(world, colony, sperm);
  return colony;
}

function layColonyEgg(
  world: World,
  colony: Colony,
  genome: Genome,
  endowment: number,
  queenDestined: number,
  patrilineId: number
): boolean {
  const spot = findEggSpot(world, colony.x, colony.y, colony.z, queenDestined === 1 ? 2 : 1);
  if (spot === null) {
    return false;
  }
  colony.stockpile -= endowment + COLONY.eggLayCost;
  world.metrics.energyBurned += COLONY.eggLayCost;
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
    queenDestined,
    lineageId: colony.id,
    patrilineId,
    motherId: 0,
    fatherId: patrilineId,
  });
  return true;
}

function layWorkerEgg(world: World, colony: Colony): void {
  const spermIndex = Math.floor(world.rng.next() * colony.sperm.length);
  const genome = makeOffspring(world, colony, spermIndex);
  const endowment = world.controller.physical(colony.queenGenome).eggEndowment;
  if (layColonyEgg(world, colony, genome, endowment, 0, colony.sperm[spermIndex].patrilineId)) {
    colony.lastEggTick = world.tick;
  }
}

/**
 * A queen-destined egg: merit weighting applies at egg creation (spec §7.1
 * channel 3) — the father line is the top-delivering patriline.
 */
function layQueenEgg(world: World, colony: Colony): void {
  const father = meritSperm(colony);
  const genome = sexualOffspring(world, colony.queenGenome, father.genome);
  if (layColonyEgg(world, colony, genome, QUEEN.eggEndowment, 1, father.patrilineId)) {
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
    return;
  }
  const sperm: Sperm[] = [];
  const pool = males.slice();
  const matings = Math.min(COLONY.spermCount, pool.length);
  for (let i = 0; i < matings; i++) {
    const pick = Math.floor(world.rng.next() * pool.length);
    const male = pool.splice(pick, 1)[0];
    sperm.push({ genome: male.genome, patrilineId: i + 1 });
    killAnt(world, male);
  }
  const x =
    QUEEN.flightMargin + Math.floor(world.rng.next() * (world.grid.sizeX - 2 * QUEEN.flightMargin));
  const z =
    QUEEN.flightMargin + Math.floor(world.rng.next() * (world.grid.sizeZ - 2 * QUEEN.flightMargin));
  const colony = createColonyAt(world, x, z, egg.genome, sperm);
  if (colony) {
    world.foundings += 1;
  } else {
    world.foundingFailures += 1;
  }
}

function collapseColony(world: World, colony: Colony): void {
  world.colonies = world.colonies.filter((c) => c.id !== colony.id);
  world.collapses += 1;
  world.metrics.queenDeaths += 1;
}

/** Upkeep and the starvation clock; true when the queen has died. */
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
  return colony.queenAge >= colony.queenLifespanTicks || starved;
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

/**
 * One tick of scripted queen behavior per colony: upkeep from the stockpile,
 * death by age or starvation (colony collapse, spec §9.1), then queen or
 * worker egg laying as provisioning allows.
 */
/**
 * Attendants refill a low crop from the physical larder: the nearest
 * hoarded FOOD voxel within restock reach (underground galleries count,
 * surface piles beyond the nest do too) is consumed into the stockpile.
 * Scripted colony logistics at the same abstraction level as
 * trophallaxis; where the hoard physically survives weather is what the
 * liabilities price.
 */
function restockFromLarder(world: World, colony: Colony): void {
  if (colony.stockpile >= COLONY.restockBelow) {
    return;
  }
  const surface = world.surfaceMap[colony.z * world.grid.sizeX + colony.x];
  for (const index of world.foodSources) {
    const x = index % world.grid.sizeX;
    const z = Math.floor(index / world.grid.sizeX) % world.grid.sizeZ;
    const y = Math.floor(index / (world.grid.sizeX * world.grid.sizeZ));
    if (
      Math.abs(x - colony.x) <= COLONY.restockRadius &&
      Math.abs(z - colony.z) <= COLONY.restockRadius &&
      y <= surface + 1
    ) {
      mutateVoxel(world, x, y, z, Material.AIR);
      colony.stockpile += ENERGY.foodEnergy;
      return;
    }
  }
}

export function stepColonies(world: World): void {
  for (const colony of world.colonies.slice()) {
    // Mortality gates queen death/collapse (Phase 3+); without it the
    // scripted queen is immortal for the Phase 2 base case.
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

/** Credit a physical food delivery: full value to the stockpile + merit. */
export function creditDelivery(
  world: World,
  lineageId: number,
  patrilineId: number,
  amount: number
): void {
  const colony = world.colonies.find((c) => c.id === lineageId);
  if (!colony) {
    return;
  }
  colony.stockpile += amount;
  colony.patrilineDeliveries.set(
    patrilineId,
    (colony.patrilineDeliveries.get(patrilineId) ?? 0) + 1
  );
}

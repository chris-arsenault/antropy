import { type Checkpoint2D } from "./checkpoint";
import { type Action } from "../sim/controller/contract";
import { type Brood } from "../sim/types";

function integer(value: number, minimum = 0): boolean {
  return Number.isSafeInteger(value) && value >= minimum;
}

function nonnegative(values: readonly number[]): boolean {
  return values.every((value) => Number.isFinite(value) && value >= 0);
}

function point(checkpoint: Checkpoint2D, value: { x: number; y: number }): boolean {
  return (
    integer(value.x) &&
    integer(value.y) &&
    value.x < checkpoint.config.width &&
    value.y < checkpoint.config.height
  );
}

function action(value: Action): boolean {
  return (
    !!value &&
    [-1, 0, 1].includes(value.turn) &&
    [value.move, value.mandible, value.eat, value.feed, value.release].every(
      (entry) => typeof entry === "boolean"
    ) &&
    nonnegative([value.pheromoneA, value.pheromoneB])
  );
}

function validWorkerBody(checkpoint: Checkpoint2D, ant: Checkpoint2D["ants"][number]): boolean {
  return (
    point(checkpoint, ant) &&
    integer(ant.id, 1) &&
    integer(ant.heading) &&
    ant.heading <= 7 &&
    integer(ant.age) &&
    Number.isSafeInteger(ant.birthTick) &&
    ant.birthTick <= checkpoint.tick &&
    nonnegative([ant.cargo, ant.energy, ant.distanceMoved, ant.turns, ant.immediateTurnReversals])
  );
}

function validWorkerMemory(ant: Checkpoint2D["ants"][number]): boolean {
  return (
    [-1, 0, 1].includes(ant.previousTurn) &&
    Array.isArray(ant.lastInputs) &&
    ant.lastInputs.every(Number.isFinite) &&
    Array.isArray(ant.controllerState) &&
    action(ant.lastAction)
  );
}

function validateNextIdentity(next: number, ids: ReadonlySet<number>): void {
  if (!integer(next, 1) || [...ids].some((id) => id >= next))
    throw new Error("invalid checkpoint next identity");
}

function validateAnts(checkpoint: Checkpoint2D): void {
  const ids = new Set<number>([checkpoint.queen.id]);
  for (const ant of checkpoint.ants) {
    if (
      !ant ||
      ant.caste !== "worker" ||
      !validWorkerBody(checkpoint, ant) ||
      ids.has(ant.id) ||
      !validWorkerMemory(ant)
    )
      throw new Error("invalid checkpoint worker state");
    validatePickup(checkpoint.tick, ant.pickupTick);
    ids.add(ant.id);
  }
  validateNextIdentity(checkpoint.nextAntId, ids);
}

function validatePickup(tick: number, pickup: number | null): void {
  if (pickup !== null && (!integer(pickup) || pickup > tick))
    throw new Error("invalid checkpoint pickup tick");
}

function validBrood(checkpoint: Checkpoint2D, brood: Brood): boolean {
  return (
    !!brood &&
    point(checkpoint, brood) &&
    integer(brood.id, 1) &&
    ["egg", "larva", "pupa"].includes(brood.stage) &&
    nonnegative([brood.age]) &&
    nonnegative([brood.energy, brood.investment])
  );
}

function validateQueen(checkpoint: Checkpoint2D): void {
  const queen = checkpoint.queen;
  if (
    queen.caste !== "queen" ||
    !validWorkerBody(checkpoint, queen) ||
    !validWorkerMemory(queen) ||
    !point(checkpoint, queen) ||
    typeof queen.alive !== "boolean" ||
    !nonnegative([queen.energy]) ||
    !integer(queen.age) ||
    !integer(queen.layingAge)
  )
    throw new Error("invalid checkpoint queen state");
  validatePickup(checkpoint.tick, queen.pickupTick);
}

function validateColony(checkpoint: Checkpoint2D): void {
  validateQueen(checkpoint);
  const ids = new Set<number>();
  for (const brood of checkpoint.brood) {
    if (!validBrood(checkpoint, brood) || ids.has(brood.id))
      throw new Error("invalid checkpoint brood state");
    ids.add(brood.id);
  }
  validateNextIdentity(checkpoint.nextBroodId, ids);
}

function validFood(entry: [number, number], size: number): boolean {
  return (
    Array.isArray(entry) &&
    entry.length === 2 &&
    integer(entry[0]) &&
    entry[0] < size &&
    Number.isFinite(entry[1]) &&
    entry[1] > 0
  );
}

function validateResources(checkpoint: Checkpoint2D): void {
  const size = checkpoint.config.width * checkpoint.config.height;
  const food = new Set<number>();
  for (const entry of checkpoint.food) {
    if (!validFood(entry, size) || food.has(entry[0]))
      throw new Error("invalid checkpoint food quantity");
    food.add(entry[0]);
  }
  if (
    !Array.isArray(checkpoint.renewableSources) ||
    new Set(checkpoint.renewableSources).size !== checkpoint.renewableSources.length ||
    !checkpoint.renewableSources.every((index) => integer(index) && index < size)
  )
    throw new Error("invalid checkpoint renewable source");
}

function validateChemicals(checkpoint: Checkpoint2D): void {
  const size = checkpoint.config.width * checkpoint.config.height;
  for (const key of ["foodOdor", "nestOdor", "pheromoneA", "pheromoneB", "freshAir"] as const) {
    const field = checkpoint[key];
    if (
      !field ||
      !Array.isArray(field.active) ||
      !Array.isArray(field.values) ||
      field.active.length !== field.values.length ||
      new Set(field.active).size !== field.active.length ||
      !field.active.every((index) => integer(index) && index < size) ||
      !nonnegative(field.values)
    )
      throw new Error(`invalid checkpoint chemical field: ${key}`);
  }
}

function validateLedgers(checkpoint: Checkpoint2D): void {
  if (![null, "age", "starvation"].includes(checkpoint.economy.queenDeath))
    throw new Error("invalid checkpoint queen death cause");
  const values = Object.entries(checkpoint.economy)
    .filter(([key]) => key !== "queenDeath")
    .map(([, value]) => value as number);
  if (!nonnegative(values)) throw new Error("invalid checkpoint energy ledger");
  const metrics = checkpoint.metrics;
  if (!metrics || !Array.isArray(metrics.pickupTicks) || !Array.isArray(metrics.depositTicks))
    throw new Error("invalid checkpoint metrics");
  for (const value of Object.values(metrics)) {
    if (
      Array.isArray(value)
        ? !value.every((tick) => integer(tick) && tick <= checkpoint.tick)
        : !nonnegative([value])
    )
      throw new Error("invalid checkpoint metric value");
  }
}

/** Validate serialized state before constructing runtime objects or allocating chemical fields. */
export function validateCheckpointState(checkpoint: Checkpoint2D): void {
  if (
    !integer(checkpoint.tick) ||
    !Number.isFinite(checkpoint.seed) ||
    !integer(checkpoint.randomState, 1) ||
    checkpoint.randomState > 0xffffffff
  )
    throw new Error("invalid checkpoint clock or random state");
  validateAnts(checkpoint);
  validateColony(checkpoint);
  validateResources(checkpoint);
  validateChemicals(checkpoint);
  validateLedgers(checkpoint);
}

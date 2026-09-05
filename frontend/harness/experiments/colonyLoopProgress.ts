import { type Ant } from "../../src/sim/ant";
import { ACTION_THRESHOLD, Input, Output } from "../../src/sim/controller/contract";
import { shortestAntPathToNest } from "../../src/sim/fieldNavigation";
import { type World } from "../../src/sim/world";
import { type FoodSite, type ForageProgress } from "./colonyLoopTypes";

function nestSignal(ant: Ant): number {
  return ant.lastInputs[Input.NEST_SCENT_LEFT] + ant.lastInputs[Input.NEST_SCENT_RIGHT];
}

function foodSignal(ant: Ant): number {
  return ant.lastInputs[Input.FOOD_SCENT_LEFT] + ant.lastInputs[Input.FOOD_SCENT_RIGHT];
}

function colonySignal(ant: Ant): number {
  return Math.max(
    ant.lastInputs[Input.COLONY_SCENT_LEFT],
    ant.lastInputs[Input.COLONY_SCENT_CENTER],
    ant.lastInputs[Input.COLONY_SCENT_RIGHT],
    ant.lastInputs[Input.COLONY_SCENT_DOWN],
    ant.lastInputs[Input.COLONY_SCENT_UP],
    ant.lastInputs[Input.COLONY_SCENT_DOWN_LEFT],
    ant.lastInputs[Input.COLONY_SCENT_DOWN_RIGHT],
    ant.lastInputs[Input.COLONY_SCENT_UP_LEFT],
    ant.lastInputs[Input.COLONY_SCENT_UP_RIGHT]
  );
}

function recordRawPickup(
  progress: ForageProgress,
  ant: Ant,
  tick: number,
  loadedNow: boolean
): void {
  if (!loadedNow || progress.rawPickupTick !== null) return;
  progress.rawPickupTick = tick;
  progress.rawPickupDepth = ant.lastInputs[Input.DEPTH];
}

function recordSurfacePickup(
  world: World,
  progress: ForageProgress,
  ant: Ant,
  tick: number,
  loadedNow: boolean
): void {
  const pickedUpOnSurface = loadedNow && ant.lastInputs[Input.DEPTH] === 0;
  if (progress.exitTick === null || progress.pickupTick !== null || !pickedUpOnSurface) return;
  progress.pickupTick = tick;
  progress.pickupNestSignal = nestSignal(ant);
  progress.optimalHomeSteps = shortestAntPathToNest(world, ant);
}

function recordReturn(progress: ForageProgress, tick: number, surfaced: boolean): void {
  if (
    progress.pickupTick !== null &&
    tick > progress.pickupTick &&
    progress.returnTick === null &&
    !surfaced
  ) {
    progress.returnTick = tick;
    progress.homePathStepsAtReturn = progress.homePathSteps;
  }
}

function recordArrival(
  world: World,
  progress: ForageProgress,
  ant: Ant,
  surfaced: boolean,
  tick: number
): void {
  if (progress.exitTick === null && surfaced) progress.exitTick = tick;
  const loadedNow = progress.priorLoad <= 0 && ant.carryLoad > 0;
  recordRawPickup(progress, ant, tick, loadedNow);
  recordSurfacePickup(world, progress, ant, tick, loadedNow);
  recordReturn(progress, tick, surfaced);
}

function recordDeposit(progress: ForageProgress, ant: Ant, tick: number, surfaced: boolean): void {
  const unloaded = progress.priorLoad > 0 && ant.carryLoad === 0;
  if (unloaded && progress.unloadAt === null) {
    progress.unloadAt = { x: ant.x, y: ant.y, z: ant.z };
    progress.unloadColonySignal = colonySignal(ant);
    progress.unloadDepth = ant.lastInputs[Input.DEPTH];
    progress.unloadSurface = surfaced;
  }
  if (
    progress.returnTick !== null &&
    tick > progress.returnTick &&
    progress.depositTick === null &&
    unloaded &&
    !surfaced
  ) {
    progress.depositTick = tick;
  }
  progress.priorLoad = ant.carryLoad;
}

function recordBasicSignals(progress: ForageProgress, ant: Ant, food: FoodSite): void {
  progress.maxFoodSignal = Math.max(progress.maxFoodSignal, foodSignal(ant));
  const foodContact = ant.lastInputs[Input.CONTACT_FOOD] > 0;
  const digIntent = ant.lastOutputs[Output.DIG] > ACTION_THRESHOLD;
  if (foodContact) progress.foodContactTicks += 1;
  if (digIntent) progress.digIntentTicks += 1;
  if (foodContact && digIntent && ant.carryLoad <= 0) {
    progress.unresolvedFoodContactTicks += 1;
  }
  progress.maxNestSignal = Math.max(progress.maxNestSignal, nestSignal(ant));
  progress.minFoodDistance = Math.min(
    progress.minFoodDistance,
    Math.max(Math.abs(ant.x - food.x), Math.abs(ant.z - food.z))
  );
}

function recordLoadedSignals(
  progress: ForageProgress,
  ant: Ant,
  entrance: { x: number; y: number; z: number },
  surfaced: boolean
): void {
  const nestLeft = ant.lastInputs[Input.NEST_SCENT_LEFT];
  const nestRight = ant.lastInputs[Input.NEST_SCENT_RIGHT];
  progress.loadedTicks += 1;
  if (!surfaced) progress.loadedUndergroundTicks += 1;
  if (ant.lastOutputs[Output.DIG] > ACTION_THRESHOLD) progress.loadedDigTicks += 1;
  if (ant.lastOutputs[Output.VERTICAL_BIAS] < -0.33) progress.loadedDownTicks += 1;
  const solidity = ant.lastInputs[Input.LOCAL_SOLIDITY];
  const depth = ant.lastInputs[Input.DEPTH];
  if (solidity >= 0.5) progress.loadedSolidityAboveHalfTicks += 1;
  progress.maxLoadedSolidity = Math.max(progress.maxLoadedSolidity, solidity);
  progress.minLoadedSolidity = Math.min(progress.minLoadedSolidity, solidity);
  progress.maxLoadedDepth = Math.max(progress.maxLoadedDepth, depth);
  progress.minLoadedDepth = Math.min(progress.minLoadedDepth, depth);
  if (nestLeft >= 1 && nestRight >= 1) progress.saturatedNestTicks += 1;
  if (Math.abs(nestLeft - nestRight) >= 0.01) progress.directionalNestTicks += 1;
  progress.minLoadedEntranceDistance = Math.min(
    progress.minLoadedEntranceDistance,
    Math.max(
      Math.abs(ant.x - entrance.x),
      Math.abs(ant.y - entrance.y),
      Math.abs(ant.z - entrance.z)
    )
  );
}

export function recordForageSignals(
  progress: ForageProgress,
  ant: Ant,
  food: FoodSite,
  entrance: { x: number; y: number; z: number },
  surfaced: boolean
): void {
  recordBasicSignals(progress, ant, food);
  if (ant.carryLoad > 0) recordLoadedSignals(progress, ant, entrance, surfaced);
}

export function observeForageProgress(
  world: World,
  progress: ForageProgress,
  ant: Ant,
  surfaced: boolean,
  tick: number
): void {
  recordArrival(world, progress, ant, surfaced, tick);
  recordDeposit(progress, ant, tick, surfaced);
}

export function createForageProgress(ant: Ant): ForageProgress {
  return {
    exitTick: null,
    rawPickupTick: null,
    rawPickupDepth: null,
    pickupTick: null,
    returnTick: null,
    depositTick: null,
    priorLoad: ant.carryLoad,
    maxFoodSignal: 0,
    maxNestSignal: 0,
    minFoodDistance: Number.POSITIVE_INFINITY,
    foodContactTicks: 0,
    digIntentTicks: 0,
    unresolvedFoodContactTicks: 0,
    pickupNestSignal: null,
    unloadAt: null,
    unloadColonySignal: null,
    unloadDepth: null,
    unloadSurface: null,
    loadedTicks: 0,
    loadedUndergroundTicks: 0,
    loadedDigTicks: 0,
    loadedDownTicks: 0,
    loadedSolidityAboveHalfTicks: 0,
    maxLoadedSolidity: 0,
    minLoadedSolidity: Number.POSITIVE_INFINITY,
    maxLoadedDepth: 0,
    minLoadedDepth: Number.POSITIVE_INFINITY,
    saturatedNestTicks: 0,
    directionalNestTicks: 0,
    minLoadedEntranceDistance: Number.POSITIVE_INFINITY,
    homePathSteps: 0,
    homePathStepsAtReturn: null,
    optimalHomeSteps: null,
    startX: ant.x,
    startY: ant.y,
    startZ: ant.z,
    movementSteps: 0,
    visitedPositions: new Set([`${ant.x},${ant.y},${ant.z}`]),
    signedTurn: 0,
    absoluteTurn: 0,
    priorTurnDirection: 0,
    turnDirectionChanges: 0,
  };
}

export function recordForageMove(
  progress: ForageProgress,
  ant: Ant,
  previous: { x: number; y: number; z: number },
  wasLoaded: boolean
): void {
  const moved = ant.x !== previous.x || ant.y !== previous.y || ant.z !== previous.z;
  if (moved) {
    progress.movementSteps += 1;
    progress.visitedPositions.add(`${ant.x},${ant.y},${ant.z}`);
  }
  if (wasLoaded && moved) {
    progress.homePathSteps += 1;
  }
  const turn = ant.lastOutputs[Output.TURN];
  progress.signedTurn += turn;
  progress.absoluteTurn += Math.abs(turn);
  const direction = Math.sign(turn) as -1 | 0 | 1;
  if (
    direction !== 0 &&
    progress.priorTurnDirection !== 0 &&
    direction !== progress.priorTurnDirection
  ) {
    progress.turnDirectionChanges += 1;
  }
  if (direction !== 0) progress.priorTurnDirection = direction;
}

function homePathEfficiency(progress: ForageProgress): number | null {
  if (progress.homePathStepsAtReturn === null || progress.optimalHomeSteps === null) return null;
  return progress.homePathStepsAtReturn / Math.max(1, progress.optimalHomeSteps);
}

function progressSummary(
  progress: ForageProgress,
  ant: Ant,
  elapsed: number
): Record<string, unknown> {
  const displacement = Math.max(
    Math.abs(progress.startX - ant.x),
    Math.abs(progress.startY - ant.y),
    Math.abs(progress.startZ - ant.z)
  );
  return {
    exited: progress.exitTick !== null,
    rawPickupTick: progress.rawPickupTick,
    rawPickupDepth: progress.rawPickupDepth,
    pickedUp: progress.pickupTick !== null,
    returned: progress.returnTick !== null,
    deposited: progress.depositTick !== null,
    roundTrip:
      progress.exitTick !== null &&
      progress.pickupTick !== null &&
      progress.returnTick !== null &&
      progress.depositTick !== null,
    exitTick: progress.exitTick,
    pickupTick: progress.pickupTick,
    returnTick: progress.returnTick,
    depositTick: progress.depositTick,
    pickupNestSignal: progress.pickupNestSignal,
    unloadAt: progress.unloadAt,
    unloadColonySignal: progress.unloadColonySignal,
    unloadDepth: progress.unloadDepth,
    unloadSurface: progress.unloadSurface,
    maxFoodSignal: progress.maxFoodSignal,
    maxNestSignal: progress.maxNestSignal,
    foodContactTicks: progress.foodContactTicks,
    digIntentTicks: progress.digIntentTicks,
    unresolvedFoodContactTicks: progress.unresolvedFoodContactTicks,
    loadedTicks: progress.loadedTicks,
    loadedUndergroundTicks: progress.loadedUndergroundTicks,
    loadedDigTicks: progress.loadedDigTicks,
    loadedDownTicks: progress.loadedDownTicks,
    loadedSolidityAboveHalfTicks: progress.loadedSolidityAboveHalfTicks,
    maxLoadedSolidity: progress.maxLoadedSolidity,
    minLoadedSolidity: progress.minLoadedSolidity,
    maxLoadedDepth: progress.maxLoadedDepth,
    minLoadedDepth: progress.minLoadedDepth,
    saturatedNestTicks: progress.saturatedNestTicks,
    directionalNestTicks: progress.directionalNestTicks,
    minLoadedEntranceDistance: progress.minLoadedEntranceDistance,
    homePathSteps: progress.homePathSteps,
    homePathStepsAtReturn: progress.homePathStepsAtReturn,
    optimalHomeSteps: progress.optimalHomeSteps,
    homePathEfficiency: homePathEfficiency(progress),
    movementSteps: progress.movementSteps,
    uniquePositions: progress.visitedPositions.size,
    netDisplacement: displacement,
    pathStretch: progress.movementSteps / Math.max(1, displacement),
    signedTurnRevolutions: progress.signedTurn / 8,
    absoluteTurnRevolutions: progress.absoluteTurn / 8,
    turnBias:
      progress.absoluteTurn === 0 ? 0 : Math.abs(progress.signedTurn) / progress.absoluteTurn,
    turnDirectionChanges: progress.turnDirectionChanges,
    minFoodDistance: progress.minFoodDistance,
    elapsed,
  };
}

function scentSnapshot(ant: Ant, channels: readonly number[]): Record<string, number> {
  const [left, center, right, down, up] = channels;
  return {
    left: ant.lastInputs[left],
    center: ant.lastInputs[center],
    right: ant.lastInputs[right],
    down: ant.lastInputs[down],
    up: ant.lastInputs[up],
  };
}

function finalSummary(ant: Ant): Record<string, unknown> {
  return {
    x: ant.x,
    y: ant.y,
    z: ant.z,
    heading: ant.heading,
    verticalAttention: ant.verticalAttention,
    moveCharge: ant.moveCharge,
    energy: ant.energy,
    load: ant.carryLoad,
    facingSlope: ant.lastInputs[Input.FACING_SLOPE],
    food: {
      ...scentSnapshot(ant, [
        Input.FOOD_SCENT_LEFT,
        Input.FOOD_SCENT_CENTER,
        Input.FOOD_SCENT_RIGHT,
        Input.FOOD_SCENT_DOWN,
        Input.FOOD_SCENT_UP,
      ]),
      centerChange: ant.lastInputs[Input.FOOD_SCENT_CENTER_CHANGE],
    },
    nest: {
      ...scentSnapshot(ant, [
        Input.NEST_SCENT_LEFT,
        Input.NEST_SCENT_CENTER,
        Input.NEST_SCENT_RIGHT,
        Input.NEST_SCENT_DOWN,
        Input.NEST_SCENT_UP,
      ]),
      centerChange: ant.lastInputs[Input.NEST_SCENT_CENTER_CHANGE],
    },
    colony: scentSnapshot(ant, [
      Input.COLONY_SCENT_LEFT,
      Input.COLONY_SCENT_CENTER,
      Input.COLONY_SCENT_RIGHT,
      Input.COLONY_SCENT_DOWN,
      Input.COLONY_SCENT_UP,
    ]),
    breadcrumb: scentSnapshot(ant, [
      Input.PHEROMONE_B_LEFT,
      Input.PHEROMONE_B_CENTER,
      Input.PHEROMONE_B_RIGHT,
      Input.PHEROMONE_B_DOWN,
      Input.PHEROMONE_B_UP,
    ]),
    outputs: {
      turn: ant.lastOutputs[Output.TURN],
      forward: ant.lastOutputs[Output.FORWARD],
      verticalBias: ant.lastOutputs[Output.VERTICAL_BIAS],
      dig: ant.lastOutputs[Output.DIG],
    },
  };
}

export function forageProgressSummary(
  ant: Ant,
  progress: ForageProgress,
  elapsed: number
): Record<string, unknown> {
  return { ...progressSummary(progress, ant, elapsed), final: finalSummary(ant) };
}

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

function recordArrival(
  world: World,
  progress: ForageProgress,
  ant: Ant,
  surfaced: boolean,
  tick: number
): void {
  if (progress.exitTick === null && surfaced) progress.exitTick = tick;
  if (progress.pickupTick === null && ant.carryLoad > 0) {
    progress.pickupTick = tick;
    progress.pickupNestSignal = nestSignal(ant);
    progress.optimalHomeSteps = shortestAntPathToNest(world, ant);
  }
  if (progress.pickupTick !== null && progress.returnTick === null && !surfaced) {
    progress.returnTick = tick;
    progress.homePathStepsAtReturn = progress.homePathSteps;
  }
}

function recordDeposit(progress: ForageProgress, ant: Ant, tick: number, surfaced: boolean): void {
  const unloaded = progress.priorLoad > 0 && ant.carryLoad === 0;
  if (unloaded && progress.unloadAt === null) {
    progress.unloadAt = { x: ant.x, y: ant.y, z: ant.z };
    progress.unloadColonySignal = colonySignal(ant);
    progress.unloadDepth = ant.lastInputs[Input.DEPTH];
    progress.unloadSurface = surfaced;
  }
  if (progress.returnTick !== null && progress.depositTick === null && unloaded && !surfaced) {
    progress.depositTick = tick;
  }
  progress.priorLoad = ant.carryLoad;
}

export function recordForageSignals(
  progress: ForageProgress,
  ant: Ant,
  food: FoodSite,
  entrance: { x: number; y: number; z: number },
  surfaced: boolean
): void {
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
  if (ant.carryLoad <= 0) return;
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
  };
}

export function recordLoadedMove(
  progress: ForageProgress,
  ant: Ant,
  previous: { x: number; y: number; z: number },
  wasLoaded: boolean
): void {
  if (wasLoaded && (ant.x !== previous.x || ant.y !== previous.y || ant.z !== previous.z)) {
    progress.homePathSteps += 1;
  }
}

export function forageProgressSummary(
  ant: Ant,
  progress: ForageProgress,
  elapsed: number
): Record<string, unknown> {
  return {
    exited: progress.exitTick !== null,
    pickedUp: progress.pickupTick !== null,
    returned: progress.returnTick !== null,
    deposited: progress.depositTick !== null,
    roundTrip: progress.depositTick !== null,
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
    homePathEfficiency:
      progress.homePathStepsAtReturn !== null && progress.optimalHomeSteps !== null
        ? progress.homePathStepsAtReturn / Math.max(1, progress.optimalHomeSteps)
        : null,
    minFoodDistance: progress.minFoodDistance,
    elapsed,
    final: {
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
        left: ant.lastInputs[Input.FOOD_SCENT_LEFT],
        center: ant.lastInputs[Input.FOOD_SCENT_CENTER],
        right: ant.lastInputs[Input.FOOD_SCENT_RIGHT],
        down: ant.lastInputs[Input.FOOD_SCENT_DOWN],
        up: ant.lastInputs[Input.FOOD_SCENT_UP],
        centerChange: ant.lastInputs[Input.FOOD_SCENT_CENTER_CHANGE],
      },
      nest: {
        left: ant.lastInputs[Input.NEST_SCENT_LEFT],
        center: ant.lastInputs[Input.NEST_SCENT_CENTER],
        right: ant.lastInputs[Input.NEST_SCENT_RIGHT],
        down: ant.lastInputs[Input.NEST_SCENT_DOWN],
        up: ant.lastInputs[Input.NEST_SCENT_UP],
        centerChange: ant.lastInputs[Input.NEST_SCENT_CENTER_CHANGE],
      },
      colony: {
        left: ant.lastInputs[Input.COLONY_SCENT_LEFT],
        center: ant.lastInputs[Input.COLONY_SCENT_CENTER],
        right: ant.lastInputs[Input.COLONY_SCENT_RIGHT],
        down: ant.lastInputs[Input.COLONY_SCENT_DOWN],
        up: ant.lastInputs[Input.COLONY_SCENT_UP],
      },
      breadcrumb: {
        left: ant.lastInputs[Input.PHEROMONE_B_LEFT],
        center: ant.lastInputs[Input.PHEROMONE_B_CENTER],
        right: ant.lastInputs[Input.PHEROMONE_B_RIGHT],
        down: ant.lastInputs[Input.PHEROMONE_B_DOWN],
        up: ant.lastInputs[Input.PHEROMONE_B_UP],
      },
      outputs: {
        turn: ant.lastOutputs[Output.TURN],
        forward: ant.lastOutputs[Output.FORWARD],
        verticalBias: ant.lastOutputs[Output.VERTICAL_BIAS],
        dig: ant.lastOutputs[Output.DIG],
      },
    },
  };
}

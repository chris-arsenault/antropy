import { type TraceSample } from "../lib/ledger";

export interface FoodSite {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ColonyLoopResult {
  readonly summary: Record<string, unknown>;
  readonly params: Record<string, unknown>;
  readonly trace: TraceSample[];
}

export interface SensorFrame {
  readonly inputs: Float32Array;
  readonly outputs: Float32Array;
  readonly phase: "forage" | "abundance" | "scarcity";
}

export interface ForageProgress {
  exitTick: number | null;
  pickupTick: number | null;
  returnTick: number | null;
  depositTick: number | null;
  priorLoad: number;
  maxFoodSignal: number;
  maxNestSignal: number;
  minFoodDistance: number;
  foodContactTicks: number;
  digIntentTicks: number;
  unresolvedFoodContactTicks: number;
  pickupNestSignal: number | null;
  unloadAt: { x: number; y: number; z: number } | null;
  unloadColonySignal: number | null;
  unloadDepth: number | null;
  unloadSurface: boolean | null;
  loadedTicks: number;
  loadedUndergroundTicks: number;
  loadedDigTicks: number;
  loadedDownTicks: number;
  loadedSolidityAboveHalfTicks: number;
  maxLoadedSolidity: number;
  minLoadedSolidity: number;
  maxLoadedDepth: number;
  minLoadedDepth: number;
  saturatedNestTicks: number;
  directionalNestTicks: number;
  minLoadedEntranceDistance: number;
  homePathSteps: number;
  homePathStepsAtReturn: number | null;
  optimalHomeSteps: number | null;
}

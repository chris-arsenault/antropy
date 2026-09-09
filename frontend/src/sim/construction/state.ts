import { type Point } from "../geometry";
import { type Material } from "../materials";

export const JOB_KINDS = ["dig", "queen", "cache", "move-cache", "brood"] as const;
export type JobKind = (typeof JOB_KINDS)[number];
export interface ConstructionJob extends Point {
  readonly id: number;
  readonly kind: JobKind;
  readonly source: number | null;
  readonly dump: Point;
  owner: number | null;
  status: "pending" | "active" | "done" | "canceled";
  cacheId: number | null;
  spoilPending: boolean;
  recovery: number | null;
  origin: "manual" | "controller";
  createdAt: number;
  finishedAt: number | null;
}
export interface ConstructionState {
  initialNestArea: number;
  nextId: number;
  jobs: ConstructionJob[];
  excavation: Map<number, number>;
  loose: Map<number, Material[]>;
  excavated: number;
  deposited: number;
  queenMoves: number;
  interventions: number;
  completed: Record<JobKind, number>;
}
export function createConstruction(): ConstructionState {
  return {
    initialNestArea: 0,
    nextId: -1000,
    jobs: [],
    excavation: new Map(),
    loose: new Map(),
    excavated: 0,
    deposited: 0,
    queenMoves: 0,
    interventions: 0,
    completed: { dig: 0, queen: 0, cache: 0, "move-cache": 0, brood: 0 },
  };
}

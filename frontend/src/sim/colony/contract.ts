import { type Point } from "../geometry";

export const REQUESTS = [
  "wait",
  "up",
  "down",
  "left",
  "right",
  "acquire",
  "forward",
  "backward",
  "discard",
  "pickup",
  "deposit",
  "eat",
  "feed",
  "pheromone",
  "claim",
  "finish",
  "dig",
  "deposit-spoil",
  "recover-spoil",
  "attach-queen",
  "release-queen",
  "create-cache",
  "retire-cache",
  "attach-brood",
  "release-brood",
  "propose",
  "abandon",
  "remember-site",
  "forget-site",
  "drop-spoil",
  "pheromone-b",
  "lay-egg",
] as const;
export type RequestKind = (typeof REQUESTS)[number];
export const RESULTS = [
  "success",
  "blocked",
  "empty",
  "out-of-reach",
  "unknown-destination",
  "unreachable",
  "off-route",
  "arrived",
  "no-route",
  "full",
  "working",
] as const;
export type ActionResult = (typeof RESULTS)[number];
export interface Request {
  readonly proposal: {
    readonly kind: "dig" | "queen" | "cache" | "move-cache" | "brood";
    readonly dump: number;
    readonly source: number | null;
  } | null;
  readonly kind: RequestKind;
  readonly destination: number | null;
  readonly heading: number;
  readonly task: number | null;
}
export const WAIT: Request = {
  kind: "wait",
  destination: null,
  heading: 0,
  task: null,
  proposal: null,
};
export const LOCATION_KINDS = [
  "entrance",
  "queen",
  "care",
  "cache",
  "food",
  "work",
  "site",
] as const;
export interface KnownLocation extends Point {
  readonly backed: boolean;
  readonly id: number;
  readonly kind: (typeof LOCATION_KINDS)[number];
  readonly quantity: number;
  readonly observedAt: number | null;
}
export interface ColonyKnowledge {
  readonly colonyId: number;
  readonly locations: Map<number, KnownLocation>;
}
export interface Route {
  readonly destination: number;
  readonly cells: number[];
  readonly revision: number;
  cursor: number;
  offRoute: boolean;
}
export interface DecisionState {
  focus: (Point & { since: number; backed: boolean }) | null;
  route: Route | null;
  result: ActionResult;
  history: { tick: number; request: Request; result: ActionResult }[];
  registers: number[];
}
export function createDecisionState(): DecisionState {
  return {
    focus: null,
    route: null,
    result: "no-route",
    history: [],
    registers: Array(32).fill(0) as number[],
  };
}
export function isKnowledgeScenario(scenario: string): boolean {
  return scenario === "colony-programmed" || scenario === "colony-lgp";
}

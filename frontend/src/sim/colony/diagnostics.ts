import { type World, type Ant } from "../types";
import { type Candidate } from "./observation";
import { type Request, type ActionResult } from "./contract";

export function decisionSnapshot(ant: Ant) {
  return {
    id: ant.id,
    caste: ant.caste,
    x: ant.x,
    y: ant.y,
    cargo: ant.cargo,
    heading: ant.heading,
    spoil: ant.spoil,
    task: ant.task,
    destination: ant.decision.route?.destination ?? null,
    job: ant.job,
    focus: ant.decision.focus ? { ...ant.decision.focus } : null,
  };
}
type DecisionSnapshot = ReturnType<typeof decisionSnapshot>;

type DecisionObserver = (
  world: World,
  ant: Ant,
  candidates: readonly Candidate[],
  request: Request,
  result: ActionResult,
  before: DecisionSnapshot
) => void;

// Harness-only observers are outside persisted state and cannot supply actions.
const observers = new WeakMap<World, Set<DecisionObserver>>();
export function captureDecision(world: World, ant: Ant): DecisionSnapshot | null {
  return observers.has(world) ? decisionSnapshot(ant) : null;
}
export function observeDecisions(world: World, observer: DecisionObserver): () => void {
  const listeners = observers.get(world) ?? new Set<DecisionObserver>();
  listeners.add(observer);
  observers.set(world, listeners);
  return () => {
    listeners.delete(observer);
    if (listeners.size === 0) observers.delete(world);
  };
}

export function reportDecision(
  world: World,
  ant: Ant,
  candidates: readonly Candidate[],
  request: Request,
  result: ActionResult,
  before: DecisionSnapshot | null
): void {
  if (!before) return;
  for (const observer of observers.get(world) ?? [])
    observer(world, ant, candidates, request, result, before);
}

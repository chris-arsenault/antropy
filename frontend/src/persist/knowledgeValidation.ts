import { type Checkpoint2D } from "./checkpoint";
import {
  LOCATION_KINDS,
  REQUESTS,
  RESULTS,
  type DecisionState,
  type KnownLocation,
  type Request,
} from "../sim/colony/contract";
import { validTask } from "../sim/taskMemory";
import { JOB_KINDS } from "../sim/construction/state";

function integer(value: number, minimum = 0): boolean {
  return Number.isSafeInteger(value) && value >= minimum;
}

function validCells(cells: number[], cursor: number, size: number): boolean {
  return (
    Array.isArray(cells) &&
    cells.length > 0 &&
    cells.length <= size &&
    integer(cursor) &&
    cursor < cells.length &&
    cells.every((cell) => integer(cell) && cell < size)
  );
}

function validateRoute(state: DecisionState, checkpoint: Checkpoint2D): void {
  const route = state.route;
  if (!route) return;
  const size = checkpoint.config.width * checkpoint.config.height;
  if (
    !Number.isSafeInteger(route.destination) ||
    !integer(route.revision) ||
    typeof route.offRoute !== "boolean" ||
    !validCells(route.cells, route.cursor, size)
  )
    throw new Error("invalid checkpoint route");
  for (let i = 1; i < route.cells.length; i++) {
    const a = route.cells[i - 1],
      b = route.cells[i],
      width = checkpoint.config.width;
    if (
      a === b ||
      Math.abs((a % width) - (b % width)) > 1 ||
      Math.abs(Math.floor(a / width) - Math.floor(b / width)) > 1
    )
      throw new Error("checkpoint route contains a nonphysical step");
  }
}

function validateDecision(state: DecisionState, checkpoint: Checkpoint2D): void {
  if (
    !state ||
    !RESULTS.includes(state.result) ||
    !Array.isArray(state.registers) ||
    state.registers.length !== 32 ||
    !state.registers.every((v) => Number.isFinite(v) && Math.abs(v) <= 1e6) ||
    !validHistoryShape(state.history)
  )
    throw new Error("invalid checkpoint decision state");
  validateRoute(state, checkpoint);
  validateFocus(state.focus, checkpoint);
  validateHistory(state, checkpoint.tick);
}

function validateFocus(focus: DecisionState["focus"], checkpoint: Checkpoint2D): void {
  if (focus === null) return;
  if (
    !focus ||
    !integer(focus.x) ||
    !integer(focus.y) ||
    focus.x >= checkpoint.config.width ||
    focus.y >= checkpoint.config.height ||
    !integer(focus.since) ||
    focus.since > checkpoint.tick ||
    typeof focus.backed !== "boolean"
  )
    throw new Error("invalid checkpoint private worksite");
}

function validateHistory(state: DecisionState, tick: number): void {
  for (const entry of state.history) {
    if (
      !integer(entry.tick) ||
      entry.tick > tick ||
      !RESULTS.includes(entry.result) ||
      !validRequest(entry.request)
    )
      throw new Error("invalid checkpoint request history");
  }
}

function validHistoryShape(history: DecisionState["history"]): boolean {
  return Array.isArray(history) && history.length <= 4;
}

function validRequest(request: Request): boolean {
  return (
    !!request &&
    REQUESTS.includes(request.kind) &&
    integer(request.heading) &&
    request.heading <= 7 &&
    (request.task === null || validTask(request.task)) &&
    (request.destination === null || Number.isSafeInteger(request.destination)) &&
    validProposal(request)
  );
}

function validProposal(request: Request): boolean {
  if (request.kind !== "propose") return request.proposal === null;
  const proposal = request.proposal;
  return (
    !!proposal &&
    JOB_KINDS.includes(proposal.kind) &&
    Number.isSafeInteger(proposal.dump) &&
    (proposal.source === null || Number.isSafeInteger(proposal.source))
  );
}

function validLocation(location: KnownLocation, checkpoint: Checkpoint2D): boolean {
  return (
    LOCATION_KINDS.includes(location.kind) &&
    integer(location.x) &&
    integer(location.y) &&
    location.x < checkpoint.config.width &&
    location.y < checkpoint.config.height &&
    validLocationQuantity(location) &&
    validObservation(location, checkpoint.tick)
  );
}

function validLocationQuantity(location: KnownLocation): boolean {
  return (
    typeof location.backed === "boolean" &&
    Number.isFinite(location.quantity) &&
    location.quantity >= 0
  );
}

function validObservation(location: KnownLocation, tick: number): boolean {
  return (
    location.observedAt === null || (integer(location.observedAt) && location.observedAt <= tick)
  );
}

export function validateKnowledgeState(checkpoint: Checkpoint2D): void {
  const knowledge = checkpoint.knowledge;
  if (!knowledge || !integer(knowledge.colonyId, 1) || !Array.isArray(knowledge.locations))
    throw new Error("invalid checkpoint colony knowledge");
  const ids = new Set<number>();
  for (const location of knowledge.locations) {
    if (
      !Number.isSafeInteger(location.id) ||
      ids.has(location.id) ||
      !validLocation(location, checkpoint)
    )
      throw new Error("invalid checkpoint known location");
    validateFoodObservation(location);
    ids.add(location.id);
  }
  for (const ant of [...checkpoint.ants, checkpoint.queen])
    validateDecision(ant.decision, checkpoint);
}

function validateFoodObservation(location: KnownLocation): void {
  if (location.kind === "food" && location.observedAt === null)
    throw new Error("food knowledge requires an observation");
}

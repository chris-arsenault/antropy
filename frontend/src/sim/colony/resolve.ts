import { applyActionToAnt, applyDirectedAction } from "../actions";
import { IDLE_ACTION } from "../controller/contract";
import { headingBetween, stepFrom, type Point } from "../geometry";
import { cellIndex, pointAt } from "../grid";
import { foodAt, spend } from "../resources";
import { depositChemical } from "../scent";
import { hungryRecipient, reachableCells } from "../contact";
import { type Ant, type World } from "../types";
import { acquireRoute } from "./routes";
import { type Request, type ActionResult } from "./contract";
import { CONSTRUCTION_REQUESTS, resolveConstruction } from "../construction/resolve";
import { recordTraffic } from "../construction/habitat";
import { COLLECTIVE_REQUESTS, resolveCollective, focusLocation } from "../construction/collective";
import { layEgg } from "../reproduction";
import { canAct, carried } from "../adultBody";
import { observedSiteLocation } from "./reproductiveObservation";

function directed(world: World, ant: Ant, request: Request, heading: number): ActionResult {
  const before = ant.distanceMoved;
  applyDirectedAction(world, ant, heading, { ...IDLE_ACTION, task: request.task, move: true });
  return ant.distanceMoved > before ? "success" : "blocked";
}

function moveRoute(world: World, ant: Ant, request: Request): ActionResult {
  const route = ant.decision.route;
  if (!route) return "no-route";
  if (route.offRoute || route.revision !== world.grid.revision) return "off-route";
  const next = route.cursor + (request.kind === "forward" ? 1 : -1);
  if (next < 0 || next >= route.cells.length) return "arrived";
  const result = directed(
    world,
    ant,
    request,
    headingBetween(ant, pointAt(world.grid, route.cells[next]))
  );
  if (result === "success") route.cursor = next;
  if (result !== "success") return result;
  return [0, route.cells.length - 1].includes(next) ? "arrived" : result;
}

function interaction(world: World, ant: Ant, request: Request): ActionResult {
  const target = stepFrom(ant, request.heading);
  const crop = ant.cargo,
    eaten = world.economy.eaten;
  const action = {
    ...IDLE_ACTION,
    task: request.task,
    eat: request.kind === "eat",
    feed: request.kind === "feed",
    release: request.kind === "deposit",
    mandible: request.kind === "pickup",
  };
  if (request.kind === "pickup" && ant.cargo > 0) {
    applyActionToAnt(world, ant, { ...IDLE_ACTION, task: request.task });
    return "empty";
  }
  applyDirectedAction(world, ant, request.heading, action);
  if (ant.cargo !== crop || world.economy.eaten > eaten) return "success";
  if (request.kind === "deposit") return depositFailure(world, target, crop);
  if (request.kind === "feed")
    return reachableCells(world, ant, request.heading).some((p) => hungryRecipient(world, p))
      ? "empty"
      : "out-of-reach";
  return foodAt(world, target.x, target.y) <= 0 ? "empty" : "out-of-reach";
}

function depositFailure(world: World, target: Point, cargo: number): ActionResult {
  if (cargo <= 0) return "empty";
  return foodAt(world, target.x, target.y) >= world.config.cacheCapacity ? "full" : "out-of-reach";
}

function routeRequest(world: World, ant: Ant, request: Request): ActionResult {
  if (request.kind === "discard") {
    ant.decision.route = null;
    return "success";
  }
  if (request.kind !== "acquire") return moveRoute(world, ant, request);
  const focus = focusLocation(ant);
  const target =
    request.destination === focus?.id
      ? focus
      : (world.knowledge.locations.get(request.destination!) ??
        observedSiteLocation(world, request.destination!));
  if (!target) return "unknown-destination";
  ant.decision.route = acquireRoute(world, ant, target);
  return ant.decision.route ? "success" : "unreachable";
}

function pheromone(world: World, ant: Ant): ActionResult {
  const amount = world.config.chemistry.pheromoneDeposit;
  depositChemical(world.pheromoneA, cellIndex(world.grid, ant.x, ant.y), amount);
  world.metrics.pheromoneDeposited += amount;
  spend(world, ant, amount * world.config.pheromoneCost);
  return "success";
}

const HEADINGS: Partial<Record<Request["kind"], number>> = { up: 2, down: 6, left: 4, right: 0 };

function routeStep(world: World, ant: Ant, request: Request): ActionResult {
  const before = ant.distanceMoved;
  const result = moveRoute(world, ant, request);
  if (before === ant.distanceMoved && result !== "blocked")
    applyActionToAnt(world, ant, { ...IDLE_ACTION, task: request.task });
  return result;
}

function resolve(world: World, ant: Ant, request: Request): ActionResult {
  const heading = HEADINGS[request.kind];
  if (heading !== undefined) {
    const result = directed(world, ant, request, heading);
    const route = ant.decision.route;
    if (route && route.cells[route.cursor] !== cellIndex(world.grid, ant.x, ant.y))
      route.offRoute = true;
    return result;
  }
  if (["pickup", "deposit", "eat", "feed"].includes(request.kind))
    return interaction(world, ant, request);
  if (["forward", "backward"].includes(request.kind)) return routeStep(world, ant, request);
  return stationary(world, ant, request);
}

function stationary(world: World, ant: Ant, request: Request): ActionResult {
  if (request.kind === "lay-egg") {
    applyDirectedAction(world, ant, request.heading, { ...IDLE_ACTION, task: request.task });
    return layEgg(world, ant, request.heading);
  }
  applyActionToAnt(world, ant, { ...IDLE_ACTION, task: request.task });
  if (request.kind === "wait") return "success";
  if (COLLECTIVE_REQUESTS.includes(request.kind)) return resolveCollective(world, ant, request);
  if (request.kind === "pheromone") return pheromone(world, ant);
  if (CONSTRUCTION_REQUESTS.includes(request.kind)) return resolveConstruction(world, ant, request);
  return routeRequest(world, ant, request);
}

export function applyRequest(world: World, ant: Ant, request: Request): ActionResult {
  const restricted =
    carried(world, ant) &&
    !["wait", "eat", "feed", "pheromone", "pheromone-b"].includes(request.kind);
  const result = !canAct(world, ant) || restricted ? "blocked" : resolve(world, ant, request);
  if (
    result === "blocked" &&
    ["up", "down", "left", "right", "forward", "backward"].includes(request.kind)
  )
    recordTraffic(world, ant, request);
  ant.decision.result = result;
  ant.decision.history.push({ tick: world.tick, request: { ...request }, result });
  if (ant.decision.history.length > 4) ant.decision.history.shift();
  return result;
}

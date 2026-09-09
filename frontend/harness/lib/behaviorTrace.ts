import { type World } from "../../src/sim/types";
import { observeDecisions, decisionSnapshot as actor } from "../../src/sim/colony/diagnostics";
import { F, type Candidate } from "../../src/sim/colony/observation";
import { type Request, type ActionResult } from "../../src/sim/colony/contract";
import { isInterior } from "../../src/sim/terrain";
import { cellIndex } from "../../src/sim/grid";
import { captureFrames } from "./behaviorFrames";

function selected(candidates: readonly Candidate[], request: Request): Candidate {
  return candidates.find(
    (c) =>
      c.request.kind === request.kind &&
      c.request.heading === request.heading &&
      c.request.destination === request.destination &&
      c.request.proposal === request.proposal
  )!;
}

function eventKinds(request: Request, result: ActionResult): string[] {
  const kinds = [];
  if (request.kind === "acquire") kinds.push("route-acquired");
  if (request.kind === "pickup" && result === "success") kinds.push("food-collected");
  if (request.kind === "forward" && result === "arrived") kinds.push("route-arrival");
  if (
    [
      "dig",
      "deposit-spoil",
      "recover-spoil",
      "propose",
      "finish",
      "abandon",
      "drop-spoil",
      "remember-site",
      "forget-site",
      "pheromone-b",
    ].includes(request.kind)
  )
    kinds.push("work-action");
  return kinds;
}

function crossings(wasInside: number, inside: boolean, cargo: number): string[] {
  if (Boolean(wasInside) === inside) return [];
  if (!inside) return ["departure"];
  return [cargo > 0 ? "loaded-return" : "empty-return"];
}

/** Complete event records and sampled positions, never inputs to a controller. */
export function traceBehavior(world: World) {
  const events: Record<string, unknown>[] = [];
  const counts: Record<string, number> = {};
  const add = (kind: string, event: Record<string, unknown>) => {
    counts[kind] = (counts[kind] ?? 0) + 1;
    events.push({ tick: world.tick, kind, ...event });
  };
  const detach = observeDecisions(world, (current, ant, candidates, request, result, before) => {
    const after = actor(ant);
    const values = selected(candidates, request).inputs;
    const inside = isInterior(current.grid, cellIndex(current.grid, ant.x, ant.y));
    const details = {
      ant: ant.id,
      before,
      after,
      request,
      result,
      routeKind: values[F.routeKind],
      routeRemaining: values[F.routeRemaining],
      recipient: values[F.anyRecipient],
      targetQuantity: values[F.targetQuantity],
      routeFoodQuantity: values[F.routeFoodQuantity],
      areaBrood: values[F.areaBrood],
      areaFree: values[F.areaFree],
    };
    eventKinds(request, result).forEach((kind) => add(kind, details));
    if (before.focus && ["forward", "up", "down", "left", "right"].includes(request.kind))
      add("work-motion", details);
    if (ant.decision.focus && world.tick % 32 === ant.id % 32)
      add("focus-sample", {
        ...details,
        contacts: candidates
          .filter((c) => c.request.kind === "dig")
          .map((c) => ({
            heading: c.request.heading,
            values: Object.fromEntries(
              [
                "diggable",
                "localBacked",
                "localSupportingBody",
                "localOutdoor",
                "localWork",
                "localFloor",
                "nearFloor",
                "floorBelow",
                "visibleFrontiers",
                "frontierStep",
                "focusDistance",
              ].map((k) => [k, c.inputs[F[k as keyof typeof F]]])
            ),
          })),
      });
    crossings(values[F.inside], inside, ant.cargo).forEach((kind) => add(kind, details));
    if (values[F.routeKind] === 1 && values[F.cargo] === 0 && request.kind === "forward")
      counts["empty-queen-route-steps"] = (counts["empty-queen-route-steps"] ?? 0) + 1;
  });
  return { detach, events, counts, ...captureFrames(world, actor) };
}

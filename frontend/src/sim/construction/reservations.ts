import { type World } from "../types";
import { type Point } from "../geometry";
import { type Request } from "../colony/contract";
import { distance } from "./habitat";

/** Shared work intent includes both destination space and the body/cache being moved. */
export function proposalReserved(
  world: World,
  proposal: NonNullable<Request["proposal"]>,
  site: Point,
  dump: Point
): boolean {
  return world.construction.jobs.some((job) => {
    if (!["pending", "active"].includes(job.status)) return false;
    const sameSource =
      job.kind === proposal.kind &&
      job.source === proposal.source &&
      ["queen", "brood", "move-cache"].includes(job.kind);
    const conflict = [site, dump].some(
      (point) => distance(job, point) <= 1 || (job.kind === "dig" && distance(job.dump, point) <= 1)
    );
    return sameSource || conflict;
  });
}

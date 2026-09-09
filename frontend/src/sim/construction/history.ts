import { type World } from "../types";
import { type ConstructionJob } from "./state";
import { adultBodies } from "../adultBody";

export function removeWorkLandmarks(world: World, job: ConstructionJob): void {
  const ids = [job.id, job.id - 1];
  if (job.recovery !== null) ids.push(job.recovery);
  for (const id of ids) world.knowledge.locations.delete(id);
  for (const ant of adultBodies(world))
    if (ant.decision.route && ids.includes(ant.decision.route.destination))
      ant.decision.route = null;
}

/** Completed requests leave the bounded shared memory after its configured retention period. */
export function expireWorkHistory(world: World): void {
  world.construction.jobs = world.construction.jobs.filter(
    (job) =>
      job.finishedAt === null || world.tick - job.finishedAt <= world.config.knowledgeDuration
  );
}

import { type World } from "../../src/sim/types";

/** Read-only progress evidence for diagnosing long runs without changing a running world. */
export function colonyWorkProgress(world: World) {
  return {
    terrainRevision: world.grid.revision,
    queen: { ...world.queen },
    brood: world.brood.map((body) => ({ ...body })),
    locations: [...world.knowledge.locations.values()].filter((site) => site.kind !== "food"),
    workers: world.ants.map((ant) => ({
      id: ant.id,
      x: ant.x,
      y: ant.y,
      energy: ant.energy,
      cargo: ant.cargo,
      task: ant.task,
      job: ant.job,
      history: structuredClone(ant.decision.history),
      route: ant.decision.route && {
        destination: ant.decision.route.destination,
        cursor: ant.decision.route.cursor,
        length: ant.decision.route.cells.length,
        offRoute: ant.decision.route.offRoute,
        revision: ant.decision.route.revision,
      },
    })),
  };
}

import { type World } from "../sim/types";
import { type BehaviorKind } from "../sim/colony/behavior";

const labels: Record<BehaviorKind, string> = {
  departures: "left nest",
  loadedReturns: "entered with food",
  emptyReturns: "entered empty",
  collections: "picked up food",
  routeChanges: "changed route",
  depletedDepartures: "left depleted target",
  cuts: "excavated soil",
  handoffs: "dropped loose spoil",
  recoveries: "recovered loose spoil",
  spoilPlacements: "placed spoil",
  focusStarts: "remembered worksite",
  focusEnds: "released worksite",
  signals: "emitted work signal",
};

function busiestRoute(world: World): number {
  const targets = new Map<number, number>();
  for (const ant of world.ants) {
    const route = ant.decision.route;
    if (!route) continue;
    const id = route.destination;
    if (
      !route.offRoute &&
      route.revision === world.grid.revision &&
      route.cursor < route.cells.length - 1 &&
      world.knowledge.locations.get(id)?.kind === "food"
    )
      targets.set(id, (targets.get(id) ?? 0) + 1);
  }
  return Math.max(0, ...targets.values());
}

export function BehaviorPanel({ world }: { readonly world: World }) {
  const c = world.behavior.counts;
  const peak = busiestRoute(world);
  const recent = world.behavior.recent
    .filter((e) => !["routeChanges", "signals"].includes(e.kind))
    .slice(-4)
    .reverse();
  return (
    <section className="panel" data-testid="behavior-panel">
      <h2>Worker behavior</h2>
      <dl className="metrics">
        <div>
          <dt>Nest entries loaded / empty</dt>
          <dd>
            {c.loadedReturns} / {c.emptyReturns}
          </dd>
        </div>
        <div>
          <dt>Most ants on one food route</dt>
          <dd>{peak}</dd>
        </div>
        <div>
          <dt>Departed depleted targets</dt>
          <dd>{c.depletedDepartures}</dd>
        </div>
        <div>
          <dt>Workers retaining worksites</dt>
          <dd>{world.ants.filter((a) => a.decision.focus !== null).length}</dd>
        </div>
        <div>
          <dt>Loose spoil drops / recoveries</dt>
          <dd data-testid="spoil-handoffs">
            {c.handoffs} / {c.recoveries}
          </dd>
        </div>
        <div>
          <dt>Loose spoil waiting</dt>
          <dd>{[...world.construction.loose.values()].reduce((n, p) => n + p.length, 0)}</dd>
        </div>
        <div>
          <dt>Work signals deposited</dt>
          <dd>{c.signals}</dd>
        </div>
      </dl>
      <p>Purple squares show remembered worksites. Soil-coloured piles are loose spoil.</p>
      {recent.map((e, i) => (
        <p key={`${e.tick}-${e.ant}-${i}`}>
          Tick {e.tick} · ant {e.ant} · {labels[e.kind]} · ({e.x}, {e.y})
        </p>
      ))}
    </section>
  );
}

import { type Ant, type World } from "../sim/types";
import { isKnowledgeScenario } from "../sim/colony/contract";
import { OBSERVATION_NAMES } from "../sim/colony/observation";

export function KnowledgePanel({ world, ant }: { readonly world: World; readonly ant: Ant }) {
  if (!isKnowledgeScenario(world.scenario)) return null;
  const route = ant.decision.route;
  return (
    <>
      <details className="inspector-block" open>
        <summary>Route and recent requests</summary>
        <WorkerLoad world={world} ant={ant} />
        <p>
          Destination {route?.destination ?? "none"} · {ant.decision.result}
        </p>
        {route && (
          <p>
            {route.cursor} / {route.cells.length - 1} steps ·{" "}
            {route.offRoute || route.revision !== world.grid.revision ? "off route" : "on route"}
          </p>
        )}
        {ant.decision.history.map((entry, i) => (
          <div className="inspector-row" key={i}>
            <span>
              {entry.tick}: {entry.request.kind} {entry.request.destination ?? ""}
            </span>
            <span>
              {entry.result} · task {entry.request.task ?? "keep"}
            </span>
          </div>
        ))}
      </details>
      <details className="inspector-block" open>
        <summary>
          Colony {world.knowledge.colonyId} knowledge ({world.knowledge.locations.size})
        </summary>
        {[...world.knowledge.locations.values()].map((location) => (
          <div className="inspector-row" key={location.id}>
            <span>
              #{location.id} {location.kind} ({location.x}, {location.y})
            </span>
            <span>
              {location.observedAt === null
                ? "landmark"
                : `${location.quantity.toFixed(2)} · ${world.tick - location.observedAt} ticks ago`}
            </span>
          </div>
        ))}
      </details>
      {world.linearGenome && (
        <details className="inspector-block">
          <summary>Linear program ({world.linearGenome.instructions.length} instructions)</summary>
          <p>r0: score · r1: task write · r24–31: private persistent registers</p>
          <pre>
            {ant.decision.registers.map((value, i) => `r${i}: ${value.toFixed(3)}`).join("\n")}
          </pre>
          <details>
            <summary>Input indices</summary>
            <pre>{OBSERVATION_NAMES.map((name, i) => `${i}: ${name}`).join("\n")}</pre>
          </details>
          <pre>
            {world.linearGenome.instructions
              .map(
                (instruction, i) =>
                  `${i}: ${instruction.op} r${instruction.out} r${instruction.a} r${instruction.b} ${instruction.value}`
              )
              .join("\n")}
          </pre>
        </details>
      )}
    </>
  );
}

function WorkerLoad({ world, ant }: { readonly world: World; readonly ant: Ant }) {
  return (
    <p>
      Work request {ant.job ?? "none"} · spoil {ant.spoil ?? "none"} · queen carrier{" "}
      {world.queen.carrier === ant.id ? "yes" : "no"}
    </p>
  );
}

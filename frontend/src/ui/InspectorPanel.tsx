import { INPUT_NAMES, type Action } from "../sim/controller/contract";
import { type World } from "../sim/types";
import { useState } from "react";
import { ColonySensePanel } from "./ColonySensePanel";
import { TaskMemoryPanel } from "./TaskMemoryPanel";
import { KnowledgePanel } from "./KnowledgePanel";
import { isKnowledgeScenario } from "../sim/colony/contract";
import { adultBodies, canAct } from "../sim/adultBody";

function format(value: number): string {
  return Math.abs(value) >= 0.001 ? value.toFixed(3) : value.toExponential(1);
}

function ValueRow({ label, value }: { readonly label: string; readonly value: string | number }) {
  return (
    <div className="inspector-row">
      <span className="inspector-key">{label}</span>
      <span className="inspector-value">{value}</span>
    </div>
  );
}

function actionRows(action: Action): readonly [string, string | number][] {
  return [
    ["turn", action.turn],
    ["move", String(action.move)],
    ["mandible", String(action.mandible)],
    ["pheromone A", format(action.pheromoneA)],
    ["pheromone B", format(action.pheromoneB)],
    ["eat", String(Boolean(action.eat))],
    ["feed", String(Boolean(action.feed))],
    ["release", String(Boolean(action.release))],
    ["task write", action.task ?? "keep"],
  ];
}

export function InspectorPanel({
  world,
  onTask,
}: {
  readonly world: World;
  readonly onTask: (id: number, value: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const adults = adultBodies(world).filter((ant) => canAct(world, ant));
  if (adults.length === 0)
    return (
      <aside className="inspector" data-testid="inspector">
        No living ants
      </aside>
    );
  const ant = adults.find((candidate) => candidate.id === selectedId) ?? adults[0];
  return (
    <aside className="inspector" data-testid="inspector">
      <div className="inspector-header">
        <label>
          Ant{" "}
          <select value={ant.id} onChange={(event) => setSelectedId(Number(event.target.value))}>
            {adults.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.caste} #{worker.id}
              </option>
            ))}
          </select>
        </label>
        <span>{world.scenario}</span>
      </div>
      <ValueRow label="position" value={`${ant.x}, ${ant.y}`} />
      <ValueRow label="heading" value={ant.heading} />
      <ValueRow label="energy" value={format(ant.energy)} />
      <ValueRow label="crop quantity" value={format(ant.cargo)} />
      <ValueRow label="crop energy" value={format(ant.cargo * world.config.foodEnergyDensity)} />
      <ValueRow label="age" value={ant.age} />
      <TaskMemoryPanel
        key={ant.id}
        ant={ant}
        overrides={world.taskOverrides}
        maximum={(world.registeredController?.tasks ?? 256) - 1}
        onTask={onTask}
      />
      <ColonySensePanel world={world} ant={ant} />
      <KnowledgePanel world={world} ant={ant} />
      <details className="inspector-block" open>
        <summary>Outputs</summary>
        {actionRows(ant.lastAction).map(([label, value]) => (
          <ValueRow key={label} label={label} value={value} />
        ))}
      </details>
      <details className="inspector-block">
        <summary>Inputs ({INPUT_NAMES.length})</summary>
        {INPUT_NAMES.map((label, index) => (
          <ValueRow key={label} label={label} value={format(ant.lastInputs[index])} />
        ))}
      </details>
      {!isKnowledgeScenario(world.scenario) && (
        <details className="inspector-block">
          <summary>Controller state ({ant.controllerState.length})</summary>
          {Array.from(ant.controllerState).map((value, index) => (
            <ValueRow key={index} label={`h${index}`} value={format(value)} />
          ))}
        </details>
      )}
    </aside>
  );
}

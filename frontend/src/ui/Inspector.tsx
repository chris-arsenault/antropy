import { useState } from "react";
import { type World } from "../sim/types";
import { SENSOR_NAMES } from "../sim/interface";
import { controller } from "../sim/controller";
import { overrideTask } from "../sim/events";
import { GeneInspector } from "./GeneInspector";
import { structuralMass } from "../sim/body";

export function Inspector({
  world,
  selected,
  onChange,
}: {
  world: World;
  selected: number | null;
  onChange: () => void;
}) {
  const cell = world.cells.find((c) => c.id === selected);
  if (!cell)
    return (
      <section className="panel">
        <h2>Cell inspector</h2>
        <p>Click a living cell. Colors identify founder lineages.</p>
      </section>
    );
  return (
    <section className="panel">
      <h2>Cell {cell.id}</h2>
      <p>
        Generation {cell.generation} · genotype {cell.genome} · parent {cell.parent ?? "founder"}
      </p>
      <p>
        Task byte <strong>{cell.brain.task}</strong> · reserve {cell.energy.toFixed(3)} · biomass{" "}
        {structuralMass(cell.body).toFixed(3)} · stored food {cell.reserve.toFixed(3)}
      </p>
      <table>
        <thead>
          <tr>
            <th>Last input</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {SENSOR_NAMES.map((name, i) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{cell.inputs[i].toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Resolved swim {cell.action.swim.toFixed(3)} · turn {cell.action.turn.toFixed(3)} · release{" "}
        {cell.action.secrete.toFixed(3)}
      </p>
      <details>
        <summary>Recurrent state and task history</summary>
        <pre>
          {controller
            .inspectState(cell.brain)
            .map((v) => v.toFixed(3))
            .join(" ")}
        </pre>
        <pre>
          {JSON.stringify(
            {
              recent: world.events.filter((e) => e.cell === cell.id).slice(-16),
              interventions: world.interventions.filter((e) => e.cell === cell.id),
            },
            null,
            2
          )}
        </pre>
      </details>
      <TaskOverride world={world} id={cell.id} onChange={onChange} />
      <GeneInspector world={world} cell={cell} />
    </section>
  );
}

function TaskOverride({ world, id, onChange }: { world: World; id: number; onChange: () => void }) {
  const [task, setTask] = useState("0"),
    [message, setMessage] = useState("");
  return (
    <details>
      <summary>Diagnostic task override</summary>
      <label>
        Byte{" "}
        <input
          type="number"
          min="0"
          max="255"
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />
      </label>
      <button
        onClick={() => {
          try {
            overrideTask(world, id, Number(task));
            onChange();
            setMessage("Override recorded");
          } catch (e) {
            setMessage(String(e));
          }
        }}
      >
        Set byte
      </button>
      <p role="status">{message}</p>
    </details>
  );
}

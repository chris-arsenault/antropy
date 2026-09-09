import { type Ant } from "../sim/types";

interface Props {
  readonly ant: Ant;
  readonly overrides: number;
  readonly maximum: number;
  readonly onTask: (id: number, value: number) => void;
}

export function TaskMemoryPanel({ ant, overrides, maximum, onTask }: Props) {
  return (
    <details className="inspector-block" open>
      <summary>Task register: {ant.task}</summary>
      <p>
        Held for {ant.taskAge} decisions · {ant.taskChanges} changes
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = Number(new FormData(event.currentTarget).get("task"));
          onTask(ant.id, value);
        }}
      >
        <label>
          Diagnostic value{" "}
          <input
            name="task"
            type="number"
            min={0}
            max={maximum}
            step={1}
            defaultValue={ant.task}
            required
          />
        </label>
        <button type="submit">Set task</button>
      </form>
      {overrides > 0 && <p>{overrides} manual task writes. This run is diagnostic.</p>}
    </details>
  );
}

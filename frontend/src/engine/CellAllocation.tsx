import { type CellState } from "./types";
import { type ControlView } from "./controlTypes";
import { Table, numberText as n } from "./Table";

const LABELS = [
  ...Array.from({ length: 4 }, (_, i) => `Transporter ${i}`),
  ...Array.from({ length: 8 }, (_, i) => `Enzyme ${i}`),
  "Cover builder",
  "Emitter",
];

export function CellAllocation({ cell, control }: { cell: CellState; control: ControlView }) {
  const learned = control.activityReinforcement;
  if (!learned) return null;
  return (
    <details>
      <summary>Experience-dependent allocation · {learned.enabled ? "active" : "held off"}</summary>
      <p>
        Accepted activity reinforces response while learning is paid; inactivity relaxes it. Shared
        rate {n(learned.rate)} per paid model second, bias gain {n(learned.gain)}. These tendencies
        do not measure an action’s benefit.
      </p>
      <Table
        columns={["Actuator", "Accepted activity", "Response state", "Acquired bias"]}
        rows={learned.ports.map(([input], i) => [
          LABELS[i],
          n(cell.inputs[input]),
          n(learned.state[i]),
          n(learned.bias[i]),
        ])}
      />
    </details>
  );
}

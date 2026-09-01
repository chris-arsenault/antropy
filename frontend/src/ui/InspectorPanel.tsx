import { type Ant } from "../sim/ant";
import { type Controller } from "../sim/controller/contract";
import { TRAIT_KEYS, TRAIT_LABELS } from "../sim/stats";

interface InspectorPanelProps {
  ant: Ant | null;
  controller: Controller;
  onClose(): void;
}

const INPUT_LABELS = [
  "phA L",
  "phA R",
  "phB L",
  "phB R",
  "food L",
  "food R",
  "energy",
  "age",
  "load",
  "carried",
  "scale",
  "depth",
  "slope",
  "solid",
  "crowd",
  "c.food",
  "c.egg",
  "c.ant",
  "fall",
  "bias",
  "nest L",
  "nest R",
  "home ∠",
  "home d",
];

const OUTPUT_LABELS = ["turn", "fwd", "vert", "eat", "dig", "phA", "phB", "egg"];

function ValueRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="inspector-row">
      <span className="inspector-key">{label}</span>
      <span className="inspector-value">{value.toFixed(2)}</span>
    </div>
  );
}

function VectorBlock({
  title,
  labels,
  values,
}: {
  title: string;
  labels: string[];
  values: readonly number[];
}) {
  return (
    <details className="inspector-block">
      <summary>{title}</summary>
      {labels.map((label, i) => (
        <ValueRow key={label} label={label} value={values[i] ?? 0} />
      ))}
    </details>
  );
}

/** Selected-ant inspector (spec §11.4): live inputs, outputs, hidden state. */
export function InspectorPanel({ ant, controller, onClose }: InspectorPanelProps) {
  if (!ant) {
    return null;
  }
  const hidden = controller.inspectState(ant.controllerState);
  return (
    <aside className="inspector" data-testid="inspector">
      <div className="inspector-header">
        <strong>Ant #{ant.id}</strong>
        <button type="button" onClick={onClose}>
          ×
        </button>
      </div>
      <ValueRow label="patriline" value={ant.patrilineId} />
      <ValueRow label="age" value={ant.age} />
      <ValueRow label="energy" value={ant.energy} />
      <ValueRow label="body" value={ant.bodyScale} />
      <ValueRow label="deliveries" value={ant.deliveries} />
      <details className="inspector-block">
        <summary>Traits</summary>
        {TRAIT_KEYS.map((key, i) => (
          <ValueRow key={key} label={TRAIT_LABELS[i]} value={ant.traits[key]} />
        ))}
      </details>
      <VectorBlock title="Inputs" labels={INPUT_LABELS} values={Array.from(ant.lastInputs)} />
      <VectorBlock title="Outputs" labels={OUTPUT_LABELS} values={Array.from(ant.lastOutputs)} />
      <VectorBlock title="Hidden state" labels={hidden.map((_, i) => `h${i}`)} values={hidden} />
    </aside>
  );
}

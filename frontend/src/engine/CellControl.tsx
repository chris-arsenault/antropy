import { type Bridge } from "./bridge";
import { type Inspection } from "./types";
import { Table, numberText as n } from "./Table";
import { STRATEGIC_INPUTS, CONTEXT_COLUMNS, HEARING_COLUMNS, INPUT_COLUMNS } from "./controlLabels";

export function CellControl({
  inspection: p,
  bridge,
  error,
}: {
  inspection: Inspection;
  bridge: Bridge;
  error: (e: unknown) => void;
}) {
  const cell = p.cell,
    control = p.control;
  if (!cell || !control) return null;
  return (
    <details open>
      <summary>Speech and strategic control</summary>
      <p>
        Mouth {n(cell.body[22])} · ear {n(cell.body[23])}. Last neural proposal: byte{" "}
        {cell.action.speech}, effort {n(cell.action.speechEffort)}. This tick:{" "}
        {cell.flows.utterances} funded utterances, {n(cell.flows.speechWork)} work,{" "}
        {cell.flows.heard} received events. Proposals emit once per scheduled evaluation when
        affordable.
      </p>
      <Table
        columns={CONTEXT_COLUMNS}
        rows={control.context.map((value, i) => [
          i,
          n(value),
          n(control.generatedContext[i]),
          n(control.contextMean[i]),
          n(control.neighbors[i]),
        ])}
      />
      <p>
        Reflex learning gain {n(control.learningGain)}× · contact display coverage{" "}
        {n(control.neighborCoverage)}. Strategic clock {n(control.elapsed)} / {n(control.interval)}{" "}
        model seconds; {control.evaluations} evaluations. Long memory {n(control.longTime)} seconds.
        Hidden retention {n(Math.min(...control.retention))}–{n(Math.max(...control.retention))}.
      </p>
      <Hearing values={control.hearing} pending={control.pendingHearing} />
      {bridge.getSnapshot().status?.execution?.operator !== false && (
        <button
          aria-pressed={control.clamped}
          onClick={() =>
            bridge
              .call("strategyAblation", {
                cell: cell.id,
                enabled: !control.clamped,
              })
              .catch(error)
          }
        >
          {control.clamped ? "Restore generated context" : "Clamp context to this cell’s long mean"}
        </button>
      )}
      <details>
        <summary>Last strategic evaluation · 61 local and history inputs</summary>
        <Table
          columns={INPUT_COLUMNS}
          rows={STRATEGIC_INPUTS.map((label, i) => [label, n(control.strategicInputs[i])])}
        />
      </details>
    </details>
  );
}

function Hearing({ values, pending }: { values: number[]; pending: number[] }) {
  const activity = values[0];
  const coherence = activity > 0 ? Math.hypot(values[1], values[2]) / activity : 0;
  return (
    <details>
      <summary>
        Hearing · activity {n(activity)} · bearing coherence {n(coherence)}
      </summary>
      <p>
        Listener-relative moments at the last reflex evaluation. Positive activity with zero bearing
        means an ambiguous direction. Pending activity {n(pending[0])} waits for the next
        evaluation; these mixtures do not reconstruct individual speakers or words.
      </p>
      <Table
        columns={HEARING_COLUMNS}
        rows={Array.from({ length: 9 }, (_, i) => [
          i === 0 ? "Activity" : `Bit ${i - 1}`,
          ...values.slice(i * 3, i * 3 + 3).map(n),
        ])}
      />
    </details>
  );
}

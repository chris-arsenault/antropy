import { useState } from "react";
import { type Bridge } from "./bridge";
import { type RecoverySummary, type ReservoirInspection } from "./recoveryTypes";

export function RecoveryPanel({
  recovery,
  count,
  bridge,
  error,
}: {
  recovery: RecoverySummary;
  count: number;
  bridge: Bridge;
  error: (e: unknown) => void;
}) {
  const [source, setSource] = useState(0),
    [pending, setPending] = useState(false),
    [inspection, setInspection] = useState<ReservoirInspection | null>(null);
  function inspect() {
    setPending(true);
    bridge
      .call<ReservoirInspection>("inspectReservoir", { source })
      .then(setInspection)
      .catch(error)
      .finally(() => setPending(false));
  }
  return (
    <details>
      <summary>Mortality recovery and reservoir inventory</summary>
      <p>
        Recovery {recovery.enabled ? "enabled" : "disabled"}. Recent net loss{" "}
        {recovery.severity.toFixed(3)}; response {(100 * recovery.response).toFixed(1)}% of locally
        capturable body material.
      </p>
      <dl className="metrics">
        {[
          ["Dead body material", recovery.deadBody],
          ["Recovered into reservoirs", recovery.recovered],
          ["Death material spilled locally", recovery.spill],
          ["Stored reservoir material", recovery.storedMaterial],
          ["Recent recovery admissions", recovery.recentRecovery],
          ["Actual reservoir release · lifetime", recovery.releasedMaterial],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt>{label}</dt>
            <dd>{Number(value).toFixed(3)}</dd>
          </div>
        ))}
      </dl>
      <p>
        Recovery transfers existing body chemistry. Stored material and release do not measure
        survivor uptake. Recent admissions and output use the physical loss-memory clock. Death
        counters restart after explicit population interventions.
      </p>
      <fieldset disabled={pending || count === 0}>
        <label>
          Reservoir index{" "}
          <input
            type="number"
            min={0}
            max={Math.max(0, count - 1)}
            step={1}
            value={source}
            onChange={(e) => setSource(Number(e.target.value))}
          />
        </label>
        <button onClick={inspect}>Read reservoir</button>
      </fieldset>
      {inspection && <ReservoirDetails value={inspection} />}
    </details>
  );
}
function ReservoirDetails({ value: s }: { value: ReservoirInspection }) {
  return (
    <div>
      <p>
        Reservoir {s.source} at ({s.position.map((n) => n.toFixed(1)).join(", ")}), sampled at tick{" "}
        {s.tick}.
      </p>
      <dl className="metrics">
        {[
          ["Stored material", s.storedMaterial],
          ["Recent admitted recovery", s.recentRecovery],
          ["Measured recent output / model second", s.recentOutputRate],
          ["Actual released material", s.releasedMaterial],
          ["Elapsed physically empty supply time", s.emptyElapsed],
          ["Nominal release ceiling", s.nominalRate],
          ["Local supply multiplier", s.season],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt>{label}</dt>
            <dd>{Number(value).toFixed(3)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

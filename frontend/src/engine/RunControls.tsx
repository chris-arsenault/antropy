import { type Bridge } from "./bridge";
import { type LiveStatus } from "./types";
import { SPEEDS } from "../ui/pacing";

export function RunControls({
  bridge,
  status: s,
  error,
}: {
  bridge: Bridge;
  status: LiveStatus | null;
  error: (e: unknown) => void;
}) {
  return (
    <div className="run-controls">
      <button
        className="primary"
        disabled={!s || !!s.summary.stopReason}
        onClick={() => bridge.call("running", { value: !s?.running }).catch(error)}
      >
        {s?.running ? "Pause" : "Run"}
      </button>
      <button disabled={!s || s.running} onClick={() => bridge.call("step").catch(error)}>
        Step
      </button>
      <label>
        Speed{" "}
        <select
          disabled={!s}
          value={s?.speed ?? 30}
          onChange={(e) =>
            bridge
              .call("speed", {
                value: e.target.value === "max" ? "max" : Number(e.target.value),
              })
              .catch(error)
          }
        >
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed === "max" ? "Maximum" : `${speed} ticks/s`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function WorldStatus({ status }: { status: LiveStatus | null }) {
  if (!status) return <div className="world-status">Loading world…</div>;
  const running = status.running;
  return (
    <div className="world-status">
      <span className={running ? "running-state is-running" : "running-state"}>
        {running ? "Running" : "Paused"}
      </span>
      <span>
        Tick <strong>{status.summary.tick.toLocaleString()}</strong>
      </span>
      <span>
        <strong>{status.summary.population.toLocaleString()}</strong> cells
      </span>
      <span className="throughput">
        <strong>{status.throughput.toFixed(0)}</strong> ticks/s
      </span>
    </div>
  );
}

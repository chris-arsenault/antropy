import { useState } from "react";
import { type LiveStatus } from "./types";

export function SpatialTimeline({
  status,
  focus,
}: {
  status: LiveStatus;
  focus: (x: number, y: number) => void;
}) {
  const [tick, setTick] = useState("");
  const frame = status.history.find((p) => String(p.tick) === tick);
  return (
    <details className="map-legend">
      <summary>Browse retained spatial samples</summary>
      <label>
        Observation tick{" "}
        <select value={tick} onChange={(e) => setTick(e.target.value)}>
          <option value="">Choose a retained sample</option>
          {status.history.map((p) => (
            <option key={p.tick} value={p.tick}>
              {p.tick.toLocaleString()}
            </option>
          ))}
        </select>
      </label>
      <p>
        Sampled locations refer to that time; the map shows the current world. Older samples are
        thinned, and each retains at most 64 regions.
      </p>
      {frame && (
        <div>
          <p>
            {frame.population} living cells · {frame.divisions} cumulative divisions ·{" "}
            {frame.deaths} deaths · {frame.regionCount} occupied regions
          </p>
          <ul>
            {frame.regions.map((r) => (
              <li key={r.id}>
                Population {r.id} · {r.count} cells · membrane X {r.membraneX.toFixed(1)}{" "}
                <button onClick={() => focus(r.x, r.y)}>Show sampled location</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tick && !frame && <p>This sample has left the retained history during thinning.</p>}
    </details>
  );
}

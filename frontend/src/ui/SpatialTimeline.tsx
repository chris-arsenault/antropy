import { useState } from "react";
import { type World } from "../sim/types";
import { spatialHistory } from "../observe/spatialHistory";

export function SpatialTimeline({
  world,
  onFocus,
}: {
  world: World;
  onFocus: (x: number, y: number) => void;
}) {
  const [tick, setTick] = useState("");
  const h = spatialHistory(world);
  const frame = h.frames.find((f) => String(f.tick) === tick);
  return (
    <details>
      <summary>Browse retained spatial samples</summary>
      <label>
        Observation tick{" "}
        <select value={tick} onChange={(e) => setTick(e.target.value)}>
          <option value="">Choose a retained sample</option>
          {h.frames.map((f) => (
            <option key={f.tick} value={f.tick}>
              {f.tick.toLocaleString()}
            </option>
          ))}
        </select>
      </label>
      <p>
        Locations refer to the sampled time; the map continues to show the current world. A
        dissolved group can leave surviving cells. Founding marks a descendant birth observed in a
        group, inferred from ancestry; the 25-tick samples do not establish its exact birthplace or
        lasting establishment.
      </p>
      {frame && (
        <div>
          <p>
            {frame.population} living cells · {frame.births} cumulative births · {frame.deaths}{" "}
            deaths · {frame.dispersers} ungrouped
          </p>
          <ul>
            {frame.regions.map((r) => (
              <li key={r.id}>
                Population {r.id} · {r.count} cells · A allocation {r.foodA.toFixed(1)}%{" "}
                <button onClick={() => onFocus(r.x, r.y)}>Show sampled location</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tick && !frame && <p>This sample has left the retained history during thinning.</p>}
    </details>
  );
}

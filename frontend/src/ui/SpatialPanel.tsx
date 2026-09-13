import { type World } from "../sim/types";
import { spatialHistory } from "../observe/spatialHistory";
import { SpatialTimeline } from "./SpatialTimeline";
import "./populationObservation.css";

interface SpatialProps {
  world: World;
  selected: number | null;
  onSelect: (id: number | null) => void;
  onFocus: (x: number, y: number) => void;
}

export function SpatialPanel({ world, selected, onSelect, onFocus }: SpatialProps) {
  const h = spatialHistory(world);
  const region = h.regions.find((r) => r.id === selected);
  const frame = h.frames[h.frames.length - 1];
  return (
    <div className="spatial-panel">
      <p>
        {h.regions.length} occupied regions · {frame?.dispersers ?? world.cells.length} ungrouped
        cells
      </p>
      <label>
        Local population{" "}
        <select
          value={selected ?? ""}
          onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Select on the map</option>
          {h.regions.map((r) => (
            <option key={r.id} value={r.id}>
              Population {r.id} · {r.members.length} cells
            </option>
          ))}
        </select>
      </label>
      {region && (
        <div>
          <button onClick={() => onFocus(region.x, region.y)}>Inspect population</button>
          <p>
            {region.members.length} cells · {region.lineages.length} founder ancestries · inherited
            A allocation {region.foodA.toFixed(1)}%
          </p>
          <p>
            First observed at tick {region.born.toLocaleString()}.
            {region.established === null
              ? " No subsequent descendant birth recorded yet."
              : ` Descendant birth observed by tick ${region.established.toLocaleString()}.`}
            {region.origins.length > 0 && ` Connected to populations ${region.origins.join(", ")}.`}
          </p>
        </div>
      )}
      <details>
        <summary>Spatial history · {h.frames.length} retained samples</summary>
        <p>
          Groups follow nearby cells, not species. Sampling: 25 ticks; older samples are thinned.
          {h.eventsDropped > 0 &&
            ` ${h.eventsDropped} older events are outside this retained window.`}
        </p>
        <ol>
          {h.events
            .filter(
              (e) => selected === null || e.population === selected || e.others.includes(selected)
            )
            .slice(-12)
            .reverse()
            .map((e, i) => (
              <li key={`${e.tick}-${i}`}>
                Tick {e.tick.toLocaleString()}: population {e.population} · {e.kind}
                {e.others.length > 0 && ` · connected to ${e.others.join(", ")}`}
                {` · ${e.cells} cells`}
                <button onClick={() => onFocus(e.x, e.y)}>Show location</button>
              </li>
            ))}
        </ol>
      </details>
      <SpatialTimeline world={world} onFocus={onFocus} />
    </div>
  );
}

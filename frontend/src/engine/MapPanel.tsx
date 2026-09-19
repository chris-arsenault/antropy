import { useState } from "react";
import { type ViewState } from "./bridge";
import { SpatialTimeline } from "./SpatialTimeline";
import { type ChemicalDisplay } from "./chemicalDisplay";
import { ChemicalControls, ChemicalLegend } from "./ChemicalControls";

const COLORS = [
  "Transporter / membrane coordinates",
  "Founder ancestry",
  "Genotype",
  "Usable energy",
  "Task byte",
  "Recent families",
  "Membrane compatibility X",
  "Membrane compatibility Y",
  "Inherited motor investment",
  "Inherited import investment",
  "Inherited enzyme investment",
  "Relatives of selected cell",
  "Physical genes vs selected",
  "Controller genes vs selected",
  "Enzyme input",
  "Enzyme output",
];

export function MapPanel({
  view,
  chemistry,
  setChemistry,
  color,
  setColor,
  regions,
  setRegions,
  sources,
  setSources,
  focus,
}: {
  view: ViewState;
  chemistry: ChemicalDisplay;
  setChemistry: (v: ChemicalDisplay) => void;
  color: number;
  setColor: (v: number) => void;
  regions: boolean;
  setRegions: (v: boolean) => void;
  sources: boolean;
  setSources: (v: boolean) => void;
  focus: (x: number, y: number) => void;
}) {
  const bounds = view.definition?.config ?? { width: 320, height: 240 };
  return (
    <>
      <div className="map-tools">
        <label>
          Cell colors{" "}
          <select value={color} onChange={(e) => setColor(Number(e.target.value))}>
            {COLORS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={regions} onChange={(e) => setRegions(e.target.checked)} />{" "}
          Population regions
        </label>
        <label>
          <input type="checkbox" checked={sources} onChange={(e) => setSources(e.target.checked)} />{" "}
          Source sites
        </label>
      </div>
      <ChemicalControls value={chemistry} change={setChemistry} />

      <ChemicalLegend value={chemistry} />
      <Regions view={view} focus={focus} />
      {view.status && <SpatialTimeline status={view.status} focus={focus} />}
      <details>
        <summary>Reading the map</summary>
        <MapLegend bounds={bounds} color={color} />
      </details>
    </>
  );
}

function MapLegend({
  bounds,
  color,
}: {
  bounds: { width: number; height: number };
  color: number;
}) {
  return (
    <div className="map-legend">
      <p>
        Drag to pan · wheel to zoom at pointer · click a cell to inspect. Opposite edges connect.
      </p>
      <p>
        World: {bounds.width} × {bounds.height} units. {colorLegend(color)}
      </p>
      <p>
        Soft groups resolve into individual cells at closer zoom. Color describes inherited
        chemistry, ancestry or state; it does not establish adaptation.
      </p>
      <p>
        Source rings: bright with a center cross while releasing; dim and dashed while dormant.
        Rings mark source size, not resource boundaries. White cell rims mark selection or a recent
        birth; close-up crosses mark recent deaths.
      </p>
    </div>
  );
}
function colorLegend(color: number) {
  if (color === 14 || color === 15)
    return (
      "Chemical hue of the strongest installed enzyme route's " +
      (color === 14 ? "input" : "output") +
      ". Gray: no funded conversion. Explore counts and routes in Web."
    );
  const scales: Record<number, string> = {
    3: "Blue to amber: empty to full usable energy.",
    6: "Blue to amber: membrane X from 0 to 15.",
    7: "Blue to amber: membrane Y from 0 to 15.",
    8: "Blue to amber: motor target from 0 to 16% of core.",
    9: "Blue to amber: import target from 0 to 32% of core.",
    10: "Blue to amber: enzyme target from 0 to 32% of core.",
    11: "Blue to amber: 0 to 16 parent links from the selected cell; gray means a different founder.",
    12: "Blue to amber: physical gene RMS difference 0 to 0.1; gray means no available reference.",
    13: "Blue to amber: controller RMS difference 0 to 0.01; gray means no available reference.",
  };
  return (
    scales[color] ??
    "Hue identifies the selected category; hue distance is not evolutionary distance."
  );
}
function Regions({ view, focus }: { view: ViewState; focus: (x: number, y: number) => void }) {
  const [selected, setSelected] = useState(0),
    status = view.status;
  if (!status) return null;
  const r = status.regions.find((v) => v.id === selected);
  const grouped = status.regions.reduce((sum, region) => sum + region.count, 0);
  return (
    <div className="map-legend">
      <p>
        {status.regions.length} occupied regions ·{" "}
        {Math.max(0, status.summary.population - grouped)} ungrouped cells at the last 25-tick
        sample
      </p>
      <label>
        Local population{" "}
        <select value={r?.id ?? 0} onChange={(e) => setSelected(Number(e.target.value))}>
          <option value={0}>Select a population</option>
          {status.regions.map((region) => (
            <option key={region.id} value={region.id}>
              Population {region.id} · {region.count} cells
            </option>
          ))}
        </select>
      </label>
      {r && (
        <>
          <button onClick={() => focus(r.x, r.y)}>Inspect population</button>
          <p>
            First observed at tick {r.born}.{" "}
            {r.established === null
              ? "No later descendant birth observed yet."
              : `Descendant birth observed by tick ${r.established}.`}{" "}
            Connections: {r.origins.join(", ") || "none recorded"}.
          </p>
        </>
      )}
      <details>
        <summary>
          Spatial history · {status.eventsDropped} events outside the retained window
        </summary>
        <p>
          Groups use proximity, not species. A recorded founding means a descendant birth was
          observed locally; it does not establish enduring colonization.
        </p>
        <ol>
          {status.spatialEvents
            .filter((e) => !selected || e.population === selected || e.others.includes(selected))
            .slice(-12)
            .reverse()
            .map((e, i) => (
              <li key={i}>
                Tick {e.tick}: population {e.population} · {e.kind} · {e.cells} cells{" "}
                <button onClick={() => focus(e.x, e.y)}>Show location</button>
              </li>
            ))}
        </ol>
      </details>
    </div>
  );
}

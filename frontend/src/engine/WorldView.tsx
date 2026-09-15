import { useEffect, useRef, useState } from "react";
import { type Bridge, type ViewState } from "./bridge";
import { fitCamera, type Camera } from "./camera";
import { mountCanvas, type CanvasState } from "./canvas";
import { SpatialTimeline } from "./SpatialTimeline";
import { chemicalLayers, type ChemicalDisplay } from "./chemicalDisplay";
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
];
const INITIAL_BOUNDS = { width: 320, height: 240 };

function useCanvas(
  bridge: Bridge,
  state: CanvasState,
  setCamera: (c: Camera) => void,
  error: (e: unknown) => void
) {
  const host = useRef<HTMLDivElement>(null),
    current = useRef({ state, setCamera, error });
  const mounted = useRef<ReturnType<typeof mountCanvas> | null>(null);
  useEffect(() => {
    current.current = { state, setCamera, error };
    mounted.current?.update();
  }, [state, setCamera, error]);
  useEffect(() => {
    if (!host.current) return;
    mounted.current = mountCanvas(host.current, bridge, {
      read: () => current.current.state,
      camera: (c) => current.current.setCamera(c),
      error: (e) => current.current.error(e),
    });
    return () => {
      mounted.current?.dispose();
      mounted.current = null;
    };
  }, [bridge]);
  return host;
}
export function WorldView({
  bridge,
  view,
  error,
  chemistry,
  setChemistry,
}: {
  bridge: Bridge;
  view: ViewState;
  error: (e: unknown) => void;
  chemistry: ChemicalDisplay;
  setChemistry: (v: ChemicalDisplay) => void;
}) {
  const bounds = view.definition?.config ?? INITIAL_BOUNDS;
  const [camera, setCamera] = useState(() => fitCamera(INITIAL_BOUNDS));
  const [color, setColor] = useState(6),
    [regions, setRegions] = useState(true);
  const [sources, setSources] = useState(true);
  const host = useCanvas(
    bridge,
    {
      bounds,
      camera,
      layers: chemicalLayers(chemistry),
      species: chemistry.species,
      color,
      regions,
      sources,
      exposure: chemistry.exposure,
    },
    setCamera,
    error
  );
  return (
    <section className="viewport">
      <div className="map-tools">
        <ZoomControls camera={camera} setCamera={setCamera} bounds={bounds} />
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
      <div className="world-canvas" ref={host} />
      <ChemicalLegend value={chemistry} />
      <MapLegend bounds={bounds} color={color} />
      <Regions view={view} focus={(x, y) => setCamera({ x, y, zoom: 8 })} />
      {view.status && (
        <SpatialTimeline status={view.status} focus={(x, y) => setCamera({ x, y, zoom: 8 })} />
      )}
    </section>
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

function ZoomControls({
  camera,
  setCamera,
  bounds,
}: {
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  bounds: { width: number; height: number };
}) {
  return (
    <>
      {" "}
      <button onClick={() => setCamera(fitCamera(bounds))}>Fit world</button>
      <button
        aria-label="Zoom out"
        disabled={camera.zoom <= 1}
        onClick={() => setCamera((c) => ({ ...c, zoom: Math.max(1, c.zoom / 1.5) }))}
      >
        −
      </button>
      <span>{camera.zoom.toFixed(1)}×</span>
      <button
        aria-label="Zoom in"
        disabled={camera.zoom >= 12}
        onClick={() => setCamera((c) => ({ ...c, zoom: Math.min(12, c.zoom * 1.5) }))}
      >
        +
      </button>
    </>
  );
}

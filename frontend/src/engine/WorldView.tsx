import { useEffect, useRef, useState } from "react";
import { type Bridge, type ViewState } from "./bridge";
import { fitCamera, type Camera } from "./camera";
import { mountCanvas, type CanvasState } from "./canvas";
import { MapPanel } from "./MapPanel";
import { MapContext } from "./MapContext";
import { GroupHighlight } from "./PhenotypePanel";
import { Overlay } from "./Overlay";
import { chemicalLayers, type ChemicalDisplay } from "./chemicalDisplay";
const INITIAL_BOUNDS = { width: 320, height: 240 };

function useCanvas(
  bridge: Bridge,
  state: CanvasState,
  setCamera: (c: Camera) => void,
  error: (e: unknown) => void,
  onInspect: () => void
) {
  const host = useRef<HTMLDivElement>(null),
    current = useRef({ state, setCamera, error, onInspect });
  const mounted = useRef<ReturnType<typeof mountCanvas> | null>(null);
  useEffect(() => {
    current.current = { state, setCamera, error, onInspect };
    mounted.current?.update();
  }, [state, setCamera, error, onInspect]);
  useEffect(() => {
    if (!host.current) return;
    mounted.current = mountCanvas(host.current, bridge, {
      read: () => current.current.state,
      camera: (c) => current.current.setCamera(c),
      error: (e) => current.current.error(e),
      selected: () => current.current.onInspect(),
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
  mapOpen,
  close,
  onInspect,
  color,
  setColor,
}: {
  bridge: Bridge;
  view: ViewState;
  error: (e: unknown) => void;
  chemistry: ChemicalDisplay;
  setChemistry: (v: ChemicalDisplay) => void;
  mapOpen: boolean;
  close: () => void;
  onInspect: () => void;
  color: number;
  setColor: (color: number) => void;
}) {
  const bounds = view.definition?.config ?? INITIAL_BOUNDS;
  const [camera, setCamera] = useState(() => fitCamera(INITIAL_BOUNDS));
  const [regions, setRegions] = useState(true);
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
    error,
    onInspect
  );
  const focus = (x: number, y: number) => {
    setCamera({ x, y, zoom: 8 });
    close();
  };
  return (
    <section className="viewport" aria-label="World viewport">
      <div className="world-canvas" ref={host} />
      <div className="viewport-tools">
        <ZoomControls camera={camera} setCamera={setCamera} bounds={bounds} />
        <p>Drag to pan · scroll to zoom · select a cell</p>
        <MapContext value={chemistry} change={setChemistry} />
        <GroupHighlight bridge={bridge} status={view.status} error={error} />
      </div>
      {mapOpen && (
        <Overlay title="Map" layout="standard" open close={close}>
          <MapPanel
            view={view}
            chemistry={chemistry}
            setChemistry={setChemistry}
            color={color}
            setColor={setColor}
            regions={regions}
            setRegions={setRegions}
            sources={sources}
            setSources={setSources}
            focus={focus}
          />
        </Overlay>
      )}
    </section>
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
    <div className="zoom-controls">
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
    </div>
  );
}

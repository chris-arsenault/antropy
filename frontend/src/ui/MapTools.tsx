import { type Dispatch, type SetStateAction } from "react";
import { fitCamera, type Camera, type Bounds } from "./camera";
import { type Layers } from "./fieldRaster";
import { colorLegend, type ColorMode } from "./populationColors";

interface Props {
  camera: Camera;
  setCamera: Dispatch<SetStateAction<Camera>>;
  bounds: Bounds;
  layers: Layers;
  setLayers: Dispatch<SetStateAction<Layers>>;
}
export function MapTools({ camera, setCamera, bounds, layers, setLayers }: Props) {
  return (
    <div className="map-tools">
      <div className="zoom-controls">
        <button onClick={() => setCamera(fitCamera(bounds))}>Fit world</button>
        <button
          aria-label="Zoom out"
          disabled={camera.zoom <= 1}
          onClick={() => setCamera((c) => ({ ...c, zoom: Math.max(1, c.zoom / 1.5) }))}
        >
          −
        </button>
        <span className="zoom-value">{camera.zoom.toFixed(1)}×</span>
        <button
          aria-label="Zoom in"
          disabled={camera.zoom >= 12}
          onClick={() => setCamera((c) => ({ ...c, zoom: Math.min(12, c.zoom * 1.5) }))}
        >
          +
        </button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={layers.nutrient}
          onChange={(e) => setLayers((l) => ({ ...l, nutrient: e.target.checked }))}
        />{" "}
        Food A · green / B · blue
      </label>
      <label>
        <input
          type="checkbox"
          checked={layers.chemical}
          onChange={(e) => setLayers((l) => ({ ...l, chemical: e.target.checked }))}
        />{" "}
        Released chemical · magenta
      </label>
      <label>
        <input
          type="checkbox"
          checked={layers.toxin}
          onChange={(e) => setLayers((l) => ({ ...l, toxin: e.target.checked }))}
        />{" "}
        Toxin · red
      </label>
      <label>
        <input
          type="checkbox"
          checked={layers.matrix}
          onChange={(e) => setLayers((l) => ({ ...l, matrix: e.target.checked }))}
        />{" "}
        Protective matrix · ochre
      </label>
    </div>
  );
}
export function MapLegend({ colorMode }: { colorMode: ColorMode }) {
  return (
    <div className="map-legend">
      <div>
        <span>{colorLegend(colorMode)}</span>
        <span>Inner fill: usable energy</span>
        <span>White tip: heading</span>
      </div>
      <div>
        <span className="source-key">⊕ Finite food deposit</span>
        <span className="birth-key">○ Newborn</span>
        <span className="death-key">× Death · red interiors indicate damage</span>
        <span>Red field: toxin pressure · ochre deposits slow motion and bind toxin</span>
      </div>
      <p>Drag to pan · wheel to zoom at pointer · click to inspect. Opposite edges connect.</p>
    </div>
  );
}

import { type ScentLayerKey } from "../render/scentRenderer";

export type LayerVisibility = Record<ScentLayerKey, boolean>;

export const DEFAULT_LAYERS: LayerVisibility = {
  pheromoneA: true,
  pheromoneB: true,
  foodBeacon: false,
  nestBeacon: false,
};

const LAYER_ROWS: { key: ScentLayerKey; label: string; chipClass: string }[] = [
  { key: "pheromoneA", label: "Pheromone A", chipClass: "chip-layer-a" },
  { key: "pheromoneB", label: "Pheromone B", chipClass: "chip-layer-b" },
  { key: "foodBeacon", label: "Food beacon", chipClass: "chip-layer-food" },
  { key: "nestBeacon", label: "Nest beacon", chipClass: "chip-layer-nest" },
];

interface MapLayersPanelProps {
  layers: LayerVisibility;
  onToggle(layer: ScentLayerKey, visible: boolean): void;
  groundOpacity: number;
  onGroundOpacity(opacity: number): void;
}

/** Civ-style map layer controls for the 3D viewport. */
export function MapLayersPanel({
  layers,
  onToggle,
  groundOpacity,
  onGroundOpacity,
}: MapLayersPanelProps) {
  return (
    <figure className="chart" data-testid="map-layers">
      <figcaption className="chart-title">Map layers</figcaption>
      <div className="layer-rows">
        {LAYER_ROWS.map(({ key, label, chipClass }) => (
          <label key={key} className="layer-row">
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={(event) => onToggle(key, event.target.checked)}
            />
            <span className={`legend-chip ${chipClass}`} />
            {label}
          </label>
        ))}
        <label className="layer-row">
          <span className="layer-slider-label">Ground</span>
          <input
            type="range"
            min={5}
            max={100}
            value={Math.round(groundOpacity * 100)}
            onChange={(event) => onGroundOpacity(Number(event.target.value) / 100)}
          />
          {Math.round(groundOpacity * 100)}%
        </label>
      </div>
    </figure>
  );
}

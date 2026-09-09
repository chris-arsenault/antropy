import { type LayerVisibility } from "./WorldView";
import { Material, MATERIALS } from "../sim/materials";

const TERRAIN_KEY = [
  [Material.SOIL, "Soil"],
  [Material.CLAY, "Clay"],
  [Material.LOOSE_SOIL, "Loose soil"],
  [Material.ROCK, "Rock"],
  [Material.WOOD, "Wood"],
] as const;

const LAYERS: readonly {
  key: keyof LayerVisibility;
  label: string;
  className: string;
}[] = [
  {
    key: "temperature",
    label: "Temperature · blue 10°C to red 40°C",
    className: "chip-layer-nest",
  },
  { key: "moisture", label: "Moisture · dry amber to wet blue", className: "chip-layer-a" },
  { key: "routes", label: "Known locations and routes", className: "chip-layer-a" },
  { key: "pheromoneA", label: "Pheromone A", className: "chip-layer-a" },
  { key: "pheromoneB", label: "Pheromone B", className: "chip-layer-b" },
  { key: "foodOdor", label: "Food odor", className: "chip-layer-food" },
  { key: "nestOdor", label: "Colony odor", className: "chip-layer-nest" },
  { key: "freshAir", label: "Fresh air", className: "chip-layer-a" },
];

interface MapLayersPanelProps {
  readonly layers: LayerVisibility;
  readonly onChange: (key: keyof LayerVisibility, visible: boolean) => void;
}

export function MapLayersPanel(props: MapLayersPanelProps) {
  return (
    <section className="panel" data-testid="map-layers">
      <h2>Map layers</h2>
      <div className="terrain-key" aria-label="Terrain materials">
        {TERRAIN_KEY.map(([material, label]) => (
          <span key={material}>
            <svg width="10" height="10" aria-hidden="true">
              <rect width="10" height="10" fill={MATERIALS[material].color} />
            </svg>{" "}
            {label}
          </span>
        ))}
      </div>
      <div className="layer-rows">
        {LAYERS.map((layer) => (
          <label className="layer-row" key={layer.key}>
            <input
              type="checkbox"
              checked={props.layers[layer.key] ?? false}
              onChange={(event) => props.onChange(layer.key, event.target.checked)}
            />
            <span className={`legend-chip ${layer.className}`} />
            {layer.label}
          </label>
        ))}
      </div>
    </section>
  );
}

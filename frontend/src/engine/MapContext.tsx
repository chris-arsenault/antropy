import { type ChemicalDisplay } from "./chemicalDisplay";
import "./chemicals.css";

const cues = [
  [
    "illumination",
    "Light",
    "Received light includes terrain shade, constructed cover and emission. Shadow dims the map; warm glows mark paid emitters.",
  ],
  ["impedance", "Resistance", "Hatching strengthens with movement resistance. Toggle hatching."],
  ["stress", "Stress", "Dots strengthen with local stress exposure. Toggle dots."],
] as const;

const landscapeKey = [
  [
    "ground",
    "Ground: resistant → conductive",
    "Earth → teal shows substrate conductance. Fine contours show height; closer lines mean steeper ground.",
  ],
  [
    "contours",
    "Contours: height",
    "Each line marks four height units. Closer lines mean steeper slopes; flat high ground is not a slope.",
  ],
  [
    "illumination",
    "Shade: received light",
    "Ground brightness follows actual received light, including terrain shade, constructed cover and paid emission.",
  ],
  [
    "chemistry",
    "Chemistry: low → high energy",
    "Blue → amber shows energy per material. Concentration controls opacity; the terrain remains visible.",
  ],
  [
    "season",
    "Reservoir band: slow → fast",
    "Copper → teal shows the local supply clock, 0× → 2×. The inner solid or dashed ring separately shows stocked or empty.",
  ],
] as const;

/** The ordinary view explains itself without opening controls or choosing maps. */
export function MapContext({
  value,
  change,
}: {
  value: ChemicalDisplay;
  change: (v: ChemicalDisplay) => void;
}) {
  if (value.base === "landscape")
    return (
      <div className="map-context landscape-key" aria-label="Landscape legend">
        {landscapeKey.map(([key, label, hint]) => (
          <span className="landscape-key-item" key={key} title={hint}>
            <span className={`context-swatch ${key}`} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    );
  return (
    <div className="map-context" aria-label="Map context layers">
      {cues.map(([key, label, hint]) => (
        <button
          key={key}
          aria-pressed={value[key]}
          title={hint}
          onClick={() => change({ ...value, [key]: !value[key] })}
        >
          <span className={`context-swatch ${key}`} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

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
    "Ground: rough → conductive",
    "Earth → teal shows substrate conductance. More short diagonal marks mean greater substrate resistance; contours separately show slopes. Chemical drag has its own optional diagnostic overlay.",
  ],
  [
    "contours",
    "Contours: height",
    "Each line marks four height units. Closer lines mean steeper slopes; flat high ground is not a slope.",
  ],
  [
    "illumination",
    "Shade: received light",
    "Translucent shadow follows received light across ground, chemistry, cells and reservoirs, including terrain shade, constructed cover and paid emission. Toggle it with Light.",
  ],
  [
    "chemistry",
    "Colored clouds: chemistry",
    "Blue → amber shows low → high energy per material. Stronger color means more material. The terrain remains visible through the clouds; the Light overlay shades all layers together.",
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
  return (
    <>
      {value.base === "landscape" && (
        <div className="map-context landscape-key" aria-label="Landscape legend">
          {landscapeKey.map(([key, label, hint]) => (
            <span className="landscape-key-item" key={key} title={hint}>
              <span className={`context-swatch ${key}`} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      )}
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
    </>
  );
}

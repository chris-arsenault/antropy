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

/** A persistent key doubles as direct controls; display choices remain independent. */
export function MapContext({
  value,
  change,
}: {
  value: ChemicalDisplay;
  change: (v: ChemicalDisplay) => void;
}) {
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

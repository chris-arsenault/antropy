import { type ChemicalDisplay, quantity } from "./chemicalDisplay";

export function ChemicalControls({
  value,
  change,
}: {
  value: ChemicalDisplay;
  change: (v: ChemicalDisplay) => void;
}) {
  return (
    <div className="map-tools chemical-controls">
      <label>
        Environment{" "}
        <select
          value={value.base}
          onChange={(e) => change({ ...value, base: e.target.value as ChemicalDisplay["base"] })}
        >
          <option value="matter">Dissolved amount</option>
          <option value="potential">Energy per material</option>
          <option value="chemical">Chemical #{value.species}</option>
          <option value="weathering">Chemical weathering</option>
          <option value="none">No background field</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.impedance}
          onChange={(e) => change({ ...value, impedance: e.target.checked })}
        />
        Movement resistance
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.stress}
          onChange={(e) => change({ ...value, stress: e.target.checked })}
        />
        Stress exposure
      </label>
      <label>
        Trace visibility{" "}
        <select
          value={value.exposure}
          onChange={(e) => change({ ...value, exposure: Number(e.target.value) })}
        >
          <option value={1}>Dense (1×)</option>
          <option value={4}>Normal (4×)</option>
          <option value={16}>Faint (16×)</option>
          <option value={64}>Traces (64×)</option>
        </select>
      </label>
    </div>
  );
}

export function ChemicalLegend({ value }: { value: ChemicalDisplay }) {
  const half = quantity(Math.log(2) / value.exposure);
  const name = value.base === "chemical" ? `Chemical #${value.species}` : "Dissolved amount";
  let legend =
    value.base === "potential"
      ? "Blue → amber: 0.5 → 8 energy / material. Brightness indicates presence, not usable food."
      : `${name}: dark → bright, 0 → dense. Half brightness at ${half} material / area.`;
  if (value.base === "weathering")
    legend =
      "Blue → amber: low → high local chemical interaction, attenuated by medium resistance. Actual conversion depends on the chemicals present.";
  return (
    <div className="chemical-legend">
      {value.base !== "none" && (
        <p>
          <span className={`field-ramp ${value.base}`} />
          {legend}
        </p>
      )}
      {value.impedance && (
        <p>
          Amber diagonal bands: 0–100% movement lost to chemical impedance; half opacity at 50%
          loss. Viscosity is separate.
        </p>
      )}
      {value.stress && (
        <p>
          Rose dots: 0–100% abiotic stress saturation. This is an exposure reference; cell injury
          depends on membrane compatibility and repair.
        </p>
      )}
    </div>
  );
}

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
          <option value="illumination">Illumination: mean sunlight</option>
          <option value="response0">Illumination: response 1</option>
          <option value="response1">Illumination: response 2</option>
          <option value="none">No background field</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.illumination}
          onChange={(e) => change({ ...value, illumination: e.target.checked })}
        />
        Sunlight and shadow
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

function baseLegend(value: ChemicalDisplay) {
  const half = quantity(Math.log(2) / value.exposure);
  const name = value.base === "chemical" ? `Chemical #${value.species}` : "Dissolved amount";
  let legend =
    value.base === "potential"
      ? "Blue → amber: 0.5 → 8 energy / material. Contrast indicates material presence, not usable food."
      : `${name}: faint → distinct, 0 → dense. Half field opacity at ${half} material / area.`;
  if (value.base === "weathering")
    legend =
      "Blue → amber: low → high local chemical interaction, attenuated by medium resistance. Actual conversion depends on the chemicals present.";
  if (value.base === "illumination")
    legend =
      "Dark shadow → ivory sunlight: equal-weight mean of both responses, with a soft transition around the uniform 1× drive. Shadow means reduced drive, not zero available work.";
  if (value.base === "response0" || value.base === "response1")
    legend =
      "Dark shadow → ivory sunlight: response below → above the uniform 1× drive. The soft transition spans 0.8–1.2×; endpoints saturate. This is supplied drive, not usable cell energy.";
  return legend;
}

export function ChemicalLegend({ value }: { value: ChemicalDisplay }) {
  return (
    <div className="chemical-legend">
      {value.base !== "none" && (
        <p>
          <span className={`field-ramp ${value.base}`} />
          {baseLegend(value)}
        </p>
      )}
      {value.impedance && (
        <p>
          Fine amber hatching: stronger where more movement is lost to chemical impedance. Viscosity
          is separate.
        </p>
      )}
      {value.stress && (
        <p>
          Rose dots: 0–100% abiotic stress saturation. This is an exposure reference; cell injury
          depends on membrane compatibility and repair.
        </p>
      )}
      {value.illumination && !["illumination", "response0", "response1"].includes(value.base) && (
        <p>
          Sunlight leaves map colors intact. Translucent night shadow dims fields, cells and sources
          together, with a soft boundary around the mean 1× illumination. Detail remains visible in
          shadow. Use the separate response views to inspect differences hidden by the mean.
        </p>
      )}
    </div>
  );
}

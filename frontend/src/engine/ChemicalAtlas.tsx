import { useState } from "react";
import { type Definition, type Machinery, type Target } from "./types";
import { machineryLabel } from "./bodyParts";
import { type RecognitionProfile } from "./bindingTypes";
import { ATLAS_PROPERTIES, type AtlasDisplay, atlasValues, radialTargets } from "./recognition";
export function ChemicalAtlas({
  definition,
  machinery,
  recognition,
}: {
  definition: Definition;
  machinery: Machinery | null;
  recognition: RecognitionProfile | null;
}) {
  const [property, setProperty] = useState<AtlasDisplay>(recognition ? "recognition" : "potential");
  const [site, setSite] = useState(0);
  const row = recognition?.sites[site];
  const values = atlasValues(definition, property, recognition, site);
  const min = Math.min(...values),
    max = Math.max(...values);
  const targets = radialTargets(machinery);
  return (
    <details>
      <summary>Chemical space · 256 species</summary>
      <AtlasControls
        property={property}
        setProperty={setProperty}
        site={site}
        setSite={setSite}
        recognition={recognition}
      />
      <p>
        {property}: {min.toPrecision(3)}–{max.toPrecision(3)}. Diffusion uses logarithmic color.
        {machinery?.keys
          ? "Recognition comes from inherited keys over identity bits."
          : "Rings locate radial machinery targets; the white ring is the membrane."}
      </p>
      {property === "recognition" && row && (
        <p>
          Compiled support: {row.affinities.length} identities · effective breadth{" "}
          {row.effectiveBreadth.toPrecision(3)}.
        </p>
      )}
      <AtlasMap property={property} values={values} targets={targets} />
    </details>
  );
}

function AtlasMap({
  property,
  values,
  targets,
}: {
  property: AtlasDisplay;
  values: number[];
  targets: ReturnType<typeof radialTargets>;
}) {
  const min = Math.min(...values),
    max = Math.max(...values);
  return (
    <svg
      viewBox="-10 -10 180 190"
      width="100%"
      role="img"
      aria-label={`Chemical ${property} atlas`}
    >
      {values.map((v, s) => {
        const fraction =
          property === "diffusion"
            ? Math.log(v / min) / Math.log(max / min)
            : (v - min) / Math.max(max - min, 1e-30);
        return (
          <rect
            key={s}
            x={Math.floor(s / 16) * 10}
            y={(s % 16) * 10}
            width="10"
            height="10"
            fill={`hsl(${240 - 230 * fraction},65%,50%)`}
          >
            <title>{`ID ${s} · (${Math.floor(s / 16)},${s % 16}) · ${v.toPrecision(4)}`}</title>
          </rect>
        );
      })}
      <Targets targets={targets} />
      <text x="0" y="174" fontSize="8" fill="currentColor">
        Chemical X → 15; Y increases downward
      </text>
    </svg>
  );
}

function AtlasControls({
  property,
  setProperty,
  site,
  setSite,
  recognition,
}: {
  property: AtlasDisplay;
  setProperty: (p: AtlasDisplay) => void;
  site: number;
  setSite: (s: number) => void;
  recognition: RecognitionProfile | null;
}) {
  return (
    <>
      <label>
        Chemical view{" "}
        <select value={property} onChange={(e) => setProperty(e.target.value as AtlasDisplay)}>
          {ATLAS_PROPERTIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
          {recognition && <option value="recognition">Cell recognition</option>}
          {recognition && <option value="susceptibility">Membrane susceptibility</option>}
        </select>
      </label>
      {property === "recognition" && recognition && (
        <label>
          Machinery site{" "}
          <select value={site} onChange={(e) => setSite(Number(e.target.value))}>
            {recognition.sites.map((r) => (
              <option key={r.site} value={r.site} disabled={!r.active}>
                {r.site === 16 ? "Membrane" : machineryLabel(r.site)}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}

function Targets({ targets }: { targets: { point: Target; label: string; membrane: boolean }[] }) {
  return (
    <>
      {" "}
      {targets.map((p, i) => (
        <circle
          key={i}
          cx={p.point.x * 10 + 5}
          cy={p.point.y * 10 + 5}
          r={p.membrane ? 5 : 3}
          fill="none"
          stroke={p.membrane ? "white" : "black"}
        >
          <title>{p.label}</title>
        </circle>
      ))}
    </>
  );
}

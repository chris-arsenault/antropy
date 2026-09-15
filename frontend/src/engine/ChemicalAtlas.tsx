import { useState } from "react";
import { type Definition, type Machinery, type Target } from "./types";

const PROPERTIES = ["potential", "diffusion", "impedance", "stress"] as const;
export function ChemicalAtlas({
  definition,
  machinery,
}: {
  definition: Definition;
  machinery: Machinery | null;
}) {
  const [property, setProperty] = useState<(typeof PROPERTIES)[number]>("potential");
  const values = definition.chemistry.properties.map((p) => p[property]);
  const min = Math.min(...values),
    max = Math.max(...values);
  const targets = machinery
    ? [...machinery.receptors, ...machinery.transporters, ...machinery.enzymes, machinery.membrane]
    : [];
  return (
    <details>
      <summary>Chemical space · 256 species</summary>
      <label>
        Physical property{" "}
        <select
          value={property}
          onChange={(e) => setProperty(e.target.value as (typeof PROPERTIES)[number])}
        >
          {PROPERTIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <p>
        {property}: {min.toPrecision(3)}–{max.toPrecision(3)}. Diffusion uses logarithmic color.
        Rings locate machinery targets; the white ring is the membrane.
      </p>
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
              : (v - min) / (max - min);
          return (
            <rect
              key={s}
              x={Math.floor(s / 16) * 10}
              y={(s % 16) * 10}
              width="10"
              height="10"
              fill={`hsl(${240 - 230 * fraction},65%,50%)`}
            >
              <title>
                ID {s} · ({Math.floor(s / 16)},{s % 16}) · {v.toPrecision(4)}
              </title>
            </rect>
          );
        })}
        <Targets targets={targets} />
        <text x="0" y="174" fontSize="8" fill="currentColor">
          Chemical X → 15; Y increases downward
        </text>
      </svg>
    </details>
  );
}

function Targets({ targets }: { targets: Target[] }) {
  return (
    <>
      {" "}
      {targets.map((p, i) => (
        <circle
          key={i}
          cx={p.x * 10 + 5}
          cy={p.y * 10 + 5}
          r={i === 12 ? 5 : 3}
          fill="none"
          stroke={i === 12 ? "white" : "black"}
        >
          <title>
            {i === 12
              ? "Membrane"
              : `${["Receptor", "Transporter", "Enzyme"][Math.floor(i / 4)]} ${i % 4}`}
          </title>
        </circle>
      ))}
    </>
  );
}

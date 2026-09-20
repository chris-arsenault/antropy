import { useState } from "react";
import { type HistoryPoint } from "./types";
import { PHENOTYPE_TRAITS, type PinMetadata } from "./phenotypes";

export function PhenotypeHistory({ history, pin }: { history: HistoryPoint[]; pin: PinMetadata }) {
  const [metric, setMetric] = useState(-1);
  const points = history.filter((p) => p.phenotype?.id === pin.id);
  const values = points.map((p) => ({
    tick: p.tick,
    value:
      metric < 0
        ? [p.phenotype!.count, p.phenotype!.count, p.phenotype!.count]
        : p.phenotype!.actual[metric],
  }));
  const first = points[0]?.tick ?? pin.started,
    last = points[points.length - 1]?.tick ?? pin.started;
  const ceiling = Math.max(1e-10, ...values.flatMap((p) => p.value ?? []));
  const x = (tick: number) => 35 + (670 * (tick - first)) / Math.max(1, last - first);
  const y = (value: number) => 175 - (145 * value) / ceiling;
  const name = metric < 0 ? "Living descendants" : PHENOTYPE_TRAITS[metric];
  return (
    <section className="phenotype-history">
      <h3>Pinned descendants over time</h3>
      <label>
        Track{" "}
        <select value={metric} onChange={(e) => setMetric(Number(e.target.value))}>
          <option value={-1}>Living descendants</option>
          {PHENOTYPE_TRAITS.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <svg viewBox="0 0 740 210" role="img" aria-label={`${name} from tick ${first} to ${last}`}>
        <path className="trend-axis" d="M35 25V175H705" />
        <text x="38" y="18">
          {ceiling.toPrecision(3)}
        </text>
        <text x="12" y="179">
          0
        </text>
        {values.map(
          (p) =>
            p.value && (
              <g key={p.tick}>
                <line
                  className="trend-range"
                  x1={x(p.tick)}
                  x2={x(p.tick)}
                  y1={y(p.value[0])}
                  y2={y(p.value[2])}
                />
                <circle className="trend-median" cx={x(p.tick)} cy={y(p.value[1])} r="2.5">
                  <title>
                    Tick {p.tick}: {p.value[1].toPrecision(3)}
                  </title>
                </circle>
              </g>
            )
        )}
        <text x="35" y="200">
          Tick {first.toLocaleString()}
        </text>
        <text x="705" y="200" textAnchor="end">
          {last.toLocaleString()}
        </text>
      </svg>
      <p className="web-caption">
        Dots show medians; bars show the 10th–90th percentiles. Empty cohorts have zero descendants
        and no trait values. Samples share the existing bounded history and become sparser as the
        run grows. {points.length} retained samples.
      </p>
    </section>
  );
}

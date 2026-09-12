import { useState } from "react";
import { type World } from "../sim/types";
import { traitSnapshot, EFFORTS, type Trait } from "../observe/traits";
import { type PopulationPoint } from "./populationHistory";

function Histogram({ bins, label }: { bins: number[]; label: string }) {
  const total = bins.reduce((s, n) => s + n, 0);
  return (
    <svg className="trait-histogram" viewBox="0 0 200 42" role="img" aria-label={label}>
      {bins.map((n, i) => (
        <rect
          key={i}
          x={i * 20 + 1}
          y={40 - (40 * n) / Math.max(1, total)}
          width="18"
          height={(40 * n) / Math.max(1, total)}
        >
          <title>
            {((100 * n) / Math.max(1, total)).toFixed(1)}% of samples in bin {i + 1}
          </title>
        </rect>
      ))}
    </svg>
  );
}
function TraitTrend({
  history,
  trait,
  ceiling,
}: {
  history: PopulationPoint[];
  trait: Trait;
  ceiling: number;
}) {
  const points = history.filter(
    (p) => Array.isArray(p.traits) && p.traits.some((t) => t.key === trait && t.stats)
  );
  if (points.length < 2) return <p>Trend appears as the run advances.</p>;
  const first = points[0],
    last = points[points.length - 1],
    span = Math.max(1, last.tick - first.tick);
  const top = Math.max(
    ceiling,
    ...points.map((p) => p.traits.find((t) => t.key === trait)!.stats!.median)
  );
  return (
    <svg
      className="trait-trend"
      viewBox="0 0 300 95"
      role="img"
      aria-label={`Inherited ${trait} median over time`}
    >
      <text x="0" y="12">
        {top.toFixed(1)}%
      </text>
      <text x="0" y="68">
        0%
      </text>
      <polyline
        points={points
          .map(
            (p) =>
              `${40 + (250 * (p.tick - first.tick)) / span},${65 - (50 * p.traits.find((t) => t.key === trait)!.stats!.median) / top}`
          )
          .join(" ")}
      />
      <text x="40" y="88">
        {first.tick.toLocaleString()}
      </text>
      <text x="290" y="88" textAnchor="end">
        {last.tick.toLocaleString()}
      </text>
    </svg>
  );
}
export function TraitPanel({
  world,
  history,
  recent,
}: {
  world: World;
  history: PopulationPoint[];
  recent: PopulationPoint[];
}) {
  const traits = traitSnapshot(world),
    [selected, setSelected] = useState<Trait>(
      world.config.foodEpochs || world.config.foodZones ? "foodA" : "motor"
    );
  const current = traits.find((t) => t.key === selected)!;
  return (
    <div className="trait-panel">
      <h3>Inherited trait distributions</h3>
      <p>Each living cell contributes once. Targets are independent of age, growth and damage.</p>
      {traits.map((t) => (
        <div className="trait-row" key={t.key}>
          <strong>{t.label}</strong>
          <span>
            {t.stats ? `${t.stats.p10.toFixed(2)}–${t.stats.p90.toFixed(2)}%` : "—"} · middle 80%
          </span>
          <Histogram
            bins={t.bins}
            label={`${t.label}, percentage of living cells per bin, scale 0 to ${t.ceiling}%`}
          />
          <small>
            0–{t.ceiling.toFixed(1)} {t.unit} · median {t.stats?.median.toFixed(2) ?? "—"}%
          </small>
        </div>
      ))}
      <label>
        Trait trend{" "}
        <select value={selected} onChange={(e) => setSelected(e.target.value as Trait)}>
          {traits.map((t) => (
            <option value={t.key} key={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <TraitTrend history={history} trait={selected} ceiling={current.ceiling} />
      <h3>Recent sampled behavior</h3>
      <p>
        Effort distributions over the last 2,000 ticks, sampled every 100 ticks. Bars show shares of
        sampled organism decisions; effort is not energy expenditure. Turning uses magnitude.
      </p>
      {!recent.length ? (
        <p>No decisions sampled yet.</p>
      ) : (
        EFFORTS.map((key) => {
          const bins = new Array<number>(10).fill(0);
          for (const point of recent)
            for (const [i, n] of point.efforts.find((e) => e.key === key)!.bins.entries())
              bins[i] += n;
          return (
            <div className="effort-row" key={key}>
              <span>{key} · 0–100% effort</span>
              <Histogram
                bins={bins}
                label={`${key} effort, percentage of sampled decisions per bin`}
              />
            </div>
          );
        })
      )}
    </div>
  );
}

import { type World } from "../sim/types";
import { appendPoint, type PopulationPoint } from "./populationHistory";

export function PopulationChart({ world, history }: { world: World; history: PopulationPoint[] }) {
  const points = appendPoint(history, world),
    first = points[0],
    last = points[points.length - 1];
  const top = Math.max(10, Math.ceil(Math.max(...points.map((p) => p.population)) / 10) * 10);
  const span = Math.max(1, last.tick - first.tick);
  const plot = points.map(
    (p) => `${32 + (250 * (p.tick - first.tick)) / span},${100 - (80 * p.population) / top}`
  );
  const change = last.population - first.population;
  return (
    <div className="population-chart">
      <div className="chart-caption">
        <h3>Living population</h3>
        <span>
          {change >= 0 ? "+" : ""}
          {change} in view
        </span>
      </div>
      <svg
        viewBox="0 0 300 126"
        role="img"
        aria-label={`Population history: ${first.population} to ${last.population} living bacteria, ticks ${first.tick} to ${last.tick}`}
      >
        <path d="M32 20H282 M32 60H282 M32 100H282" className="chart-grid" />
        <text x="25" y="23" textAnchor="end">
          {top}
        </text>
        <text x="25" y="103" textAnchor="end">
          0
        </text>
        <polygon
          points={`32,100 ${plot.join(" ")} ${32 + (250 * (last.tick - first.tick)) / span},100`}
          className="chart-area"
        />
        <polyline points={plot.join(" ")} className="chart-line" />
        <circle
          cx={32 + (250 * (last.tick - first.tick)) / span}
          cy={100 - (80 * last.population) / top}
          r="3"
          className="chart-end"
        />
        <text x="32" y="119">
          Tick {first.tick.toLocaleString()}
        </text>
        <text x="282" y="119" textAnchor="end">
          {last.tick.toLocaleString()}
        </text>
      </svg>
    </div>
  );
}

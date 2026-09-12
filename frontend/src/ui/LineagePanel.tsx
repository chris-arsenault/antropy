import { lineageColor } from "./cellDrawing";
import { appendSample, type PopulationPoint } from "./populationHistory";
import { type summary } from "../sim/stats";

function share(point: PopulationPoint, id: number): number {
  return (
    (point.lineages.find(([lineage]) => lineage === id)?.[1] ?? 0) / Math.max(1, point.population)
  );
}
export function LineagePanel({
  stats,
  history,
}: {
  stats: ReturnType<typeof summary>;
  history: PopulationPoint[];
}) {
  const current = {
    tick: stats.tick,
    population: stats.population,
    births: stats.births,
    deaths: stats.deaths,
    lineages: stats.lineages,
    families: [],
    traits: [],
    efforts: [],
    strategies: [],
  };
  const points = appendSample(
      history.filter((p) => Array.isArray(p.lineages)),
      current
    ),
    first = points[0];
  return (
    <div className="lineage-panel">
      <h3>Founder lineages</h3>
      <p>
        {stats.inherited.livingLineages} remain · largest share{" "}
        {(100 * stats.inherited.largestShare).toFixed(1)}%
      </p>
      <LineageChart lineages={stats.lineages} points={points} label="Founder population shares" />
      <table>
        <thead>
          <tr>
            <th>Founder</th>
            <th>Living</th>
            <th>Share</th>
            <th>Change¹</th>
          </tr>
        </thead>
        <tbody>
          {stats.lineages.slice(0, 8).map(([id, count]) => (
            <tr key={id}>
              <td>
                <svg width="12" height="12" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" fill={lineageColor(id)} />
                </svg>{" "}
                {id}
              </td>
              <td>{count}</td>
              <td>{(100 * share(current, id)).toFixed(1)}%</td>
              <td>{(100 * (share(current, id) - share(first, id))).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        ¹ Percentage points since tick {first.tick.toLocaleString()}. Lines show the current top
        four; shares use the whole population.
      </p>
    </div>
  );
}

export function LineageChart({
  lineages,
  points,
  label,
}: {
  lineages: [number, number][];
  points: PopulationPoint[];
  label: string;
}) {
  const first = points[0],
    current = points[points.length - 1];
  const span = Math.max(1, current.tick - first.tick);
  const peak = Math.max(
    0,
    ...points.flatMap((p) => lineages.slice(0, 4).map(([id]) => share(p, id)))
  );
  const ceiling = Math.min(1, Math.max(0.05, Math.ceil(peak * 20) / 20));
  return (
    <svg viewBox="0 0 300 120" role="img" aria-label={label}>
      <path d="M32 12H282 M32 52H282 M32 92H282" className="chart-grid" />
      <text x="28" y="16" textAnchor="end">
        {(100 * ceiling).toFixed(0)}%
      </text>
      <text x="28" y="96" textAnchor="end">
        0%
      </text>
      {lineages.slice(0, 4).map(([id]) => (
        <polyline
          key={id}
          fill="none"
          stroke={lineageColor(id)}
          strokeWidth="2"
          points={points
            .map(
              (p) =>
                `${32 + (250 * (p.tick - first.tick)) / span},${92 - (80 * share(p, id)) / ceiling}`
            )
            .join(" ")}
        />
      ))}
      <text x="32" y="112">
        Tick {first.tick.toLocaleString()}
      </text>
      <text x="282" y="112" textAnchor="end">
        {current.tick.toLocaleString()}
      </text>
    </svg>
  );
}

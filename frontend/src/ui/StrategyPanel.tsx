import { type World } from "../sim/types";
import { traitValues } from "../observe/traits";
import { strategyClusters, clusterColor, type StrategyCluster } from "../observe/clusters";
import { type PopulationPoint } from "./populationHistory";
import "./populationObservation.css";

/** Living cells over inherited A share and defense, colored by cluster; shape marks the band. */
function Scatter({ world }: { world: World }) {
  const snapshot = strategyClusters(world),
    cache = new Map<number, ReturnType<typeof traitValues>>();
  const trait = (genome: number) => {
    let t = cache.get(genome);
    if (!t) {
      t = traitValues(world, genome);
      cache.set(genome, t);
    }
    return t;
  };
  const top = Math.max(5, ...world.cells.map((c) => trait(c.genome).defense));
  return (
    <svg
      className="strategy-scatter"
      viewBox="0 0 300 130"
      role="img"
      aria-label="Living cells by inherited A share of processing and defense, colored by strategy cluster"
    >
      <path d="M32 8V108H292" className="chart-grid" />
      <text x="28" y="12" textAnchor="end">
        {top.toFixed(1)}%
      </text>
      <text x="28" y="110" textAnchor="end">
        0
      </text>
      <text x="32" y="124">
        0% A
      </text>
      <text x="292" y="124" textAnchor="end">
        100% A
      </text>
      <text x="162" y="124" textAnchor="middle">
        A share of processing · circle left band, square right band
      </text>
      {world.cells.map((c, i) => {
        const t = trait(c.genome),
          x = 32 + (260 * t.foodA) / 100,
          y = 108 - (100 * t.defense) / top;
        const fill = clusterColor(snapshot.ranks[i] ?? 0);
        return c.x < world.config.width / 2 ? (
          <circle key={c.id} cx={x} cy={y} r="2.2" fill={fill} opacity="0.85" />
        ) : (
          <rect key={c.id} x={x - 2} y={y - 2} width="4" height="4" fill={fill} opacity="0.85" />
        );
      })}
    </svg>
  );
}

function Frequencies({ history }: { history: PopulationPoint[] }) {
  const points = history.filter((p) => Array.isArray(p.strategies) && p.strategies.length);
  if (points.length < 2) return <p>Cluster history appears as the run advances.</p>;
  const first = points[0],
    last = points[points.length - 1],
    span = Math.max(1, last.tick - first.tick);
  const top = Math.max(10, ...points.map((p) => p.population));
  const ranks = Math.max(...points.map((p) => p.strategies.length));
  return (
    <svg
      className="strategy-frequencies"
      viewBox="0 0 300 100"
      role="img"
      aria-label="Strategy cluster sizes over time"
    >
      <text x="28" y="12" textAnchor="end">
        {top}
      </text>
      <text x="28" y="72" textAnchor="end">
        0
      </text>
      {Array.from({ length: ranks }, (_, rank) => (
        <polyline
          key={rank}
          stroke={clusterColor(rank)}
          points={points
            .map((p) => {
              const size = p.strategies.find((c) => c.rank === rank)?.size ?? 0;
              return `${32 + (260 * (p.tick - first.tick)) / span},${70 - (60 * size) / top}`;
            })
            .join(" ")}
        />
      ))}
      <text x="32" y="90">
        {first.tick.toLocaleString()}
      </text>
      <text x="292" y="90" textAnchor="end">
        {last.tick.toLocaleString()}
      </text>
    </svg>
  );
}

function ClusterRows({
  clusters,
  population,
}: {
  clusters: StrategyCluster[];
  population: number;
}) {
  return (
    <table className="strategy-table">
      <thead>
        <tr>
          <th>Cluster</th>
          <th>Cells</th>
          <th>Left band</th>
          <th>A share</th>
          <th>Motor</th>
          <th>Defense</th>
          <th>Toxin</th>
          <th>Matrix</th>
        </tr>
      </thead>
      <tbody>
        {clusters.map((c) => (
          <tr key={c.rank}>
            <td>
              <svg className="family-swatch" viewBox="0 0 10 10" aria-hidden="true">
                <circle cx="5" cy="5" r="4" fill={clusterColor(c.rank)} />
              </svg>
              {c.rank + 1}
            </td>
            <td>{((100 * c.size) / Math.max(1, population)).toFixed(0)}%</td>
            <td>{((100 * c.leftBand) / Math.max(1, c.size)).toFixed(0)}%</td>
            <td>{c.center.foodA.toFixed(1)}%</td>
            <td>{c.center.motor.toFixed(2)}%</td>
            <td>{c.center.defense.toFixed(2)}%</td>
            <td>{c.center.weapon.toFixed(2)}%</td>
            <td>{c.center.builder.toFixed(2)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Strategy space: three inherited-trait clusters of the living population, ranked by A share.
 * Clusters describe the distribution; they are not fitness classes and never enter the kernel.
 */
export function StrategyPanel({ world, history }: { world: World; history: PopulationPoint[] }) {
  const snapshot = strategyClusters(world);
  return (
    <div className="strategy-panel">
      <h3>Strategy clusters</h3>
      <p>
        Living cells grouped by inherited construction targets. Coexisting clusters that hold
        different bands are the observation this world is built for; a single cluster is not.
      </p>
      <Scatter world={world} />
      <ClusterRows clusters={snapshot.clusters} population={world.cells.length} />
      <Frequencies history={history} />
    </div>
  );
}

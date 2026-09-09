import { type HistoryPoint } from "./useSimulation";

interface Series {
  readonly label: string;
  readonly color: string;
  readonly value: (point: HistoryPoint) => number;
}

const SERIES: readonly Series[] = [
  { label: "stored food energy", color: "#d9a441", value: (point) => point.storedEnergy },
  { label: "living workers", color: "#ffffff", value: (point) => point.workers },
  { label: "developing brood", color: "#83dbed", value: (point) => point.brood },
  { label: "queen reserves", color: "#f7bc70", value: (point) => point.queenEnergy },
  { label: "adult births", color: "#a3dd77", value: (point) => point.births },
  { label: "worker deaths", color: "#d87575", value: (point) => point.deaths },
  { label: "distance", color: "#64b5d8", value: (point) => point.distanceMoved },
  { label: "living workers' turns", color: "#d87575", value: (point) => point.turns },
  { label: "pheromone", color: "#d874d2", value: (point) => point.pheromoneDeposited },
];

function points(history: readonly HistoryPoint[], series: Series): string {
  if (history.length === 0) return "";
  const values = history.map(series.value);
  const maximum = Math.max(1, ...values);
  return values
    .map((value, index) => {
      const span = history[history.length - 1].tick - history[0].tick;
      const x = span === 0 ? 0 : ((history[index].tick - history[0].tick) / span) * 100;
      return `${x},${30 - (value / maximum) * 28}`;
    })
    .join(" ");
}

export function ChartsPanel({ history }: { readonly history: readonly HistoryPoint[] }) {
  return (
    <section className="panel" data-testid="charts-panel">
      <h2>Live ledgers</h2>
      {SERIES.map((series) => (
        <figure className="mini-chart" key={series.label}>
          <figcaption>
            {series.label}
            <span>
              {history.length ? series.value(history[history.length - 1]).toFixed(2) : "—"}
            </span>
          </figcaption>
          <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-label={series.label}>
            <polyline points={points(history, series)} stroke={series.color} />
          </svg>
        </figure>
      ))}
    </section>
  );
}

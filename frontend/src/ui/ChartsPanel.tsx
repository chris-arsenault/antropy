import { TRAIT_LABELS, type WorldStats } from "../sim/stats";
import { DivergingBars } from "./charts/DivergingBars";
import { LineChart } from "./charts/LineChart";
import { CHART } from "./charts/palette";
import { Sparkline } from "./charts/Sparkline";
import { type StatsHistory } from "./useSimulation";

interface ChartsPanelProps {
  history: StatsHistory;
  stats: WorldStats | null;
  /** Redraw trigger. */
  version: number;
}

/** The Act One dashboard (spec §11.4): selection differential first. */
export function ChartsPanel({ history, stats, version }: ChartsPanelProps) {
  return (
    <section className="charts-panel" data-testid="charts-panel">
      <DivergingBars
        title="Selection differential (trait ↔ delivery rate)"
        labels={TRAIT_LABELS}
        values={stats?.selectionDifferential ?? []}
        version={version}
      />
      <LineChart
        title="Population"
        version={version}
        series={[
          { name: "ants", series: history.population, color: CHART.series[0] },
          { name: "eggs", series: history.eggs, color: CHART.series[1] },
        ]}
      />
      <LineChart
        title="Colonies"
        version={version}
        height={60}
        series={[{ name: "colonies", series: history.colonies, color: CHART.series[3] }]}
      />
      <LineChart
        title="Dominant patriline share"
        version={version}
        series={[{ name: "share", series: history.dominantShare, color: CHART.series[2] }]}
      />
      <figure className="chart">
        <figcaption className="chart-title">Gene means</figcaption>
        <div className="sparkline-grid">
          {TRAIT_LABELS.map((label, i) => (
            <Sparkline key={label} label={label} series={history.traitMeans[i]} version={version} />
          ))}
        </div>
      </figure>
    </section>
  );
}

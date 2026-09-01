import { RATIO_BANDS, ratioInBand, type ViabilityRatios } from "../sim/ratios";
import { type WorldStats } from "../sim/stats";

const RATIO_LABELS: Record<keyof ViabilityRatios, string> = {
  tripProfitability: "R1 trip profit",
  satiation: "R2 satiation",
  scentHorizon: "R3 scent horizon",
  foragingReach: "R4 reach",
  trailOverTrip: "R5a trail/trip",
  patchOverTrail: "R5b patch/trail",
  digEconomics: "R6 dig cost",
  ecosystemClosure: "R7 closure",
};

function formatRatio(value: number): string {
  if (!Number.isFinite(value)) {
    return "∞";
  }
  return value >= 100 ? value.toFixed(0) : value.toFixed(2);
}

/** Live §B.3 viability-ratio readout: out-of-band drift at a glance. */
export function RatiosPanel({ stats }: { stats: WorldStats | null }) {
  if (!stats) {
    return null;
  }
  const keys = Object.keys(RATIO_BANDS) as (keyof ViabilityRatios)[];
  return (
    <figure className="chart" data-testid="ratios-panel">
      <figcaption className="chart-title">Viability ratios (§B.3)</figcaption>
      <div className="layer-rows">
        {keys.map((key) => {
          const value = stats.ratios[key];
          const ok = ratioInBand(key, value);
          return (
            <div key={key} className={`layer-row ${ok ? "" : "ratio-out-of-band"}`}>
              <span className="ratio-label">{RATIO_LABELS[key]}</span>
              <span className="ratio-value">{formatRatio(value)}</span>
              {!ok && <span className="ratio-flag">out of band</span>}
            </div>
          );
        })}
        <div className="layer-row">
          <span className="ratio-label">gradient visible</span>
          <span className="ratio-value">{(stats.gradientVisibility * 100).toFixed(0)}%</span>
        </div>
      </div>
    </figure>
  );
}

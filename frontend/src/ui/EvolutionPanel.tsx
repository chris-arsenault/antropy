import { type Estimate } from "../sim/evolutionStats";
import { type WorldStats } from "../sim/stats";

function formatEstimate(estimate: Estimate, digits = 3): string {
  const value = estimate.value === null ? "—" : estimate.value.toFixed(digits);
  return `${value} (n=${estimate.samples})`;
}

/** Live selection-information readout; an em dash means the estimator is not yet identified. */
export function EvolutionPanel({ stats }: { stats: WorldStats | null }) {
  if (!stats) return null;
  const evolution = stats.evolution;
  return (
    <figure className="chart" data-testid="evolution-panel">
      <figcaption className="chart-title">Evolution health</figcaption>
      <div className="layer-rows">
        <div className="layer-row">
          <span className="ratio-label">delivery heritability</span>
          <span className="ratio-value">{formatEstimate(evolution.deliveryHeritability)}</span>
        </div>
        <div className="layer-row">
          <span className="ratio-label">lifespan heritability</span>
          <span className="ratio-value">{formatEstimate(evolution.lifespanHeritability)}</span>
        </div>
        <div className="layer-row">
          <span className="ratio-label">effective population</span>
          <span className="ratio-value">
            {formatEstimate(evolution.effectivePopulation, 1)} / census{" "}
            {evolution.effectivePopulation.census}
          </span>
        </div>
        <div className="layer-row">
          <span className="ratio-label">genome diversity</span>
          <span className="ratio-value">{formatEstimate(evolution.pairwiseGenomeDistance)}</span>
        </div>
        <div className="layer-row">
          <span className="ratio-label">distance from founders</span>
          <span className="ratio-value">{formatEstimate(evolution.founderGenomeDistance)}</span>
        </div>
        <div className="layer-row">
          <span className="ratio-label">founder lines represented</span>
          <span className="ratio-value">
            {evolution.founderLines.representedLines}/{evolution.founderLines.totalLines}
          </span>
        </div>
      </div>
    </figure>
  );
}

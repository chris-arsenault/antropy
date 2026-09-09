import { type World } from "../sim/types";
import { energyResidual } from "../sim/resources";

export function RatiosPanel({ world }: { readonly world: World }) {
  const reversals = world.ants.reduce((total, ant) => total + ant.immediateTurnReversals, 0);
  const movementFraction = world.economy.movement / Math.max(1, world.economy.workerTicks);
  const reversalFraction = reversals / Math.max(1, world.economy.workerTicks);
  const pickupReturnGap =
    world.economy.completedReturns === 0
      ? null
      : world.economy.returnTicks / world.economy.completedReturns;
  return (
    <section className="panel" data-testid="ratios-panel">
      <h2>Behavior ratios</h2>
      <dl className="metrics">
        <div>
          <dt>movement / worker tick</dt>
          <dd>{movementFraction.toFixed(3)}</dd>
        </div>
        <div>
          <dt>living-worker reversals / worker tick</dt>
          <dd>{reversalFraction.toFixed(4)}</dd>
        </div>
        <div>
          <dt>mean pickup to deposit</dt>
          <dd>{pickupReturnGap === null ? "—" : `${pickupReturnGap.toFixed(0)} ticks`}</dd>
        </div>
        <div>
          <dt>active odor cells</dt>
          <dd>{world.foodOdor.activeCount + world.nestOdor.activeCount}</dd>
        </div>
        <div>
          <dt>active pheromone cells</dt>
          <dd>{world.pheromoneA.activeCount + world.pheromoneB.activeCount}</dd>
        </div>
        <div>
          <dt>deaths / eggs / hatches</dt>
          <dd>{`${world.metrics.deaths} / ${world.metrics.workerEggs} / ${world.metrics.workerHatches}`}</dd>
        </div>
        <div>
          <dt>age / starvation deaths</dt>
          <dd>
            {world.economy.ageDeaths} / {world.economy.starvationDeaths}
          </dd>
        </div>
        <div>
          <dt>brood deaths</dt>
          <dd>{world.economy.broodDeaths}</dd>
        </div>
        <div>
          <dt>queen / brood fed</dt>
          <dd>
            {world.economy.queenFed.toFixed(1)} / {world.economy.broodFed.toFixed(1)}
          </dd>
        </div>
        <div>
          <dt>external food energy harvested</dt>
          <dd>{world.economy.harvested.toFixed(1)}</dd>
        </div>
        <div>
          <dt>energy balance residual</dt>
          <dd>{energyResidual(world).toExponential(2)}</dd>
        </div>
      </dl>
    </section>
  );
}

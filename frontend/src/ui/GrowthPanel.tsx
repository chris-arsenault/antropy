import { type World } from "../sim/types";
import { growthSnapshot } from "../sim/reproduction";
import { nestArea } from "../sim/construction/nestArea";

export function GrowthPanel({ world }: { readonly world: World }) {
  const growth = growthSnapshot(world);
  const area = nestArea(world);
  const history = world.queen.decision.history;
  const last = history[history.length - 1];
  return (
    <section className="panel">
      <h2>Colony growth</h2>
      <p>
        Queen · task {world.queen.task} · {last?.request.kind ?? "not acted"}
        {" · "}
        {world.queen.decision.result} · food carried {world.queen.cargo.toFixed(1)}
      </p>
      <dl className="metrics">
        <div>
          <dt>Connected nest area</dt>
          <dd>
            {area.current} cells · started {area.initial} · {area.ratio.toFixed(2)}×
          </dd>
        </div>
        <div>
          <dt>Workers / starting workers</dt>
          <dd>
            {world.ants.length} / {world.config.workerCount}
          </dd>
        </div>
        <div>
          <dt>Births / deaths</dt>
          <dd>
            {world.metrics.workerHatches} / {growth.deaths}
          </dd>
        </div>
        <div>
          <dt>Eggs / larvae / pupae</dt>
          <dd>
            {growth.eggs} / {growth.larvae} / {growth.pupae}
          </dd>
        </div>
        <div>
          <dt>Larvae still needing growth food</dt>
          <dd>{growth.unfundedLarvae}</dd>
        </div>
      </dl>
      <p>
        {growth.laying} · current egg interval {growth.layingPeriod} ticks
      </p>
    </section>
  );
}

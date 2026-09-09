import { localClimate } from "../sim/climate/state";
import { type World } from "../sim/types";

export function HabitatPanel({ world }: { readonly world: World }) {
  const climate = localClimate(world, world.queen);
  const jobs = world.construction.jobs;
  const completed = world.construction.completed;
  const active = jobs.filter((job) => job.status === "active");
  const work = active.map((job) => `${job.kind} · worker ${job.owner}`).join(", ");
  return (
    <section className="panel" data-testid="habitat-panel">
      <h2>Nest conditions</h2>
      <p>Temperature: blue 10°C · green 25°C · red 40°C.</p>
      <dl className="metrics">
        <div>
          <dt>Queen surroundings</dt>
          <dd>
            {climate.temperature.toFixed(1)}°C · {(climate.moisture * 100).toFixed(0)}% moisture
          </dd>
        </div>
        <div>
          <dt>Cells excavated</dt>
          <dd data-testid="excavated-cells">{world.construction.excavated}</dd>
        </div>
        <div>
          <dt>Spoil placed</dt>
          <dd data-testid="deposited-spoil">{world.construction.deposited}</dd>
        </div>
        <div>
          <dt>Workers hauling spoil</dt>
          <dd>{world.ants.filter((ant) => ant.spoil !== null).length}</dd>
        </div>
        <div>
          <dt>Queen relocations</dt>
          <dd data-testid="queen-moves">{completed.queen}</dd>
        </div>
        <div>
          <dt>Brood relocations</dt>
          <dd data-testid="brood-moves">{completed.brood}</dd>
        </div>
        <div>
          <dt>Caches / relocations</dt>
          <dd>
            <span data-testid="cache-count">{world.caches.size}</span> /{" "}
            <span data-testid="cache-moves">{completed["move-cache"]}</span>
          </dd>
        </div>
        <div>
          <dt>Additional storage sites built</dt>
          <dd data-testid="cache-builds">{completed.cache}</dd>
        </div>
        <div>
          <dt>Food energy spoiled</dt>
          <dd>{world.climate.spoiledEnergy.toFixed(3)}</dd>
        </div>
      </dl>
      <p>{work ? `Current work: ${work}` : "No active construction"}</p>
    </section>
  );
}

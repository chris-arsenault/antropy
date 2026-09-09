import { type World } from "../sim/types";
import { type evolutionStats } from "../sim/evolutionStats";

const range = (value: { min: number; max: number } | null) =>
  value ? `${value.min.toFixed(3)}–${value.max.toFixed(3)}` : "No living cells";
export function EvolutionStats({
  world,
  stats,
}: {
  world: World;
  stats: ReturnType<typeof evolutionStats>;
}) {
  const c = world.config;
  return (
    <>
      <h3>Evolution</h3>
      <p>
        {c.ploidy} · {c.transmission} · {c.reproduction} · {c.learning} learning
      </p>
      <dl className="metrics">
        <div>
          <dt>Body radius range</dt>
          <dd>{range(stats.radius)}</dd>
        </div>
        <div>
          <dt>Births inheriting learning</dt>
          <dd>{world.ledger.learnedBirths}</dd>
        </div>
        <div>
          <dt>Learning retained at birth</dt>
          <dd>{(100 * c.learningRetention).toFixed(0)}%</dd>
        </div>
        <div>
          <dt>Installed motor power</dt>
          <dd>{range(stats.motor)}</dd>
        </div>
        <div>
          <dt>Installed uptake ceiling</dt>
          <dd>{range(stats.uptake)}</dd>
        </div>
        <div>
          <dt>Built food storage capacity</dt>
          <dd>{range(stats.storage)}</dd>
        </div>
        <div>
          <dt>Mean acquired weight change</dt>
          <dd>{stats.meanLearned.toExponential(2)}</dd>
        </div>
        <div>
          <dt>Learning energy spent</dt>
          <dd>{world.ledger.learning.toFixed(4)}</dd>
        </div>
        <div>
          <dt>Recombined births</dt>
          <dd>{world.ledger.recombinations}</dd>
        </div>
      </dl>
    </>
  );
}

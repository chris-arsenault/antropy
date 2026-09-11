import { type inheritedStats } from "../sim/inheritedStats";
import { BODY_NAMES } from "../sim/body";

type Stats = ReturnType<typeof inheritedStats>;
export function InheritedTraits({ stats }: { stats: Stats }) {
  const distance = stats.controllerDistance;
  return (
    <div className="inherited-traits">
      <h3>Inherited construction targets</h3>
      <p>
        Newborn blueprint, independent of current growth. Ranges cover the middle 80% of living
        cells.
      </p>
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Target range</th>
            <th>Mean vs founder</th>
          </tr>
        </thead>
        <tbody>
          {stats.traits.map((t) => (
            <tr key={t.part}>
              <td>{BODY_NAMES[t.part]}</td>
              <td>{t.target ? `${t.target.p10.toFixed(3)}–${t.target.p90.toFixed(3)}` : "—"}</td>
              <td>{t.relative ? `${((t.relative.mean - 1) * 100).toFixed(1)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="metrics">
        <div>
          <dt>Distinct inherited sequences</dt>
          <dd>{stats.uniqueSequences}</dd>
        </div>
        <div>
          <dt>RNN distance from founder · median</dt>
          <dd>{distance ? distance.median.toExponential(2) : "—"}</dd>
        </div>
      </dl>
      <p>
        Exact sequence differences include inherited learning. Neither sequence count nor founder
        dominance proves adaptation.
      </p>
    </div>
  );
}

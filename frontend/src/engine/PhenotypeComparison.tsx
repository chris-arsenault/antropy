import {
  PHENOTYPE_TRAITS,
  type PhenotypeReport,
  type Quantiles,
  type Activity,
  type PhenotypeGroup,
} from "./phenotypes";

const format = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 3 });
function QuantileValue({ value }: { value: Quantiles }) {
  if (!value) return <span>—</span>;
  return (
    <>
      <strong>{format(value[1])}</strong>
      <small>
        {format(value[0])}–{format(value[2])}
      </small>
    </>
  );
}

export function GroupComparison({ report }: { report: PhenotypeReport }) {
  const groups = report.pin ? report.groups : report.groups.slice(0, 2);
  return (
    <>
      <div className="phenotype-table-scroll">
        <table className="phenotype-table">
          <caption>
            Median and 10th–90th percentiles. Targets show inherited construction proportions; built
            mass also reflects growth. Membrane coordinates wrap at 16; ranges across that boundary
            are not distances.
          </caption>
          <thead>
            <tr>
              <th>Trait</th>
              {groups.map((g, i) => (
                <th key={i}>
                  {["World", "Selected", "Pinned"][i]}
                  <small>{g.count.toLocaleString()} living</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHENOTYPE_TRAITS.map((label, i) => (
              <tr key={label}>
                <th>{label}</th>
                {groups.map((g, j) => (
                  <td key={j}>
                    <QuantileValue value={g.actual[i]} />
                    {i < 5 && (
                      <div className="inherited-target">
                        Target <QuantileValue value={g.target[i]} />
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th>Local illumination</th>
              {groups.map((g, i) => (
                <td key={i}>{g.illumination === null ? "—" : format(g.illumination)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <WorkComparison groups={groups} />
    </>
  );
}

function WorkComparison({ groups }: { groups: PhenotypeGroup[] }) {
  return (
    <>
      <h3>Recent work per living-cell second</h3>
      <div className="phenotype-table-scroll">
        <table className="phenotype-table">
          <thead>
            <tr>
              <th>Account</th>
              {groups.map((_, i) => (
                <th key={i}>{["World", "Selected", "Pinned"][i]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACCOUNTS.map(([label, get]) => (
              <tr key={label}>
                <th>{label}</th>
                {groups.map((g, i) => (
                  <td key={i}>
                    {g.activity && g.activity.organismSeconds > 0
                      ? format(get(g.activity) / g.activity.organismSeconds)
                      : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const ACCOUNTS: [string, (a: Activity) => number][] = [
  ["Captured usable energy", (a) => a.flows.captured],
  ["External work supplied", (a) => a.flows.externalWork],
  ["Maintenance", (a) => a.flows.maintenance],
  ["Movement", (a) => a.flows.motors],
  ["Transport", (a) => a.flows.transport],
  ["Reaction heat", (a) => a.flows.reactionHeat],
  ["Construction / division", (a) => a.flows.construction + a.division],
  ["Repair / learning", (a) => a.flows.repair + a.flows.learning],
  ["Overflow", (a) => a.overflow],
];

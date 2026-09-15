import { type ChemicalOverview, type Definition } from "./types";
import { ChemicalAtlas } from "./ChemicalAtlas";
import { quantity } from "./chemicalDisplay";
import "./chemicals.css";

export function ChemicalPanel({
  chemicals,
  definition,
  selected,
  select,
}: {
  chemicals: ChemicalOverview;
  definition: Definition;
  selected: number;
  select: (id: number) => void;
}) {
  const row = chemicals.rows.find((r) => r.id === selected);
  const percent = (n: number) => (chemicals.total > 0 ? (100 * n) / chemicals.total : 0);
  return (
    <section className="panel chemical-panel">
      <h2>Dissolved chemicals</h2>
      <p>
        {quantity(chemicals.total)} material · {chemicals.present} IDs present · tick{" "}
        {chemicals.tick.toLocaleString()}
      </p>
      <p>Most abundant in the environment. Select an ID to show its concentration on the map.</p>
      <table>
        <thead>
          <tr>
            <th>ID / share</th>
            <th>Amount</th>
            <th>Peak / area</th>
          </tr>
        </thead>
        <tbody>
          {chemicals.rows.map((r) => (
            <tr key={r.id} aria-selected={r.id === selected}>
              <td>
                <button
                  aria-label={`Show chemical ${r.id}`}
                  aria-pressed={r.id === selected}
                  onClick={() => select(r.id)}
                >
                  #{r.id} <span>{percent(r.amount).toFixed(1)}%</span>
                  <progress
                    className="chemical-bar"
                    max="100"
                    value={percent(r.amount)}
                    aria-label={`Chemical ${r.id} share`}
                  />
                </button>
              </td>
              <td>{quantity(r.amount)}</td>
              <td>{quantity(r.peak)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {chemicals.total === 0 && <p>No dissolved chemistry at this observation.</p>}
      {chemicals.other > 0 && (
        <p>
          Other IDs: {quantity(chemicals.other)} material ({percent(chemicals.other).toFixed(1)}%).
        </p>
      )}
      <ChemicalProperties
        definition={definition}
        selected={selected}
        select={select}
        listed={!!row}
      />
      <RankedProperties chemicals={chemicals} definition={definition} />
      <p>
        Amounts exclude material inside cells and unreleased source reserves. Peak is the highest
        mesh concentration.
      </p>
      <ChemicalAtlas definition={definition} machinery={null} />
    </section>
  );
}

function ChemicalProperties({
  definition,
  selected,
  select,
  listed,
}: {
  definition: Definition;
  selected: number;
  select: (id: number) => void;
  listed: boolean;
}) {
  const properties = definition.chemistry.properties[selected];
  return (
    <details open>
      <summary>Chemical #{selected} · physical properties</summary>
      <label>
        Inspect chemical ID{" "}
        <input
          type="number"
          min="0"
          max="255"
          value={selected}
          onChange={(e) => {
            const id = Number(e.target.value);
            if (Number.isInteger(id) && id >= 0 && id < 256) select(id);
          }}
        />
      </label>
      <dl className="metrics">
        <div>
          <dt>Potential · energy / material</dt>
          <dd>{quantity(properties.potential)}</dd>
        </div>
        <div>
          <dt>Diffusion · area / model second</dt>
          <dd>{quantity(properties.diffusion)}</dd>
        </div>
        <div>
          <dt>Impedance coefficient</dt>
          <dd>{quantity(properties.impedance)}</dd>
        </div>
        <div>
          <dt>Stress coefficient</dt>
          <dd>{quantity(properties.stress)}</dd>
        </div>
      </dl>
      {!listed && <p>This ID is outside the top 12 dissolved chemicals; it may be absent.</p>}
      <p>
        {definition.config.sourceSpecies.includes(selected) ? "Included in source mixtures. " : ""}
        {definition.chemistry.decomposition === selected ? "Decomposition product. " : ""}
        Potential is stored chemical energy, not energy a cell can necessarily harvest.
      </p>
    </details>
  );
}

function RankedProperties({
  chemicals,
  definition,
}: {
  chemicals: ChemicalOverview;
  definition: Definition;
}) {
  return (
    <details>
      <summary>Properties of the ranked chemicals</summary>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Potential</th>
            <th>Diffusion</th>
            <th>Impedance</th>
            <th>Stress</th>
          </tr>
        </thead>
        <tbody>
          {chemicals.rows.map(({ id }) => (
            <tr key={id}>
              <td>#{id}</td>
              {(["potential", "diffusion", "impedance", "stress"] as const).map((key) => (
                <td key={key}>{quantity(definition.chemistry.properties[id][key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

import { useCallback, useEffect, useState } from "react";
import { type Bridge } from "./bridge";
import { type ChemicalWeb, type WebQuery, type WebMode } from "./chemicalWeb";
import { ChemicalWebGraph } from "./ChemicalWebGraph";
import { identityColor } from "./genealogyHistory";
import "./chemicalWeb.css";

interface Props {
  bridge: Bridge;
  web: ChemicalWeb | null;
  color: number;
  setColor: (color: number) => void;
  selectChemical: (species: number) => void;
  error: (error: unknown) => void;
}
export function ChemicalWebPanel({ bridge, web, color, setColor, selectChemical, error }: Props) {
  const [query, setQuery] = useState<WebQuery>({ mode: "primary", focus: null, offset: 0 });
  const focus = useCallback((id: number) => setQuery((q) => ({ ...q, focus: id, offset: 0 })), []);
  useEffect(() => {
    bridge.call("chemicalWeb", { ...query }).catch(error);
  }, [bridge, query, error]);
  useEffect(
    () => () => {
      bridge.call("chemicalWeb", { enabled: false }).catch(error);
    },
    [bridge, error]
  );
  const current = web?.mode === query.mode && web.focus === query.focus ? web : null;
  return (
    <section className="chemical-web-panel">
      <p className="panel-intro">
        Follow the population’s chemical roles. Arrows connect enzyme inputs to their products.
      </p>
      <WebFilter query={query} setQuery={setQuery} selectChemical={selectChemical} />
      <div className="web-controls">
        <span>Color cells by</span>
        <button aria-pressed={color === 14} onClick={() => setColor(14)}>
          Enzyme input
        </button>
        <button aria-pressed={color === 15} onClick={() => setColor(15)}>
          Enzyme output
        </button>
      </div>
      <WebMeaning mode={query.mode} />
      {current ? (
        <WebResult web={current} focus={focus} setQuery={setQuery} />
      ) : (
        <p role="status">Reading current chemical routes…</p>
      )}
    </section>
  );
}

function WebMeaning({ mode }: { mode: WebMode }) {
  if (mode === "environment")
    return (
      <p className="web-meaning">
        Possible transformations from this world’s environmental chemistry. Local material, medium
        and exposure determine activity. Dashed arrows show possibilities, not measured flow.
      </p>
    );
  return (
    <div className="web-meaning">
      <p>
        {mode === "primary"
          ? "Each cell appears once, under its strongest installed enzyme route. These counts match the input/output map colors."
          : "A cell is counted once for every chemical pair its funded enzymes support. Counts overlap; four enzymes and mixed products can give one cell several routes."}
      </p>
      <details>
        <summary>How roles are assigned</summary>
        <p>
          Strength is built enzyme stock × compiled catalytic coefficient × product weight.
          Installed machinery determines the routes; inherited targets may still be awaiting paid
          refitting. These are capabilities, not measured intake, waste export or cross-feeding.
        </p>
      </details>
    </div>
  );
}
function RouteTable({ web, focus }: { web: ChemicalWeb; focus: (id: number) => void }) {
  if (!web.rows.length) return <p>No routes in this view.</p>;
  const environment = web.mode === "environment";
  return (
    <table className="web-route-table">
      <thead>
        <tr>
          <th>Input → output</th>
          <th>{environment ? "Process" : "Primary cells"}</th>
          <th>{environment ? "" : "Supporting cells"}</th>
        </tr>
      </thead>
      <tbody>
        {web.rows.map((row) => (
          <tr key={`${row.input}-${row.output}`}>
            <td>
              <ChemicalLink id={row.input} focus={focus} />
              <span aria-hidden="true"> → </span>
              <ChemicalLink id={row.output} focus={focus} />
            </td>
            <td>{environment ? "Environmental conversion" : row.primary.toLocaleString()}</td>
            <td>{environment ? "" : row.cells.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function ChemicalLink({ id, focus }: { id: number; focus: (id: number) => void }) {
  return (
    <button onClick={() => focus(id)} aria-label={`Filter routes for chemical ${id}`}>
      <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
        <circle cx="5" cy="5" r="4" fill={identityColor(id)} />
      </svg>{" "}
      {id}
    </button>
  );
}

type SetQuery = React.Dispatch<React.SetStateAction<WebQuery>>;
function WebFilter({
  query,
  setQuery,
  selectChemical,
}: {
  query: WebQuery;
  setQuery: SetQuery;
  selectChemical: Props["selectChemical"];
}) {
  return (
    <div className="web-controls">
      <label>
        Routes{" "}
        <select
          value={query.mode}
          onChange={(e) => setQuery((q) => ({ ...q, mode: e.target.value as WebMode, offset: 0 }))}
        >
          <option value="primary">Primary cell roles</option>
          <option value="supported">All supported enzyme routes</option>
          <option value="environment">Environmental pathways</option>
        </select>
      </label>
      <label>
        Chemical{" "}
        <input
          type="number"
          min="0"
          max="255"
          placeholder="All"
          value={query.focus ?? ""}
          onChange={(e) => {
            const id = e.target.value === "" ? null : Number(e.target.value);
            if (id === null || (Number.isInteger(id) && id >= 0 && id < 256))
              setQuery((q) => ({ ...q, focus: id, offset: 0 }));
          }}
        />
      </label>
      {query.focus !== null && (
        <>
          <button onClick={() => setQuery((q) => ({ ...q, focus: null, offset: 0 }))}>
            All chemicals
          </button>
          <button onClick={() => selectChemical(query.focus!)}>Show chemical on map</button>
        </>
      )}
    </div>
  );
}
function WebResult({
  web,
  focus,
  setQuery,
}: {
  web: ChemicalWeb;
  focus: (id: number) => void;
  setQuery: SetQuery;
}) {
  return (
    <>
      <p className="web-census">
        Tick {web.tick.toLocaleString()} · {web.population.toLocaleString()} living cells ·{" "}
        {web.unassigned.toLocaleString()} without a funded conversion
      </p>
      <ChemicalWebGraph web={web} focus={focus} />
      <p className="web-caption">
        Select a chemical to follow its incoming and outgoing routes. Ringed nodes are present in
        releasing reservoirs. Colors match the enzyme map views.
      </p>
      <RouteTable web={web} focus={focus} />
      <div className="web-pages">
        <button
          disabled={web.offset === 0}
          onClick={() => setQuery((q) => ({ ...q, offset: Math.max(0, web.offset - 64) }))}
        >
          Previous routes
        </button>
        <span>
          {web.rows.length ? web.offset + 1 : 0}–{web.offset + web.rows.length} of {web.pairs}{" "}
          routes
        </span>
        <button
          disabled={web.offset + 64 >= web.pairs}
          onClick={() => setQuery((q) => ({ ...q, offset: web.offset + 64 }))}
        >
          Next routes
        </button>
      </div>
      {web.pairs > 64 && (
        <p>
          Graph and table show this page only. Use a chemical filter to follow all routes connected
          to it.
        </p>
      )}
    </>
  );
}

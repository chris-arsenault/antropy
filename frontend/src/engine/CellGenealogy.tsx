import { type Bridge } from "./bridge";
import { useCallback } from "react";
import { type Ancestor, type Inspection } from "./types";
import "./genealogy.css";

interface Props {
  inspection: Inspection;
  bridge: Bridge;
  error: (e: unknown) => void;
}
function life(a: Ancestor) {
  if (a.ended === null) return "alive";
  return `${a.cause === "division" ? "divided" : "ended"} at tick ${a.ended.toLocaleString()}`;
}
export function CellGenealogy({ inspection: p, bridge, error }: Props) {
  const g = p.genealogy;
  const select = useCallback(
    (id: number) => bridge.call("inspect", { cell: id }).catch(error),
    [bridge, error]
  );
  return (
    <div>
      <h3>Family and genealogy</h3>
      <p>
        Generation {g.generation} ·{" "}
        <button onClick={() => select(g.family)}>Family F{g.family}</button>
        {" · "}
        <button onClick={() => select(p.ancestor.lineage)}>Founder {p.ancestor.lineage}</button>
      </p>
      <p>
        Family root born at tick {g.familyBorn.toLocaleString()}, generation {g.familyGeneration}.
        {g.parentFamily !== null && (
          <>
            {" "}
            From <button onClick={() => select(g.parentFamily!)}>F{g.parentFamily}</button>.
          </>
        )}
      </p>
      <p>
        <strong>{g.descendantCount.toLocaleString()} living descendants</strong> of this cell
        {p.cell ? " (excluding itself)." : "."}
        {p.ancestor.cause === "division" &&
          " The parent divided; its branch can continue through daughters."}
      </p>
      <details open>
        <summary>Ancestor path</summary>
        {g.hiddenAncestors > 0 && (
          <p>
            {g.hiddenAncestors.toLocaleString()} earlier ancestors omitted here. Select the earliest
            shown cell to walk farther back; the complete parentage remains saved.
          </p>
        )}
        <ol className="genealogy-tree">
          {[...g.path].reverse().map((a) => (
            <li key={a.id} aria-current={a.id === p.ancestor.id ? "true" : undefined}>
              <button onClick={() => select(a.id)}>Cell {a.id}</button>
              {a.id === p.ancestor.id && " · selected"}
              <small>
                born {a.born.toLocaleString()} · {life(a)} · genotype {a.genome}
              </small>
            </li>
          ))}
        </ol>
      </details>
      <RelativeList label="Children" records={g.children} total={g.childCount} select={select} />
      <RelativeList label="Siblings" records={g.siblings} total={g.siblingCount} select={select} />
      <RelativeList
        label="Living descendants"
        records={g.descendants}
        total={g.descendantCount}
        select={select}
      />
      <p>
        Family membership covers four generations; founder ancestry follows the complete recorded
        chain.
      </p>
    </div>
  );
}
function RelativeList({
  label,
  records,
  total,
  select,
}: {
  label: string;
  records: Ancestor[];
  total: number;
  select: (id: number) => void;
}) {
  return (
    <details open={label === "Children"}>
      <summary>
        {label} · {total.toLocaleString()}
      </summary>
      {total === 0 ? (
        <p>None recorded.</p>
      ) : (
        <div className="genealogy-relations">
          {records.map((a) => (
            <button
              key={a.id}
              onClick={() => select(a.id)}
              title={`Born ${a.born}; ${life(a)}; genotype ${a.genome}`}
            >
              Cell {a.id} · {life(a)}
            </button>
          ))}
        </div>
      )}
      {records.length < total && (
        <p>
          Showing the first {records.length} of {total.toLocaleString()}; select a branch to explore
          it.
        </p>
      )}
    </details>
  );
}

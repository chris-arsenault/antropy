import { type Bridge } from "./bridge";
import { useState } from "react";
import { type LiveStatus } from "./types";
import {
  chartGroups,
  countAt,
  identityColor,
  shareAt,
  shareHistory,
  sharePath,
  type GroupKind,
  type SharePoint,
} from "./genealogyHistory";
import "./genealogy.css";

interface Props {
  status: LiveStatus;
  bridge: Bridge;
  error: (e: unknown) => void;
}
const groupName = (kind: GroupKind, id: number) =>
  kind === "families" ? `F${id}` : `Founder ${id}`;
const percent = (n: number | null) => (n === null ? "not sampled" : `${n.toFixed(1)}%`);
const changeText = (n: number | null) => {
  if (n === null) return "change unavailable";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)} pp`;
};

export function GenealogyPanel(props: Props) {
  return (
    <div className="genealogy-panel">
      <h3>Genealogy</h3>
      <FindAncestor bridge={props.bridge} error={props.error} />
      <GroupPanel {...props} kind="families" />
      <GroupPanel {...props} kind="lineages" />
    </div>
  );
}
function FindAncestor({ bridge, error }: Pick<Props, "bridge" | "error">) {
  const [id, setId] = useState("1");
  const inspect = () => {
    const cell = Number(id);
    if (!Number.isSafeInteger(cell) || cell < 1) {
      error(new Error("Enter a positive cell ID"));
      return;
    }
    bridge.call("inspect", { cell }).catch(error);
  };
  return (
    <div className="genealogy-key">
      <label>
        Recorded cell ID{" "}
        <input type="number" min="1" step="1" value={id} onChange={(e) => setId(e.target.value)} />
      </label>
      <button onClick={inspect}>Inspect ancestry</button>
    </div>
  );
}
function GroupPanel({ status, bridge, error, kind }: Props & { kind: GroupKind }) {
  const points = shareHistory(status, kind),
    ids = chartGroups(points, kind),
    current = points[points.length - 1];
  const rows = [...new Set([...current[kind].slice(0, 8).map(([id]) => id), ...ids])];
  const select = (id: number) => bridge.call("inspect", { cell: id }).catch(error);
  const title = kind === "families" ? "Recent families" : "Founder ancestry";
  return (
    <details open className="lineage-panel">
      <summary>
        {title} · {status.population[kind].total} living groups
      </summary>
      <ShareChart points={points} ids={ids} kind={kind} />
      <div className="genealogy-key">
        {ids.map((id) => (
          <button key={id} onClick={() => select(id)}>
            <Swatch id={id} />
            {groupName(kind, id)}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>Group / origin</th>
            <th>Living</th>
            <th>Share / change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((id) => (
            <GroupRow
              key={id}
              id={id}
              kind={kind}
              points={points}
              status={status}
              select={select}
            />
          ))}
        </tbody>
      </table>
      {!rows.length && <p>No groups in the retained samples.</p>}
      <p>
        Changes are percentage points since tick {points[0].tick.toLocaleString()}. Lines include
        current leaders and previously prominent groups. Shares use all living cells.
      </p>
      {kind === "families" && (
        <p>
          Families span four generations. Zero members can mean continuation in younger families;
          select the root to check living descendants.
        </p>
      )}
      <p>
        Older samples are thinned. Only the largest 64 groups are retained per sample; missing
        coverage is shown as a gap, not extinction.
      </p>
      {kind === "families" && <FamilyTraits status={status} />}
    </details>
  );
}
function Swatch({ id }: { id: number }) {
  return (
    <svg viewBox="0 0 10 10" className="genealogy-swatch" aria-hidden="true">
      <circle cx="5" cy="5" r="4" fill={identityColor(id)} />
    </svg>
  );
}
function GroupRow({
  id,
  kind,
  points,
  status,
  select,
}: {
  id: number;
  kind: GroupKind;
  points: SharePoint[];
  status: LiveStatus;
  select: (id: number) => void;
}) {
  const current = points[points.length - 1],
    n = countAt(current, kind, id),
    now = shareAt(current, kind, id),
    before = shareAt(points[0], kind, id);
  const origin =
    kind === "families" ? status.population.familyProfiles.find((p) => p.id === id) : null;
  const change = now === null || before === null ? null : now - before;
  return (
    <tr>
      <td>
        <button onClick={() => select(id)}>
          <Swatch id={id} />
          {groupName(kind, id)}
        </button>
        {origin && (
          <small>
            {origin.parent === null ? "founder family" : `from F${origin.parent}`} · gen{" "}
            {origin.generation}
          </small>
        )}
        {origin && <small>born tick {origin.born.toLocaleString()}</small>}
      </td>
      <td>{n ?? "not sampled"}</td>
      <td>
        {percent(now)}
        <small>{changeText(change)}</small>
      </td>
    </tr>
  );
}
function ShareChart({
  points,
  ids,
  kind,
}: {
  points: SharePoint[];
  ids: number[];
  kind: GroupKind;
}) {
  const peak = Math.max(5, ...points.flatMap((p) => ids.map((id) => shareAt(p, kind, id) ?? 0)));
  const ceiling = Math.min(100, Math.ceil(peak / 5) * 5);
  return (
    <svg
      viewBox="0 0 300 120"
      role="img"
      aria-label={`${kind === "families" ? "Family" : "Founder"} population shares over time`}
    >
      <path d="M32 12H292 M32 52H292 M32 92H292" className="chart-grid" />
      <text x="28" y="16" textAnchor="end">
        {ceiling}%
      </text>
      <text x="28" y="96" textAnchor="end">
        0%
      </text>
      {ids.map((id) => (
        <path
          key={id}
          d={sharePath(points, kind, id, ceiling)}
          fill="none"
          stroke={identityColor(id)}
          strokeWidth="2"
        >
          <title>{groupName(kind, id)}</title>
        </path>
      ))}
      <text x="32" y="112">
        Tick {points[0].tick.toLocaleString()}
      </text>
      <text x="292" y="112" textAnchor="end">
        {points[points.length - 1].tick.toLocaleString()}
      </text>
    </svg>
  );
}
function FamilyTraits({ status }: { status: LiveStatus }) {
  return (
    <details>
      <summary>Family inherited traits</summary>
      <table>
        <thead>
          <tr>
            <th>Family</th>
            <th>Motor / core</th>
            <th>Membrane X, Y</th>
          </tr>
        </thead>
        <tbody>
          {status.population.familyProfiles.slice(0, 8).map((p) => (
            <tr key={p.id}>
              <td>F{p.id}</td>
              <td>{p.motor.toFixed(2)}%</td>
              <td>{p.membrane.map((v) => v.toFixed(2)).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Means across living members. Inherited targets are separate from grown bodies.</p>
    </details>
  );
}

import { type World } from "../sim/types";
import { familyCounts, familyOrigin, continuesThroughChildren, branch } from "../observe/ancestry";
import { traitValues } from "../observe/traits";
import { type PopulationPoint, appendPoint } from "./populationHistory";
import { identityColor } from "./populationColors";
import { LineageChart } from "./LineagePanel";
import "./populationObservation.css";

function FamilyName({ id }: { id: number }) {
  return (
    <>
      <svg className="family-swatch" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="4" fill={identityColor(id)} />
      </svg>
      F{id}
    </>
  );
}

function chartFamilies(points: PopulationPoint[], current: [number, number][]) {
  const peak = new Map<number, number>();
  for (const p of points)
    for (const [id, n] of p.families)
      peak.set(id, Math.max(peak.get(id) ?? 0, n / Math.max(1, p.population)));
  const ids = new Set(current.slice(0, 2).map(([id]) => id));
  for (const [id] of [...peak].sort((a, b) => b[1] - a[1] || a[0] - b[0])) {
    if (ids.size >= 4) break;
    ids.add(id);
  }
  return [...ids].map(
    (id) => [id, current.find(([key]) => key === id)?.[1] ?? 0] as [number, number]
  );
}
interface FamilyProfile {
  n: number;
  motor: number;
  foodA: number;
}
function profiles(world: World) {
  const result = new Map<number, FamilyProfile>();
  for (const cell of world.cells) {
    const id = branch(world, cell.id).family,
      values = traitValues(world, cell.genome);
    const row = result.get(id) ?? { n: 0, motor: 0, foodA: 0 };
    row.n++;
    row.motor += values.motor;
    row.foodA += values.foodA;
    result.set(id, row);
  }
  return result;
}

function FamilyRow({
  world,
  id,
  n,
  first,
  values,
  onSelect,
}: {
  world: World;
  id: number;
  n: number;
  first: PopulationPoint;
  values: FamilyProfile | null;
  onSelect: (id: number) => void;
}) {
  const origin = familyOrigin(world, id);
  const share = (100 * n) / Math.max(1, world.cells.length);
  const previous =
    (100 * (first.families.find(([key]) => key === id)?.[1] ?? 0)) / Math.max(1, first.population);
  return (
    <tr>
      <td>
        <button
          className="family-link"
          onClick={() => onSelect(id)}
          title="Inspect the family root and living relatives"
        >
          <FamilyName id={id} />
        </button>
        <small>{origin.parent === null ? "founder" : `from F${origin.parent}`}</small>
      </td>
      <td>
        {share.toFixed(1)}%
        <small>
          {(share - previous).toFixed(1)} pp
          {n === 0 &&
            (continuesThroughChildren(world, id)
              ? " · continued in subfamilies"
              : " · no living descendants")}
        </small>
      </td>
      <td>{values ? (values.motor / values.n).toFixed(2) + "%" : "—"}</td>
      <td>{values ? (values.foodA / values.n).toFixed(1) + "%" : "—"}</td>
    </tr>
  );
}
export function FamilyPanel({
  world,
  history,
  onSelect,
}: {
  world: World;
  history: PopulationPoint[];
  onSelect: (id: number) => void;
}) {
  const current = familyCounts(world),
    profile = profiles(world);
  const points = appendPoint(history, world).filter(
    (p) => Array.isArray(p.families) && p.tick >= world.tick - 2000
  );
  const plotted = chartFamilies(points, current),
    first = points[0];
  const rows = [
    ...current.slice(0, 8),
    ...plotted.filter(([id, n]) => n === 0 && world.ancestry.has(id)),
  ];
  const share = (n: number) => (100 * n) / Math.max(1, world.cells.length);
  return (
    <div className="lineage-panel">
      <h3>Recent families</h3>
      <p>
        {current.length} groups · largest share {share(current[0]?.[1] ?? 0).toFixed(1)}%
      </p>
      <LineageChart
        lineages={plotted}
        points={points.map((p) => ({ ...p, lineages: p.families }))}
        label="Recent family population shares"
      />
      <p className="family-key">
        {plotted.map(([id]) => (
          <span key={id}>
            <FamilyName id={id} />
          </span>
        ))}
      </p>
      <table>
        <thead>
          <tr>
            <th>Family / origin</th>
            <th>Share / change</th>
            <th>Motor¹</th>
            <th>A²</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([id, n]) => (
            <FamilyRow
              key={id}
              world={world}
              id={id}
              n={n}
              first={first}
              values={profile.get(id) ?? null}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
      <p>
        Branches span four generations. Membership advances into younger subfamilies; that alone is
        not genetic change. Changes are percentage points since tick {first.tick.toLocaleString()}.
        Chart includes recently dominant groups.
      </p>
      <p>
        ¹ Mean inherited motor target / core. ² Mean A share of A + B processing targets. All shares
        use the living population.
      </p>
    </div>
  );
}

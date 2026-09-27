import { useState } from "react";
import { type LiveStatus } from "./types";
import { BODY_PARTS } from "./bodyParts";

const EFFORTS = [
  "Swim",
  "Turn",
  "Repair",
  "Transport 0",
  "Transport 1",
  "Transport 2",
  "Transport 3",
];
const number = (value: number | null) => (value === null ? "—" : value.toFixed(4));

export function EvolutionPanel({ status }: { status: LiveStatus }) {
  const [open, setOpen] = useState(true);
  return (
    <details open onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Current bodies and recent behavior</summary>
      {open && <EvolutionDetails status={status} />}
    </details>
  );
}
function EvolutionDetails({ status }: { status: LiveStatus }) {
  const e = status.population.evolution;
  const tasks = e.tasks.map((count, task) => ({ count, task })).filter((row) => row.count > 0);
  const total = tasks.reduce((sum, row) => sum + row.count, 0);
  return (
    <>
      <p>
        Compare what living cells have built and what they do. Shared ancestry does not imply shared
        function; different ancestry does not imply different function.
      </p>
      <table>
        <thead>
          <tr>
            <th>Stock</th>
            <th>Actual material · p10 / median / p90</th>
          </tr>
        </thead>
        <tbody>
          {e.body.map((body, i) => (
            <tr key={i}>
              <td>{BODY_PARTS[i]}</td>
              <td>
                {number(body.p10)} / {number(body.median)} / {number(body.p90)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>One vote per living cell. The middle 80% describes variation in funded material.</p>
      <RecentBehavior status={status} />
      <PhenotypeHistory status={status} />
      <p>
        {e.epoch
          ? `Source schedule phase ${e.epoch.phase + 1}; next phase at tick ${e.epoch.nextTick}. New sources use mixture ${e.epoch.mixture.map((q) => q.toFixed(2)).join(", ")}. Existing finite sources retain their contents.`
          : "No source epoch schedule is active."}
      </p>
      <details>
        <summary>Population task-byte distribution</summary>
        <p>Opaque register values, not assigned tasks. {total} living cells sampled.</p>
        <ul>
          {tasks.map((row) => (
            <li key={row.task}>
              Byte {row.task}: {row.count} cells ({((100 * row.count) / total).toFixed(1)}%)
            </li>
          ))}
        </ul>
      </details>
      <details>
        <summary>Genetic and private-learning diagnostics</summary>
        <p>
          {e.distinctSequences} distinct inherited sequences among living cells. Sequence counts do
          not count functional types.
        </p>
        <p>
          Acquired recurrent-weight change: median {number(e.acquiredChange.median)}, middle 80%{" "}
          {number(e.acquiredChange.p10)}–{number(e.acquiredChange.p90)}. Magnitude does not
          establish usefulness.
        </p>
      </details>
    </>
  );
}
function RecentBehavior({ status }: { status: LiveStatus }) {
  const points = status.recent;
  const total = points.reduce((sum, p) => sum + p.population, 0);
  const bins = EFFORTS.map((_, effort) =>
    Array.from({ length: 10 }, (_, i) => points.reduce((sum, p) => sum + p.bins[effort][i], 0))
  );
  return (
    <section>
      <h3>Recent behavior · up to 2,000 ticks</h3>
      <p>
        {points.length} samples from tick {points[0]?.tick ?? "—"} to{" "}
        {points[points.length - 1]?.tick ?? "—"}; {total} cell observations. Each cell votes once
        every 25 ticks; these are sampled efforts, not continuous time or energy expenditure.
        Earlier coverage is not invented.
      </p>
      {bins.map((values, i) => (
        <div key={i}>
          <span>{EFFORTS[i]} · magnitude 0–1</span>
          <svg
            viewBox="0 0 200 45"
            width="100%"
            role="img"
            aria-label={`Recent ${EFFORTS[i]} distribution`}
          >
            {values.map((n, j) => (
              <rect
                key={j}
                x={j * 20}
                y={40 - (40 * n) / Math.max(1, total)}
                width="18"
                height={(40 * n) / Math.max(1, total)}
                fill="#ace4bc"
              >
                <title>
                  {j / 10}–{(j + 1) / 10}: {n} observations
                </title>
              </rect>
            ))}
          </svg>
        </div>
      ))}
    </section>
  );
}
function PhenotypeHistory({ status }: { status: LiveStatus }) {
  const points = status.history,
    first = points[0]?.tick ?? 0,
    last = points[points.length - 1]?.tick ?? first;
  const span = Math.max(1, last - first);
  return (
    <section>
      <h3>Chemical phenotype over time</h3>
      <p>
        Membrane X bins 0–15, bottom to top. Brighter marks mean a greater living share. Marks use
        actual sample times; gaps reflect thinning. This projection does not identify species.
      </p>
      <svg
        viewBox="0 0 320 190"
        width="100%"
        role="img"
        aria-label="Membrane X shares over retained history"
      >
        {points.flatMap((p) =>
          p.membrane.map((count, x) => (
            <rect
              key={`${p.tick}-${x}`}
              x={20 + (290 * (p.tick - first)) / span}
              y={150 - x * 9}
              width="2"
              height="8"
              fill={`hsl(140,40%,${8 + (65 * count) / Math.max(1, p.population)}%)`}
            >
              <title>
                Tick {p.tick}, membrane X {x}: {count}/{p.population} cells
              </title>
            </rect>
          ))
        )}
        <text x="20" y="180">
          {first}
        </text>
        <text x="310" y="180" textAnchor="end">
          {last}
        </text>
      </svg>
    </section>
  );
}

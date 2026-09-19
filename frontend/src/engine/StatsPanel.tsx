import { useState } from "react";
import { type Definition, type HistoryPoint, type LiveStatus } from "./types";
import { EvolutionPanel } from "./EvolutionPanel";

const TRAITS = [
  "Core target · % founder core",
  "Motor investment · % core",
  "Receptor investment · % core",
  "Import investment · % core",
  "Enzyme investment · % core",
  "Membrane X",
  "Membrane Y",
  "Import target X",
  "Import target Y",
];
const EFFORTS = [
  "Swim",
  "Turn magnitude",
  "Repair",
  "Transport 0",
  "Transport 1",
  "Transport 2",
  "Transport 3",
];
const percentage = (a: number, b: number) =>
  b > 0 ? `${((100 * a) / b).toFixed(1)}%` : "— (no denominator)";
function Chart({
  points,
  label,
  value,
}: {
  points: HistoryPoint[];
  label: string;
  value: (p: HistoryPoint) => number;
}) {
  const first = points[0]?.tick ?? 0,
    last = points[points.length - 1]?.tick ?? 0;
  const max = Math.max(1, ...points.map(value));
  return (
    <div className="population-chart">
      <p>{label}</p>
      <svg viewBox="0 0 300 100" role="img" aria-label={label}>
        <text x="0" y="12">
          {max.toFixed(1)}
        </text>
        <text x="0" y="72">
          0
        </text>
        <polyline
          className="chart-line"
          points={points
            .map(
              (p) =>
                `${40 + (250 * (p.tick - first)) / Math.max(1, last - first)},${70 - (60 * value(p)) / max}`
            )
            .join(" ")}
        />
        <text x="40" y="92">
          {first.toLocaleString()}
        </text>
        <text x="290" y="92" textAnchor="end">
          {last.toLocaleString()}
        </text>
      </svg>
    </div>
  );
}
function Histogram({ bins, label }: { bins: number[]; label: string }) {
  const total = bins.reduce((sum, v) => sum + v, 0);
  return (
    <svg viewBox="0 0 200 42" width="100%" role="img" aria-label={label}>
      {bins.map((n, i) => (
        <rect
          key={i}
          x={i * 20 + 1}
          y={40 - (40 * n) / Math.max(1, total)}
          width="18"
          height={(40 * n) / Math.max(1, total)}
          fill="#ace4bc"
        >
          <title>{percentage(n, total)} of living cells</title>
        </rect>
      ))}
    </svg>
  );
}
function Traits({ status }: { status: LiveStatus }) {
  const [selected, setSelected] = useState(5),
    p = status.population;
  return (
    <details>
      <summary>Inherited traits and sampled behavior</summary>
      <p>
        Each living cell contributes once. Targets are inherited construction targets, separate from
        growth and damage.
      </p>
      {p.traits.map((t, i) => (
        <div key={i}>
          <strong>{TRAITS[i]}</strong>
          <p>
            Middle 80%: {t.p10?.toFixed(2) ?? "—"}–{t.p90?.toFixed(2) ?? "—"}; median{" "}
            {t.median?.toFixed(2) ?? "—"}. Histogram 0–{t.ceiling.toFixed(2)}.
          </p>
          <Histogram bins={t.bins} label={TRAITS[i]} />
        </div>
      ))}
      <label>
        Trait trend{" "}
        <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
          {TRAITS.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Chart
        points={status.history}
        label={`Inherited ${TRAITS[selected]} median`}
        value={(p) => p.traits[selected]}
      />
      <p>
        Efforts at the most recent 25-tick sample. These are decisions, not energy expenditures.
      </p>
      {p.efforts.map((t, i) => (
        <div key={i}>
          <span>{EFFORTS[i]} · 0–100%</span>
          <Histogram bins={t.bins} label={EFFORTS[i]} />
        </div>
      ))}
    </details>
  );
}
function Membranes({ status }: { status: LiveStatus }) {
  const max = Math.max(1, ...status.population.membrane);
  return (
    <details>
      <summary>Inherited membrane distribution</summary>
      <p>
        Cells per chemical coordinate, rounded to the nearest species. A dense region of this trait
        space is not a demonstrated species or adaptation.
      </p>
      <svg
        viewBox="0 0 160 160"
        width="100%"
        role="img"
        aria-label="Living cells by inherited membrane X and Y"
      >
        {status.population.membrane.map((count, s) => (
          <rect
            key={s}
            x={Math.floor(s / 16) * 10}
            y={(s % 16) * 10}
            width="9"
            height="9"
            fill={`hsl(140,40%,${8 + (65 * count) / max}%)`}
          >
            <title>
              ({Math.floor(s / 16)},{s % 16}): {count} cells
            </title>
          </rect>
        ))}
      </svg>
    </details>
  );
}
export function StatsPanel({ status, definition }: { status: LiveStatus; definition: Definition }) {
  const s = status.summary,
    l = s.ledger;
  return (
    <section className="panel">
      <h2>Population</h2>
      <p>
        Tick {s.tick.toLocaleString()} · {(s.modelSeconds / 60).toFixed(1)} simulated minutes
      </p>
      <dl className="population-totals">
        {[
          ["Living", s.population],
          ["Divisions", l.divisions],
          ["Died", l.deaths],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      <Chart points={status.history} label="Living population" value={(p) => p.population} />
      <p>{status.history.length} retained observations. Older samples are thinned.</p>
      <dl className="metrics">
        <div>
          <dt>Built material</dt>
          <dd>{s.biomass.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Usable cell energy</dt>
          <dd>{s.cellEnergy.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Living genotypes</dt>
          <dd>{s.genomes.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Highest generation</dt>
          <dd>{s.generation.toLocaleString()}</dd>
        </div>
      </dl>
      <EvolutionPanel status={status} />
      <Membranes status={status} />
      <Traits status={status} />
      <details>
        <summary>Resource accounting and runtime</summary>
        <dl className="metrics">
          {metricRows(status).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p>Accounting errors measure balance, not activity.</p>
      </details>
      {s.stopReason && <p role="status">{s.stopReason}</p>}
      <details>
        <summary>Configuration and cumulative resource accounting</summary>
        <pre>{JSON.stringify({ config: definition.config, ledger: l }, null, 2)}</pre>
      </details>
    </section>
  );
}

function metricRows(status: LiveStatus) {
  const s = status.summary,
    l = s.ledger,
    f = l.flows;
  return [
    ["Highest generation", s.generation],
    ["Living genotypes", s.genomes],
    ["Damage deaths / all deaths", percentage(l.damageDeaths, l.deaths)],
    ["Motor energy · lifetime", f.motors.toFixed(3)],
    ["Repair energy · lifetime", f.repair.toFixed(3)],
    ["Learning energy · lifetime", f.learning.toFixed(3)],
    ["Machinery refitting energy · lifetime", f.refitting.toFixed(3)],
    ["Built material", s.biomass.toFixed(2)],
    ["Usable energy", s.cellEnergy.toFixed(2)],
    ["Imported · lifetime", f.imported.toFixed(3)],
    ["Weathered material · lifetime", l.weatheredMaterial.toFixed(3)],
    ["Weathering heat · lifetime", l.weatheringHeat.toFixed(3)],
    ["Field external work · lifetime", l.weatheringWork.toFixed(3)],
    ["Cell external work · lifetime", l.flows.externalWork.toFixed(3)],
    ["Reservoir travel · total", l.sourceDistance.toFixed(2)],
    ["Converted at release · lifetime", l.sourceConverted.toFixed(3)],
    ["Source conversion heat · lifetime", l.sourceHeat.toFixed(3)],
    ["Reservoir external work · lifetime", l.sourceWork.toFixed(3)],
    ["Exported / imported · lifetime", percentage(f.exported, f.imported)],
    ["Construction / imports · lifetime", percentage(f.constructed, f.imported)],
    ["Material balance error", s.materialResidual.toExponential(2)],
    ["Energy balance error", s.energyResidual.toExponential(2)],
    ["Mutation events", l.mutations],
    ["Births with learned inheritance", l.learnedBirths],
    ["Contact transfers", l.transfers],
    ["Crowded division attempts", l.blockedDivisions],
    ["Ticks / second", status.throughput.toFixed(1)],
    ["WASM memory · MiB", (status.memoryBytes / 1048576).toFixed(0)],
    ["Retained ancestor records", s.ancestryRecords],
  ];
}

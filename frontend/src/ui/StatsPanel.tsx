import { type World } from "../sim/types";
import { summary } from "../sim/stats";
import { lineageColor } from "./drawing";
import { EvolutionStats } from "./EvolutionStats";

export function StatsPanel({ world, throughput }: { world: World; throughput: number }) {
  const s = summary(world);
  const rows = metricRows(s, throughput);
  return (
    <section className="panel">
      <h2>Population</h2>
      <p>
        Tick {world.tick.toLocaleString()} · {(s.time / 60).toFixed(1)} simulated minutes
      </p>
      <dl className="metrics">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {world.stopReason && <p role="status">{world.stopReason}</p>}
      {s.interventions > 0 && (
        <p role="status">Diagnostic run · {s.interventions} manual interventions</p>
      )}
      <EvolutionStats world={world} stats={s.evolution} />
      <h3>Founder lineages</h3>
      <table>
        <thead>
          <tr>
            <th>Founder</th>
            <th>Living descendants</th>
          </tr>
        </thead>
        <tbody>
          {s.lineages.slice(0, 8).map(([id, count]) => (
            <tr key={id}>
              <td>
                <svg width="12" height="12" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" fill={lineageColor(id)} />
                </svg>{" "}
                {id}
              </td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <details>
        <summary>Task-byte distribution</summary>
        <p>{s.tasks.map(([t, n]) => `${t}: ${n}`).join(" · ")}</p>
      </details>
      <details>
        <summary>Configuration and resource accounting</summary>
        <pre>{JSON.stringify({ config: world.config, ledger: world.ledger }, null, 2)}</pre>
      </details>
    </section>
  );
}

function metricRows(s: ReturnType<typeof summary>, throughput: number) {
  return [
    ["Living", s.population],
    ["Born / divisions", `${s.births} / ${s.divisions}`],
    ["Starved", s.deaths],
    ["Highest generation", s.maxGeneration],
    ["Living genomes", s.livingGenomes],
    ["Mutant births", s.mutations],
    ["Nutrient", s.nutrient.toFixed(1)],
    ["External input", s.supplied.toFixed(1)],
    ["Usable energy", s.reserves.toFixed(1)],
    ["Stored nutrient material", s.storedNutrient.toFixed(1)],
    ["Structure built", s.constructedMaterial.toFixed(1)],
    [
      "Energy dissipated",
      (
        s.metabolism +
        s.learning +
        s.motors +
        s.secretion +
        s.construction +
        s.catabolismLoss +
        s.division
      ).toFixed(1),
    ],
    ["Swim distance attempted", s.distance.toFixed(1)],
    ["Motor rotation (radians)", s.turning.toFixed(1)],
    ["Chemical released", s.emitted.toFixed(2)],
    ["Task changes", s.taskWrites],
    ["Energy residual", s.energyResidual.toExponential(1)],
    ["Material residual", s.materialResidual.toExponential(1)],
    ["Ticks / second", throughput.toFixed(1)],
  ];
}

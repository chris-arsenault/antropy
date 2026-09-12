import { memo } from "react";
import { type World } from "../sim/types";
import { summary } from "../sim/stats";
import { EvolutionStats } from "./EvolutionStats";
import { PopulationChart } from "./PopulationChart";
import { type PopulationPoint } from "./populationHistory";
import { InheritedTraits } from "./InheritedTraits";
import { LineagePanel } from "./LineagePanel";
import { FamilyPanel } from "./FamilyPanel";
import { TraitPanel } from "./TraitPanel";
import { StrategyPanel } from "./StrategyPanel";
import { FoodEpochStatus } from "./FoodEpochStatus";

/**
 * The population summary costs about as much as a simulation step, so this panel re-renders only
 * when `statsVersion` or its history props change, not on every animation frame.
 */
export const StatsPanel = memo(function StatsPanel({
  world,
  throughput,
  history,
  recent,
  onSelect,
}: {
  world: World;
  statsVersion: number;
  throughput: number;
  history: PopulationPoint[];
  recent: PopulationPoint[];
  onSelect: (id: number) => void;
}) {
  const s = summary(world);
  const rows = metricRows(s, throughput);
  return (
    <section className="panel">
      <h2>Population</h2>
      <p>
        Tick {world.tick.toLocaleString()} · {(s.time / 60).toFixed(1)} simulated minutes
      </p>
      <PopulationTotals stats={s} />
      <FoodEpochStatus world={world} />
      <p>
        {share(s.impairedPopulationPercent)} of living cells with ≥20% damage ·{" "}
        {share(s.matrixSlowedPopulationPercent)} slowed ≥20% by matrix
      </p>
      <p>
        Matrix: {world.config.matrixMode === "porous" ? "porous; solid walls disabled" : "solid"}.
        {world.config.secretionRate === 0 && " Neutral signaling disabled; no established use."}
      </p>
      <PopulationChart world={world} history={history} />
      <StrategyPanel world={world} history={history} />
      <FamilyPanel world={world} history={recent} onSelect={onSelect} />
      <TraitPanel world={world} history={history} recent={recent} />
      <details>
        <summary>Founder ancestry and original trait report</summary>
        <LineagePanel stats={s} history={history} />
        <InheritedTraits stats={s.inherited} />
      </details>
      <dl className="metrics">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>Accounting errors should remain near zero; they measure balance, not activity.</p>
      {world.stopReason && <p role="status">{world.stopReason}</p>}
      {s.interventions > 0 && (
        <p role="status">Diagnostic run · {s.interventions} manual interventions</p>
      )}
      <EvolutionStats world={world} stats={s.evolution} />
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
});

function PopulationTotals({ stats: s }: { stats: ReturnType<typeof summary> }) {
  return (
    <dl className="population-totals">
      <div>
        <dt>Living</dt>
        <dd>{s.population.toLocaleString()}</dd>
      </div>
      <div>
        <dt>Divisions</dt>
        <dd>{s.divisions.toLocaleString()}</dd>
      </div>
      <div>
        <dt>Died</dt>
        <dd>{s.deaths.toLocaleString()}</dd>
      </div>
    </dl>
  );
}

function metricRows(s: ReturnType<typeof summary>, throughput: number) {
  return [
    ["Born", s.births],
    ["Highest generation", s.maxGeneration],
    ["Living genome records", s.livingGenomeRecords],
    ["Mutant births", s.mutations],
    ["Food A / B", `${s.nutrient.toFixed(1)} / ${s.nutrientB.toFixed(1)}`],
    ["Active finite deposits", s.activeDeposits],
    ["Unreleased deposit material", s.depositMaterial.toFixed(1)],
    ["Food A share of absorbed material · lifetime", share(s.foodAPercent)],
    ["Toxin / absorbed material · lifetime", share(s.toxinAbsorptionPercent)],
    ["Matrix / absorbed material · lifetime", share(s.matrixAbsorptionPercent)],
    ["Mean damage", `${(100 * s.meanDamage).toFixed(1)}%`],
    ["Damage share of deaths · lifetime", share(s.damageDeathPercent)],
    ["Repair share of dissipated energy · lifetime", share(s.repairEnergyPercent)],
    ["Motor share of dissipated energy · lifetime", share(s.motorEnergyPercent)],
    ["Synthesis share of dissipated energy · lifetime", share(s.synthesisEnergyPercent)],
    ["Learning share of dissipated energy · lifetime", share(s.learningEnergyPercent)],
    ["Decomposing material", s.detritus.toFixed(1)],
    ["Inorganic carbon / oxygen", `${s.carbon.toFixed(1)} / ${s.oxygen.toFixed(1)}`],
    ["Fixed from carbon · lifetime", s.fixed.toFixed(1)],
    ["World area at half speed or less · now", share(s.matrixHalfSpeedWorldPercent, 3)],
    ["External input", s.supplied.toFixed(1)],
    ["Usable energy", s.reserves.toFixed(1)],
    ["Stored nutrient material", s.storedNutrient.toFixed(1)],
    ["Construction / absorbed material · lifetime", share(s.constructionAbsorptionPercent)],
    ["Energy accounting error / total input", errorShare(s.energyResidualPercent)],
    ["Material accounting error / total input", errorShare(s.materialResidualPercent)],
    ["Ticks / second", throughput.toFixed(1)],
  ];
}
function share(value: number | null, digits = 1): string {
  return value === null ? "— (no denominator)" : `${value.toFixed(digits)}%`;
}
function errorShare(value: number | null): string {
  return value === null ? "— (no denominator)" : `${value.toExponential(1)}%`;
}

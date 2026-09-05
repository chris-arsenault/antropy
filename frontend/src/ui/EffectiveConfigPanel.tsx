import { eggCarryCapacity, spoilCapacity } from "../sim/capacity";
import { type SimConfig } from "../sim/config";
import {
  AUTHORED_NEST_FIXTURE,
  AUTHORED_NEST_TRAIL,
  DIG,
  ENERGY,
  FOOD_GOVERNOR,
} from "../sim/tunables";
import { type World } from "../sim/world";

type GateKey = {
  [Key in keyof SimConfig]: SimConfig[Key] extends boolean ? Key : never;
}[keyof SimConfig];

const GATES: readonly { key: GateKey; label: string }[] = [
  { key: "terrainDigging", label: "terrain digging" },
  { key: "mortality", label: "mortality" },
  { key: "workerReproduction", label: "worker reproduction" },
  { key: "colonyFounding", label: "colony founding" },
  { key: "geneticVariation", label: "genetic variation" },
  { key: "broodTransport", label: "brood transport" },
  { key: "motorJitter", label: "motor jitter" },
  { key: "materialColonyOdor", label: "material colony odor" },
  { key: "contactFoodOdor", label: "contact food odor" },
  { key: "authoredNestTrail", label: "authored entrance trail" },
  { key: "nestDecay", label: "nest decay" },
  { key: "seasons", label: "seasons" },
  { key: "weather", label: "weather" },
  { key: "microclimate", label: "microclimate" },
  { key: "eggExposure", label: "egg exposure" },
  { key: "larvalRearing", label: "larval rearing" },
  { key: "autoContinue", label: "automatic refounding" },
  { key: "wideEntranceShaft", label: "wide founding shaft" },
  { key: "spoilHauling", label: "spoil hauling" },
];

const TUNABLES: readonly { label: string; value: () => number }[] = [
  {
    label: "authored worker energy fraction",
    value: () => AUTHORED_NEST_FIXTURE.workerEnergyFraction,
  },
  { label: "authored trail strength", value: () => AUTHORED_NEST_TRAIL.entranceStrength },
  { label: "authored trail warmup", value: () => AUTHORED_NEST_TRAIL.fixtureWarmupPasses },
  { label: "food energy", value: () => ENERGY.foodEnergy },
  { label: "energy tank", value: () => ENERGY.max },
  { label: "basal cost / tick", value: () => ENERGY.basalPerTick },
  { label: "sensor cost / tick", value: () => ENERGY.sensorUpkeep },
  { label: "movement cost / step", value: () => ENERGY.stepCost },
  { label: "thinking cost scale", value: () => ENERGY.thinkCostScale },
  { label: "signal cost / unit", value: () => ENERGY.depositCostPerUnit },
  { label: "food pickup cost", value: () => DIG.cost.foodPickup },
  { label: "food deposit cost", value: () => DIG.depositCost },
  { label: "surface food target", value: () => FOOD_GOVERNOR.targetCount },
  { label: "food spawn / pass", value: () => FOOD_GOVERNOR.maxSpawnPerPass },
];

function capacityRange(world: World, capacity: (ant: World["ants"][number]) => number): string {
  const values = [...new Set(world.ants.filter((ant) => ant.alive).map(capacity))].sort(
    (a, b) => a - b
  );
  if (values.length === 0) {
    return "genome-derived";
  }
  return values.length === 1 ? String(values[0]) : `${values[0]}–${values[values.length - 1]}`;
}

function capacityLabel(override: number | null, derived: string): string {
  return override === null ? `${derived} (genome)` : `${Math.floor(override)} (override)`;
}

/** Exact per-world gate and cargo state; this is configuration, not a scenario label. */
export function EffectiveConfigPanel({ world }: { world: World }) {
  const brood = capacityRange(world, (ant) => eggCarryCapacity(ant, world.config));
  const spoil = capacityRange(world, (ant) => spoilCapacity(ant, world.config));
  return (
    <figure className="chart" data-testid="effective-config">
      <figcaption className="chart-title">Effective world configuration</figcaption>
      <div className="layer-rows">
        {GATES.map(({ key, label }) => (
          <div key={key} className="layer-row">
            <span className="ratio-label">{label}</span>
            <span className="ratio-value">{world.config[key] ? "on" : "off"}</span>
          </div>
        ))}
        <div className="layer-row">
          <span className="ratio-label">brood capacity</span>
          <span className="ratio-value">{capacityLabel(world.config.broodCapacity, brood)}</span>
        </div>
        <div className="layer-row">
          <span className="ratio-label">spoil capacity</span>
          <span className="ratio-value">{capacityLabel(world.config.spoilCapacity, spoil)}</span>
        </div>
        {TUNABLES.map(({ label, value }) => (
          <div key={label} className="layer-row">
            <span className="ratio-label">{label}</span>
            <span className="ratio-value">{value()}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

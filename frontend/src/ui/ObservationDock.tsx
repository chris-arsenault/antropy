import { useState } from "react";
import { ChartsPanel } from "./ChartsPanel";
import { EffectiveConfigPanel } from "./EffectiveConfigPanel";
import { EvolutionPanel } from "./EvolutionPanel";
import { InspectorPanel } from "./InspectorPanel";
import { MapLayersPanel } from "./MapLayersPanel";
import { RatiosPanel } from "./RatiosPanel";
import { type LayerVisibility } from "./WorldView";
import { type SimulationHandle } from "./useSimulation";
import { HabitatPanel } from "./HabitatPanel";
import { ThroughputPanel } from "./ThroughputPanel";
import { BehaviorPanel } from "./BehaviorPanel";
import { GrowthPanel } from "./GrowthPanel";

export function ObservationDock(props: {
  simulation: SimulationHandle;
  layers: LayerVisibility;
  onLayer(key: keyof LayerVisibility, value: boolean): void;
}) {
  const [tab, setTab] = useState("Metrics"),
    [collapsed, setCollapsed] = useState(false);
  const { simulation } = props;
  return (
    <aside className={`observation-dock${collapsed ? " collapsed" : ""}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Show observation panels" : "Hide observation panels"}
      >
        {collapsed ? "‹" : "›"}
      </button>
      <div hidden={collapsed}>
        <nav className="dock-tabs" aria-label="Observation panels">
          {["Inspect", "Metrics", "Layers"].map((name) => (
            <button key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>
              {name}
            </button>
          ))}
        </nav>
        <div hidden={tab !== "Inspect"}>
          <InspectorPanel world={simulation.world} onTask={simulation.setTask} />
        </div>
        <div hidden={tab !== "Metrics"} className="dock-metrics">
          <ThroughputPanel simulation={simulation} />
          <GrowthPanel world={simulation.world} />
          <BehaviorPanel world={simulation.world} />
          <HabitatPanel world={simulation.world} />
          <ChartsPanel history={simulation.history} />
          <RatiosPanel world={simulation.world} />
          <EvolutionPanel world={simulation.world} />
          <EffectiveConfigPanel world={simulation.world} />
        </div>
        <div hidden={tab !== "Layers"}>
          <MapLayersPanel layers={props.layers} onChange={props.onLayer} />
        </div>
      </div>
    </aside>
  );
}

import { useState } from "react";
import { foundColony } from "./sim/colony";
import { type World } from "./sim/world";
import { ChartsPanel } from "./ui/ChartsPanel";
import { InspectorPanel } from "./ui/InspectorPanel";
import { SPEED_PRESETS, isChartsOnly, type SpeedPreset } from "./ui/pacing";
import { useSimulation } from "./ui/useSimulation";
import { WorldView } from "./ui/WorldView";

const DEFAULT_SEED = 1;

function seedPopulation(world: World): void {
  foundColony(world);
}

export function App() {
  const sim = useSimulation(DEFAULT_SEED, seedPopulation);
  const [selectedAntId, setSelectedAntId] = useState<number | null>(null);

  const selectedAnt = sim.world.ants.find((ant) => ant.id === selectedAntId) ?? null;

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Antropy</h1>
        <p className="status-line">
          Tick <span data-testid="tick">{sim.tick}</span> · seed {sim.world.seed} · ants{" "}
          {sim.stats?.population ?? 0}
        </p>
        <div className="controls">
          <button type="button" onClick={sim.running ? sim.pause : sim.start}>
            {sim.running ? "Pause" : "Run"}
          </button>
          <label className="speed-label">
            Speed
            <select
              value={sim.speed}
              onChange={(event) => sim.setSpeed(Number(event.target.value) as SpeedPreset)}
            >
              {SPEED_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}×
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="app-body">
        <WorldView
          world={sim.world}
          chartsOnly={isChartsOnly(sim.speed)}
          alphaRef={sim.alphaRef}
          onPickAnt={setSelectedAntId}
        />
        <ChartsPanel history={sim.history} stats={sim.stats} version={sim.tick} />
        <InspectorPanel
          ant={selectedAnt}
          controller={sim.world.controller}
          onClose={() => setSelectedAntId(null)}
        />
      </div>
    </main>
  );
}

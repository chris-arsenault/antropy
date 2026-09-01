import { useState } from "react";
import { foundColony } from "./sim/colony";
import { createWorld, type World } from "./sim/world";
import { ChartsPanel } from "./ui/ChartsPanel";
import { InspectorPanel } from "./ui/InspectorPanel";
import { DEFAULT_LAYERS, MapLayersPanel, type LayerVisibility } from "./ui/MapLayersPanel";
import { PersistenceControls } from "./ui/PersistenceControls";
import { SPEED_PRESETS, isChartsOnly, type SpeedPreset } from "./ui/pacing";
import { useSimulation } from "./ui/useSimulation";
import { WorldView } from "./ui/WorldView";

const DEFAULT_SEED = 1;

function freshWorldFactory(seed: number): () => World {
  return () => {
    const world = createWorld(seed);
    foundColony(world);
    return world;
  };
}

interface Run {
  id: number;
  factory: () => World;
}

export function App() {
  const [seedInput, setSeedInput] = useState(String(DEFAULT_SEED));
  const [run, setRun] = useState<Run>({ id: 0, factory: freshWorldFactory(DEFAULT_SEED) });

  const restart = (factory: () => World) => {
    setRun((previous) => ({ id: previous.id + 1, factory }));
  };

  const newWorld = () => {
    const seed = Number.parseInt(seedInput, 10);
    if (Number.isFinite(seed)) {
      restart(freshWorldFactory(seed));
    }
  };

  return (
    <SimRun
      key={run.id}
      factory={run.factory}
      seedInput={seedInput}
      onSeedInput={setSeedInput}
      onNewWorld={newWorld}
      onRestore={restart}
    />
  );
}

interface SimRunProps {
  factory: () => World;
  seedInput: string;
  onSeedInput(value: string): void;
  onNewWorld(): void;
  onRestore(factory: () => World): void;
}

const DEFAULT_GROUND_OPACITY = 0.25;

function SimRun({ factory, seedInput, onSeedInput, onNewWorld, onRestore }: SimRunProps) {
  const sim = useSimulation(factory);
  const [selectedAntId, setSelectedAntId] = useState<number | null>(null);
  const [groundOpacity, setGroundOpacity] = useState(DEFAULT_GROUND_OPACITY);
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS);
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
          <label className="speed-label">
            Seed
            <input
              className="seed-input"
              value={seedInput}
              onChange={(event) => onSeedInput(event.target.value)}
            />
          </label>
          <button type="button" onClick={onNewWorld}>
            New world
          </button>
          <PersistenceControls world={sim.world} onRestore={onRestore} />
        </div>
      </header>
      <div className="app-body">
        <WorldView
          world={sim.world}
          chartsOnly={isChartsOnly(sim.speed)}
          groundOpacity={groundOpacity}
          layers={layers}
          alphaRef={sim.alphaRef}
          onPickAnt={setSelectedAntId}
        />
        <section className="charts-panel">
          <ChartsPanel history={sim.history} stats={sim.stats} version={sim.tick} />
          <MapLayersPanel
            layers={layers}
            onToggle={(layer, visible) => setLayers((prev) => ({ ...prev, [layer]: visible }))}
            groundOpacity={groundOpacity}
            onGroundOpacity={setGroundOpacity}
          />
        </section>
        <InspectorPanel
          ant={selectedAnt}
          controller={sim.world.controller}
          onClose={() => setSelectedAntId(null)}
        />
      </div>
    </main>
  );
}

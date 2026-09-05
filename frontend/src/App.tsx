import { useState } from "react";
import { type World } from "./sim/world";
import { SCENARIOS, scenarioById, type ScenarioId } from "./ui/scenarios";
import { ChartsPanel } from "./ui/ChartsPanel";
import { EffectiveConfigPanel } from "./ui/EffectiveConfigPanel";
import { EvolutionPanel } from "./ui/EvolutionPanel";
import { InspectorPanel } from "./ui/InspectorPanel";
import { DEFAULT_LAYERS, MapLayersPanel, type LayerVisibility } from "./ui/MapLayersPanel";
import { RatiosPanel } from "./ui/RatiosPanel";
import { PersistenceControls } from "./ui/PersistenceControls";
import { SPEED_PRESETS, isChartsOnly, type SpeedPreset } from "./ui/pacing";
import { useSimulation } from "./ui/useSimulation";
import { WorldView } from "./ui/WorldView";

const DEFAULT_SEED = 1;
const DEFAULT_SCENARIO: ScenarioId = "programmed";

function freshWorldFactory(scenario: ScenarioId, seed: number): () => World {
  return () => scenarioById(scenario).build(seed);
}

interface Run {
  id: number;
  factory: () => World;
}

export function App() {
  const [seedInput, setSeedInput] = useState(String(DEFAULT_SEED));
  const [scenario, setScenario] = useState<ScenarioId>(DEFAULT_SCENARIO);
  const [run, setRun] = useState<Run>({
    id: 0,
    factory: freshWorldFactory(DEFAULT_SCENARIO, DEFAULT_SEED),
  });

  const restart = (factory: () => World) => {
    setRun((previous) => ({ id: previous.id + 1, factory }));
  };

  const parsedSeed = () => {
    const seed = Number.parseInt(seedInput, 10);
    return Number.isFinite(seed) ? seed : DEFAULT_SEED;
  };

  const newWorld = () => {
    restart(freshWorldFactory(scenario, parsedSeed()));
  };

  // Switching scenario restarts immediately: the world it builds is the
  // whole point of the choice.
  const chooseScenario = (id: ScenarioId) => {
    setScenario(id);
    restart(freshWorldFactory(id, parsedSeed()));
  };

  return (
    <SimRun
      key={run.id}
      factory={run.factory}
      seedInput={seedInput}
      onSeedInput={setSeedInput}
      onNewWorld={newWorld}
      onRestore={restart}
      scenario={scenario}
      onScenario={chooseScenario}
    />
  );
}

interface SimRunProps {
  factory: () => World;
  seedInput: string;
  onSeedInput(value: string): void;
  onNewWorld(): void;
  onRestore(factory: () => World): void;
  scenario: ScenarioId;
  onScenario(id: ScenarioId): void;
}

const DEFAULT_GROUND_OPACITY = 0.25;

interface ControlBarProps {
  sim: ReturnType<typeof useSimulation>;
  scenario: ScenarioId;
  onScenario(id: ScenarioId): void;
  seedInput: string;
  onSeedInput(value: string): void;
  onNewWorld(): void;
  onRestore(factory: () => World): void;
}

function ControlBar({
  sim,
  scenario,
  onScenario,
  seedInput,
  onSeedInput,
  onNewWorld,
  onRestore,
}: ControlBarProps) {
  return (
    <div className="controls">
      <button type="button" onClick={sim.running ? sim.pause : sim.start}>
        {sim.running ? "Pause" : "Run"}
      </button>
      <label className="speed-label">
        Scenario
        <select
          data-testid="scenario-select"
          value={scenario}
          onChange={(event) => onScenario(event.target.value as ScenarioId)}
        >
          {SCENARIOS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="speed-label">
        Speed
        <select
          data-testid="speed-select"
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
  );
}

function SimRun({
  factory,
  seedInput,
  onSeedInput,
  onNewWorld,
  onRestore,
  scenario,
  onScenario,
}: SimRunProps) {
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
        <ControlBar
          sim={sim}
          scenario={scenario}
          onScenario={onScenario}
          seedInput={seedInput}
          onSeedInput={onSeedInput}
          onNewWorld={onNewWorld}
          onRestore={onRestore}
        />
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
          <RatiosPanel stats={sim.stats} />
          <EvolutionPanel stats={sim.stats} />
          <EffectiveConfigPanel world={sim.world} />
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

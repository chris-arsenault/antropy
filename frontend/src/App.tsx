import { useCallback, useState } from "react";
import { createWorld } from "./sim/world";
import { DEFAULT_CONFIG, type Config } from "./sim/config";
import { type World } from "./sim/types";
import { useSimulation } from "./ui/useSimulation";
import { SPEEDS, type Speed } from "./ui/pacing";
import { WorldView } from "./ui/WorldView";
import { StatsPanel } from "./ui/StatsPanel";
import { Inspector } from "./ui/Inspector";
import { PersistenceControls } from "./ui/PersistenceControls";
import { EvolutionSettings } from "./ui/EvolutionSettings";
import { FoodEpochSettings } from "./ui/FoodEpochSettings";

export function App() {
  const [run, setRun] = useState(() => ({ id: 0, world: createWorld() }));
  const restore = useCallback((world: World) => setRun((r) => ({ id: r.id + 1, world })), []);
  return <Simulation key={run.id} world={run.world} onRestore={restore} />;
}
function RunControls({ world, sim }: { world: World; sim: ReturnType<typeof useSimulation> }) {
  const status = sim.running ? "Running" : "Paused";
  return (
    <div className="run-controls">
      <button
        className="primary"
        disabled={!!world.stopReason}
        onClick={() => sim.setRunning(!sim.running)}
      >
        {sim.running ? "Pause" : "Run"}
      </button>
      <label>
        Speed{" "}
        <select
          value={sim.speed}
          onChange={(e) =>
            sim.setSpeed(e.target.value === "max" ? "max" : (Number(e.target.value) as Speed))
          }
        >
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed === "max" ? "Maximum" : speed + " ticks/s"}
            </option>
          ))}
        </select>
      </label>
      <span>
        Live mutation{" "}
        {world.config.mutationRate + world.config.physicalMutationRate > 0 ? "on" : "off"}
      </span>
      <span className={`run-status ${sim.running ? "is-running" : ""}`}>
        {world.stopReason ? "Stopped" : status}
      </span>
    </div>
  );
}
function Simulation({ world, onRestore }: { world: World; onRestore: (world: World) => void }) {
  const sim = useSimulation(world),
    [selected, setSelected] = useState<number | null>(null);
  return (
    <main>
      <header>
        <div>
          <h1>Antropy</h1>
          <p>Top-down bacteria · inherited RNN behavior</p>
        </div>
        <RunControls world={world} sim={sim} />
      </header>
      <div className="workspace">
        <WorldView world={world} version={sim.version} selected={selected} onSelect={setSelected} />
        <aside>
          <StatsPanel
            world={world}
            statsVersion={sim.statsVersion}
            throughput={sim.throughput}
            history={sim.history}
            recent={sim.recent}
            onSelect={setSelected}
          />
          <Inspector
            world={world}
            statsVersion={sim.statsVersion}
            selected={selected}
            onChange={sim.refresh}
          />
        </aside>
      </div>
      <div className="settings">
        <Environment world={world} onRestore={onRestore} />
        <PersistenceControls world={world} onRestore={onRestore} />
      </div>
      <details className="panel">
        <summary>Population history</summary>
        <p>
          {sim.history
            .slice(-20)
            .map((p) => p.tick + ": " + p.population)
            .join(" → ")}
        </p>
      </details>
    </main>
  );
}
function Environment({ world, onRestore }: { world: World; onRestore: (world: World) => void }) {
  const [evolution, setEvolution] = useState(world.config);
  const [seed, setSeed] = useState(String(world.seed)),
    [regime, setRegime] = useState(world.config.regime);
  const [mutation, setMutation] = useState(
      world.config.mutationRate + world.config.physicalMutationRate > 0
    ),
    [message, setMessage] = useState("");
  const restart = () => {
    try {
      const parsed = Number(seed);
      if (!Number.isInteger(parsed)) throw new Error("Seed must be an integer");
      const config: Config = {
        ...evolution,
        regime,
        mutationRate: mutation ? DEFAULT_CONFIG.mutationRate : 0,
        physicalMutationRate: mutation ? DEFAULT_CONFIG.physicalMutationRate : 0,
      };
      onRestore(createWorld(parsed, config));
    } catch (e) {
      setMessage(String(e));
    }
  };
  return (
    <details className="panel">
      <summary>Environment and new population</summary>
      <label>
        Seed <input value={seed} onChange={(e) => setSeed(e.target.value)} />
      </label>
      <label>
        Nutrient sources{" "}
        <select value={regime} onChange={(e) => setRegime(e.target.value as Config["regime"])}>
          <option value="patchy">Mixed finite deposits</option>
          <option value="persistent">Long-lived finite deposits</option>
          <option value="transient">Transient patches</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={mutation} onChange={(e) => setMutation(e.target.checked)} />{" "}
        Mutate at division
      </label>
      <button onClick={restart}>Apply and restart</button>
      <FoodEpochSettings config={evolution} onChange={setEvolution} />
      <EvolutionSettings config={evolution} onChange={setEvolution} />
      <p role="status">{message}</p>
    </details>
  );
}

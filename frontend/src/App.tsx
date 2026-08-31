import { populateDebugWalkers } from "./sim/world";
import { SPEED_PRESETS, isChartsOnly, type SpeedPreset } from "./ui/pacing";
import { useSimulation } from "./ui/useSimulation";
import { WorldView } from "./ui/WorldView";

const DEFAULT_SEED = 1;
const DEBUG_WALKER_COUNT = 60;

function seedPopulation(world: Parameters<typeof populateDebugWalkers>[0]): void {
  populateDebugWalkers(world, DEBUG_WALKER_COUNT);
}

export function App() {
  const sim = useSimulation(DEFAULT_SEED, seedPopulation);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Antropy</h1>
        <p className="status-line">
          Tick <span data-testid="tick">{sim.tick}</span> · seed {sim.world.seed}
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
      <WorldView world={sim.world} chartsOnly={isChartsOnly(sim.speed)} alphaRef={sim.alphaRef} />
    </main>
  );
}
